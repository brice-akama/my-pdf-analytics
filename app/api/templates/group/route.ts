// app/api/templates/group/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { dbPromise } from '../../lib/mongodb';
import { verifyUserFromRequest } from '@/lib/auth';
import { ObjectId } from 'mongodb';

// GET - List all group templates
export async function GET(request: NextRequest) {
  try {
    const user = await verifyUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = await dbPromise;
    
    // Get user's organization
    const profile = await db.collection('profiles').findOne({
      user_id: user.id,
    });
    const organizationId = profile?.organization_id || user.id;

    console.log('🔍 [GROUP TEMPLATES] Fetching templates for org:', organizationId);

    // Fetch all active group templates for this organization
    const templates = await db.collection('document_group_templates')
      .find({
        organizationId: organizationId,
        isActive: true
      })
      .sort({ lastUsed: -1, createdAt: -1 })
      .toArray();

    console.log(`✅ [GROUP TEMPLATES] Found ${templates.length} templates`);

    // Enrich with document details
    const enrichedTemplates = await Promise.all(
      templates.map(async (template) => {
        const documentDetails = await Promise.all(
          template.documents.map(async (doc: any) => {
            const docInfo = await db.collection('documents').findOne(
              { _id: new ObjectId(doc.documentId) },
              { projection: { originalFilename: 1, numPages: 1, size: 1 } }
            );
            return {
              ...doc,
              filename: docInfo?.originalFilename || 'Unknown',
              numPages: docInfo?.numPages || 0,
              size: docInfo?.size || 0,
            };
          })
        );

        return {
          ...template,
          _id: template._id.toString(),
          documents: documentDetails,
        };
      })
    );

    return NextResponse.json({
      success: true,
      templates: enrichedTemplates,
    });

  } catch (error) {
    console.error('❌ [GROUP TEMPLATES] Error fetching templates:', error);
    return NextResponse.json(
      { error: 'Failed to fetch templates' },
      { status: 500 }
    );
  }
}

// POST - Create new group template
export async function POST(request: NextRequest) {
  try {
    const user = await verifyUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = await dbPromise;
    
    // Get user's organization
    const profile = await db.collection('profiles').findOne({
      user_id: user.id,
    });
    const organizationId = profile?.organization_id || user.id;

    const {
      name,
      description,
      documents,
      recipientRoles,
      settings
    } = await request.json();

    // Validation
    if (!name || !documents || documents.length < 2) {
      return NextResponse.json(
        { error: 'Template must have a name and at least 2 documents' },
        { status: 400 }
      );
    }

    console.log('📝 [GROUP TEMPLATES] Creating template:', name);
    console.log('📄 Documents:', documents.length);
    console.log('👥 Recipient roles:', recipientRoles.length);

    // Verify all documents exist and belong to user/org
    for (const doc of documents) {
      const docExists = await db.collection('documents').findOne({
        _id: new ObjectId(doc.documentId),
        organizationId: organizationId
      });

      if (!docExists) {
        return NextResponse.json(
          { error: `Document ${doc.documentId} not found or access denied` },
          { status: 404 }
        );
      }
    }

    // Create template
    const template = {
      name,
      description: description || '',
      userId: user.id,
      organizationId: organizationId,
      documents: documents.map((doc: any, index: number) => ({
        documentId: doc.documentId,
        order: index + 1,
        signatureFields: doc.signatureFields || []
      })),
      recipientRoles: recipientRoles.map((role: any, index: number) => ({
        index: index,
        role: role.role || `Recipient ${index + 1}`,
        color: role.color || `hsl(${index * 60}, 70%, 50%)`
      })),
      settings: {
        viewMode: settings?.viewMode || 'shared',
        signingOrder: settings?.signingOrder || 'any',
        expirationDays: settings?.expirationDays || '30',
        accessCodeRequired: settings?.accessCodeRequired || false,
      },
      createdAt: new Date(),
      updatedAt: new Date(),
      lastUsed: null,
      usageCount: 0,
      isActive: true
    };

    const result = await db.collection('document_group_templates').insertOne(template);

    console.log('✅ [GROUP TEMPLATES] Template created:', result.insertedId);

    return NextResponse.json({
      success: true,
      templateId: result.insertedId.toString(),
      message: 'Group template created successfully'
    }, { status: 201 });

  } catch (error) {
    console.error('❌ [GROUP TEMPLATES] Error creating template:', error);
    return NextResponse.json(
      { error: 'Failed to create template' },
      { status: 500 }
    );
  }
}