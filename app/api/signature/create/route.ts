// app/api/signature/create/route.ts
import { NextRequest, NextResponse } from "next/server";
import { dbPromise } from "../../lib/mongodb";
import { ObjectId } from "mongodb";
import { sendSignatureRequestEmail } from "@/lib/emailService";
import { cookies } from "next/headers";

export async function POST(request: NextRequest) {
  try {
    const { documentId, recipients, signatureFields, message, dueDate } = await request.json();
    
    // Get user session (assuming you have auth)
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('session')?.value;
    
    const db = await dbPromise;

    // Get current user (owner)
    let ownerId = null;
    let ownerName = 'Document Owner';
    let ownerEmail = '';
    
    if (sessionToken) {
      const session = await db.collection('sessions').findOne({ token: sessionToken });
      if (session) {
        ownerId = session.userId;
        const user = await db.collection('users').findOne({ _id: new ObjectId(ownerId) });
        if (user) {
          ownerName = user.name || user.email;
          ownerEmail = user.email;
        }
      }
    }

    // Verify document exists
    const document = await db.collection("documents").findOne({
      _id: new ObjectId(documentId),
    });

    if (!document) {
      return NextResponse.json(
        { success: false, message: "Document not found" },
        { status: 404 }
      );
    }

    console.log('📝 Creating signature requests for', recipients.length, 'recipients');

    // Create signature requests for each recipient
    const signatureRequests = [];
    const emailPromises = [];
    
    for (let i = 0; i < recipients.length; i++) {
      const recipient = recipients[i];
      const uniqueId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}-${i}`;
      
      const signatureRequest = {
        uniqueId,
        documentId: documentId,
        ownerId: ownerId,
        ownerEmail: ownerEmail,
        recipient: {
          name: recipient.name,
          email: recipient.email,
          role: recipient.role || '',
        },
        recipientIndex: i,
        signatureFields: signatureFields.filter((f: any) => f.recipientIndex === i),
        message: message || '',
        dueDate: dueDate || null,
        status: 'pending',
        createdAt: new Date(),
        viewedAt: null,
        signedAt: null,
        completedAt: null,
        signedFields: null,
        ipAddress: null,
      };

      const result = await db.collection("signature_requests").insertOne(signatureRequest);
      
      const signingLink = `${request.nextUrl.origin}/sign/${uniqueId}`;
      
      signatureRequests.push({
        id: result.insertedId,
        uniqueId,
        recipient: recipient.name,
        email: recipient.email,
        link: signingLink,
        status: 'pending',
      });

      // Send email to this recipient (don't await, do it in parallel)
      emailPromises.push(
        sendSignatureRequestEmail({
          recipientName: recipient.name,
          recipientEmail: recipient.email,
          documentName: document.filename,
          signingLink: signingLink,
          senderName: ownerName,
          message: message,
          dueDate: dueDate,
        }).catch(err => {
          console.error(`❌ Failed to send email to ${recipient.email}:`, err);
          // Don't fail the whole request if email fails
          return null;
        })
      );
    }

    // Wait for all emails to be sent
    console.log('📧 Sending', emailPromises.length, 'emails...');
    await Promise.all(emailPromises);
    console.log('✅ All emails sent (or failed gracefully)');

    // Update document status
    await db.collection("documents").updateOne(
      { _id: new ObjectId(documentId) },
      {
        $set: {
          status: 'pending_signature',
          sentForSignature: true,
          sentAt: new Date(),
          totalRecipients: recipients.length,
          signedCount: 0,
        },
      }
    );

    return NextResponse.json({
      success: true,
      signatureRequests,
      message: `Signature requests created and sent to ${recipients.length} recipient${recipients.length > 1 ? 's' : ''}`,
    });
  } catch (error) {
    console.error("❌ Error creating signature requests:", error);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}