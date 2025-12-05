// app/api/signature/create/route.ts
import { NextRequest, NextResponse } from "next/server";
import { dbPromise } from "../../lib/mongodb";
import { ObjectId } from "mongodb";
import { sendSignatureRequestEmail } from "@/lib/emailService";
import { verifyUserFromRequest } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    // ✅ Use JWT authentication
    const user = await verifyUserFromRequest(request);
    if (!user) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { documentId, recipients, signatureFields, message, dueDate, viewMode , signingOrder } = await request.json();
    const db = await dbPromise;

    // ✅ Get current user details
    const ownerId = user.id;
    const ownerEmail = user.email;

    const userDoc = await db.collection('users').findOne({
      _id: new ObjectId(ownerId)
    });
    const ownerName = userDoc?.profile?.fullName || userDoc?.email || user.email;

    // ✅ Verify document exists and belongs to user
    const document = await db.collection("documents").findOne({
      _id: new ObjectId(documentId),
      userId: ownerId,
    });

    if (!document) {
      return NextResponse.json(
        { success: false, message: "Document not found or access denied" },
        { status: 404 }
      );
    }

    console.log('📝 Creating signature requests for', recipients.length, 'recipients');
    console.log('👤 Owner:', ownerName, '(', ownerEmail, ')');

    const signatureRequests = [];
    const emailPromises = [];

    for (let i = 0; i < recipients.length; i++) {
      const recipient = recipients[i];
      const uniqueId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}-${i}`;

      //   Determine initial status based on signing order
  const initialStatus = signingOrder === 'sequential' 
    ? (i === 0 ? 'pending' : 'awaiting_turn')  // First person is 'pending', rest wait
    : 'pending';  // Everyone is 'pending' for 'any' order

      //   ADD .map() to enrich fields with recipient details
      const enrichedSignatureFields = viewMode === 'shared'
        ? signatureFields.map((f: any) => ({
            ...f,
            recipientName: recipients[f.recipientIndex]?.name || `Recipient ${f.recipientIndex + 1}`,
            recipientEmail: recipients[f.recipientIndex]?.email || '',
          }))
        : signatureFields
            .filter((f: any) => f.recipientIndex === i)
            .map((f: any) => ({
              ...f,
              recipientName: recipients[f.recipientIndex]?.name || `Recipient ${f.recipientIndex + 1}`,
              recipientEmail: recipients[f.recipientIndex]?.email || '',
            }));

      const signatureRequest = {
        uniqueId,
        documentId: documentId,
        ownerId: ownerId, // ✅ Now properly set!
        ownerEmail: ownerEmail, // ✅ Now properly set!
        recipient: {
          name: recipient.name,
          email: recipient.email,
          role: recipient.role || '',
        },
        recipientIndex: i,
        // ✅ KEEP ORIGINAL signatureFields (do NOT replace)
        signingOrder: signingOrder || 'any', //   ADD THIS
        signatureFields: viewMode === 'shared'
          ? signatureFields  // All fields if shared
          : signatureFields.filter((f: any) => f.recipientIndex === i), // Only their fields if isolated
        viewMode: viewMode || 'isolated', // ADD THIS
        message: message || '',
        dueDate: dueDate || null,
        status: initialStatus, //   Use dynamic status
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
       status: initialStatus, //   Return actual status
      });

      //   Only send email to first person if sequential order
  if (signingOrder === 'sequential' && i > 0) {
    console.log(`⏳ Skipping email for ${recipient.email} - awaiting turn`);
    continue; // Skip sending email
  }

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
          return null;
        })
      );
    }

    console.log('📧 Sending', emailPromises.length, 'emails...');
    await Promise.all(emailPromises);
    console.log('✅ All emails sent');

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
