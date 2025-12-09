// app/api/signature/create/route.ts
import { NextRequest, NextResponse } from "next/server";
import { dbPromise } from "../../lib/mongodb";
import { ObjectId } from "mongodb";
import { sendCCNotificationEmail, sendSignatureRequestEmail } from "@/lib/emailService";
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

    const { documentId, recipients, signatureFields, message, dueDate, viewMode , signingOrder, expirationDays, ccRecipients  } = await request.json();
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
    const ccRecipientLinks = []; // NEW: Track CC links

    for (let i = 0; i < recipients.length; i++) {
      const recipient = recipients[i];
      const uniqueId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}-${i}`;

      //   Calculate expiration date
      let expiresAt = null;
      if (expirationDays && expirationDays !== 'never') {
        const days = parseInt(expirationDays);
        expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + days);
      }

      console.log('📅 Signature request will expire:', expiresAt || 'Never');

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
        ownerId: ownerId,
        ownerEmail: ownerEmail,
        recipient: {
          name: recipient.name,
          email: recipient.email,
          role: recipient.role || '',
        },
        recipientIndex: i,
        signingOrder: signingOrder || 'any',
        expirationDays: expirationDays || '30',
        signatureFields: enrichedSignatureFields,
        viewMode: viewMode || 'isolated',
        message: message || '',
        dueDate: dueDate || null,
        expiresAt: expiresAt,
        status: initialStatus,
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
        status: initialStatus,
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
          originalFilename: document.originalFilename,
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

    // ⭐ NEW: Handle CC Recipients (AFTER the recipient loop)
    if (ccRecipients && ccRecipients.length > 0) {
      console.log('📧 Processing', ccRecipients.length, 'CC recipients');
      
      for (let j = 0; j < ccRecipients.length; j++) {
        const cc = ccRecipients[j];
        const ccUniqueId = `cc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}-${j}`;
        
        // Create CC recipient record in database
        const ccRecord = {
          uniqueId: ccUniqueId,
          documentId: documentId,
          ownerId: ownerId,
          ownerEmail: ownerEmail,
          name: cc.name,
          email: cc.email,
          notifyWhen: cc.notifyWhen,
          type: 'cc_recipient',
          status: 'active',
          createdAt: new Date(),
          notifiedAt: cc.notifyWhen === 'immediately' ? new Date() : null,
        };
        
        await db.collection("cc_recipients").insertOne(ccRecord);
        
        const ccViewLink = `${request.nextUrl.origin}/cc/${ccUniqueId}?email=${cc.email}`;
        
        ccRecipientLinks.push({
          name: cc.name,
          email: cc.email,
          uniqueId: ccUniqueId,
          link: ccViewLink,
          notifyWhen: cc.notifyWhen,
        });
        
        // Send immediate email if requested
        if (cc.notifyWhen === 'immediately') {
          console.log(`📤 Sending immediate CC to ${cc.email}`);
          
          await sendCCNotificationEmail({
            ccName: cc.name,
            ccEmail: cc.email,
            documentName: document.filename,
            senderName: ownerName,
            viewLink: ccViewLink,
          }).catch(err => {
            console.error(`Failed to send CC to ${cc.email}:`, err);
          });
        }
      }
      
      console.log('✅ CC recipients processed:', ccRecipientLinks.length);
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
      ccRecipients: ccRecipientLinks, // ⭐ NEW: Return CC links
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