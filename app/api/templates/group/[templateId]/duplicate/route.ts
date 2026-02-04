// app/api/templates/group/[templateId]/duplicate/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { dbPromise } from '../../../../lib/mongodb';
import { verifyUserFromRequest } from '@/lib/auth';
import { ObjectId } from 'mongodb';

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

    // Get the original template
    const originalTemplate = await db.collection('document_group_templates').findOne({
      _id: new ObjectId(templateId),
      isActive: true
    });

    if (!originalTemplate) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      );
    }

    // Check if user has access to this template
    const hasAccess = 
      originalTemplate.userId === user.id || // Owner
      originalTemplate.organizationId === organizationId || // Same org
      originalTemplate.sharedWith?.some((s: any) => s.userId === user.id); // Shared with user

    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    // Get custom name if provided
    const { name } = await request.json();
    const duplicateName = name || `${originalTemplate.name} (Copy)`;

    console.log('📋 [DUPLICATE TEMPLATE] Duplicating:', originalTemplate.name);
    console.log('📋 [DUPLICATE TEMPLATE] New name:', duplicateName);

    // Create duplicate template
    const duplicateTemplate = {
      name: duplicateName,
      description: originalTemplate.description || '',
      userId: user.id, // New owner is current user
      organizationId: organizationId,
      documents: originalTemplate.documents.map((doc: any) => ({
        documentId: doc.documentId,
        order: doc.order,
        signatureFields: doc.signatureFields || []
      })),
      recipientRoles: originalTemplate.recipientRoles.map((role: any) => ({
        index: role.index,
        role: role.role,
        color: role.color
      })),
      settings: {
        viewMode: originalTemplate.settings.viewMode,
        signingOrder: originalTemplate.settings.signingOrder,
        expirationDays: originalTemplate.settings.expirationDays,
        accessCodeRequired: originalTemplate.settings.accessCodeRequired || false,
      },
      createdAt: new Date(),
      updatedAt: new Date(),
      lastUsed: null,
      usageCount: 0,
      isActive: true,
      duplicatedFrom: templateId, // Track original template
      duplicatedAt: new Date()
    };

    const result = await db.collection('document_group_templates').insertOne(duplicateTemplate);

    console.log('✅ [DUPLICATE TEMPLATE] Created:', result.insertedId);

    // Verify all referenced documents exist
    const documentIds = duplicateTemplate.documents.map((d: any) => new ObjectId(d.documentId));
    const existingDocs = await db.collection('documents')
      .find({ _id: { $in: documentIds } })
      .toArray();

    if (existingDocs.length !== documentIds.length) {
      console.warn(`⚠️ [DUPLICATE TEMPLATE] Some documents missing: ${existingDocs.length}/${documentIds.length}`);
    }

    return NextResponse.json({
      success: true,
      templateId: result.insertedId.toString(),
      message: 'Template duplicated successfully'
    }, { status: 201 });

  } catch (error) {
    console.error('❌ [DUPLICATE TEMPLATE] Error:', error);
    return NextResponse.json(
      { error: 'Failed to duplicate template' },
      { status: 500 }
    );
  }
}