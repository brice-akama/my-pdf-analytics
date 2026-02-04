// app/api/templates/group/[templateId]/send/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { dbPromise } from '../../../../lib/mongodb';
import { verifyUserFromRequest } from '@/lib/auth';
import { ObjectId } from 'mongodb';
import { sendSignatureRequestEmail } from '@/lib/emailService';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ templateId: string }> }
) {
  try {
    const { templateId } = await params;
    const user = await verifyUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = await dbPromise;
    
    const profile = await db.collection('profiles').findOne({
      user_id: user.id,
    });
    const organizationId = profile?.organization_id || user.id;

    // Get the template
    const template = await db.collection('document_group_templates').findOne({
      _id: new ObjectId(templateId),
      organizationId: organizationId,
      isActive: true
    });

    if (!template) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      );
    }

    // Get actual recipients from request body
    const { recipients, message, dueDate } = await request.json();

    if (!recipients || recipients.length !== template.recipientRoles.length) {
      return NextResponse.json(
        { error: `Template requires ${template.recipientRoles.length} recipients` },
        { status: 400 }
      );
    }

    console.log('📤 [USE TEMPLATE] Sending template:', template.name);
    console.log('👥 Recipients:', recipients.length);
    console.log('📄 Documents:', template.documents.length);

    // Get owner details
    const userDoc = await db.collection('users').findOne({
      _id: new ObjectId(user.id)
    });
    const ownerName = userDoc?.profile?.fullName || user.email;

    // Create signature requests for EACH document
    const allSignatureRequests = [];
    
    for (const templateDoc of template.documents) {
      const document = await db.collection('documents').findOne({
        _id: new ObjectId(templateDoc.documentId)
      });

      if (!document) {
        console.error(`❌ Document ${templateDoc.documentId} not found`);
        continue;
      }

      // Create signature requests for this document
      for (let i = 0; i < recipients.length; i++) {
        const recipient = recipients[i];
        const uniqueId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}-${i}`;

        // Filter signature fields for this recipient
        const recipientFields = templateDoc.signatureFields.filter(
          (f: any) => f.recipientIndex === i
        );

        const signatureRequest = {
          uniqueId,
          documentId: templateDoc.documentId,
          ownerId: user.id,
          ownerEmail: user.email,
          recipient: {
            name: recipient.name,
            email: recipient.email,
            role: template.recipientRoles[i]?.role || `Recipient ${i + 1}`
          },
          recipientIndex: i,
          signatureFields: recipientFields,
          viewMode: template.settings.viewMode,
          signingOrder: template.settings.signingOrder,
          message: message || '',
          dueDate: dueDate || null,
          expirationDays: template.settings.expirationDays,
          status: template.settings.signingOrder === 'sequential' && i > 0 ? 'awaiting_turn' : 'pending',
          createdAt: new Date(),
          viewedAt: null,
          signedAt: null,
          isFromGroupTemplate: true,
          groupTemplateId: templateId,
          groupTemplateName: template.name
        };

        const result = await db.collection('signature_requests').insertOne(signatureRequest);

        const signingLink = `${request.nextUrl.origin}/sign/${uniqueId}`;

        allSignatureRequests.push({
          id: result.insertedId,
          uniqueId,
          documentId: templateDoc.documentId,
          recipient: recipient.name,
          email: recipient.email,
          link: signingLink,
          status: signatureRequest.status
        });

        // Send email only to first person if sequential, or to everyone if any order
        const shouldSendEmail = 
          template.settings.signingOrder === 'any' || 
          (template.settings.signingOrder === 'sequential' && i === 0);

        if (shouldSendEmail) {
          await sendSignatureRequestEmail({
            recipientName: recipient.name,
            recipientEmail: recipient.email,
            originalFilename: document.originalFilename,
            signingLink: signingLink,
            senderName: ownerName,
            message: message || `Please sign the documents in: ${template.name}`,
            dueDate: dueDate
          }).catch(err => {
            console.error(`❌ Failed to send email to ${recipient.email}:`, err);
          });
        }
      }

      // Update document status
      await db.collection('documents').updateOne(
        { _id: new ObjectId(templateDoc.documentId) },
        {
          $set: {
            status: 'pending_signature',
            sentForSignature: true,
            sentAt: new Date()
          }
        }
      );
    }

    // Update template usage stats
    await db.collection('document_group_templates').updateOne(
      { _id: new ObjectId(templateId) },
      {
        $set: { lastUsed: new Date() },
        $inc: { usageCount: 1 }
      }
    );

    console.log('✅ [USE TEMPLATE] Signature requests created:', allSignatureRequests.length);

    return NextResponse.json({
      success: true,
      message: `Template sent to ${recipients.length} recipient(s) for ${template.documents.length} document(s)`,
      signatureRequests: allSignatureRequests,
      documentsCount: template.documents.length
    });

  } catch (error) {
    console.error('❌ [USE TEMPLATE] Error:', error);
    return NextResponse.json(
      { error: 'Failed to use template' },
      { status: 500 }
    );
  }
}