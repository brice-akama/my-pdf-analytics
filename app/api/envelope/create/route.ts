// my-pdf-analytics/app/api/envelope/create/route.ts

import { NextRequest, NextResponse } from "next/server";
import { verifyUserFromRequest } from "@/lib/auth";
import { dbPromise } from "../../lib/mongodb";
import { ObjectId } from "mongodb";
import { sendEnvelopeEmail } from "@/lib/emailService";
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: NextRequest) {
  try {
    const user = await verifyUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { 
      documentIds, // Array of document IDs to include
      recipients,  // Array of recipients
      signatureFields, // Signature fields for ALL documents
      message,
      dueDate,
      expirationDays 
    } = await request.json();

    // Validate
    if (!documentIds || documentIds.length < 2) {
      return NextResponse.json(
        { success: false, message: "Envelopes must contain at least 2 documents" },
        { status: 400 }
      );
    }

    if (!recipients || recipients.length === 0) {
      return NextResponse.json(
        { success: false, message: "At least one recipient is required" },
        { status: 400 }
      );
    }

    const db = await dbPromise;
    const envelopeId = `env_${uuidv4()}`;

    // Get all documents
    const documents = await db.collection("documents").find({
      _id: { $in: documentIds.map((id: string) => new ObjectId(id)) },
      userId: user.id,
    }).toArray();

    if (documents.length !== documentIds.length) {
      return NextResponse.json(
        { success: false, message: "Some documents not found or access denied" },
        { status: 404 }
      );
    }

    // Calculate expiration
    let expiresAt = null;
    if (expirationDays && expirationDays !== 'never') {
      expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + parseInt(expirationDays));
    }

    // Prepare documents with order
    const orderedDocuments = documents.map((doc, index) => ({
      documentId: doc._id,
      filename: doc.originalFilename || doc.filename,
      order: index + 1,
      numPages: doc.numPages || 1,
    }));

    // Create envelope
    const envelope = {
      envelopeId,
      ownerId: user.id,
      ownerEmail: user.email,
      documents: orderedDocuments,
      recipients: recipients.map((r: any, index: number) => ({
        name: r.name,
        email: r.email,
        recipientIndex: index,
        uniqueId: `${envelopeId}_recipient_${index}`,
        status: 'pending',
        viewedAt: null,
        completedAt: null,
        signedDocuments: [], // Track which docs are signed
      })),
      signatureFields: signatureFields, // All fields for all documents
      message: message || '',
      dueDate: dueDate || null,
      expiresAt: expiresAt,
      status: 'pending',
      createdAt: new Date(),
      completedAt: null,
    };

    await db.collection("envelopes").insertOne(envelope);

    // Send emails to recipients
    const emailPromises = envelope.recipients.map((recipient: any) => {
      const signingLink = `${process.env.NEXT_PUBLIC_BASE_URL}/envelope/${recipient.uniqueId}`;
      
      return sendEnvelopeEmail({
        recipientName: recipient.name,
        recipientEmail: recipient.email,
        documentCount: documents.length,
        documentNames: documents.map(d => d.originalFilename || d.filename),
        signingLink: signingLink,
        senderName: user.email,
        message: message,
        dueDate: dueDate,
      }).catch(err => {
        console.error(`Failed to send envelope to ${recipient.email}:`, err);
        return null;
      });
    });

    await Promise.all(emailPromises);

    console.log(`✅ Envelope created: ${envelopeId} with ${documents.length} documents`);

    return NextResponse.json({
      success: true,
      envelopeId: envelopeId,
      recipients: envelope.recipients,
      message: `Envelope sent to ${recipients.length} recipient(s)`,
    });

  } catch (error) {
    console.error("❌ Error creating envelope:", error);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}