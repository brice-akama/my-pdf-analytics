 // app/api/templates/group/[templateId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { dbPromise } from '../../../lib/mongodb';
import { verifyUserFromRequest } from '@/lib/auth';
import { ObjectId } from 'mongodb';

// GET - Get single template
export async function GET(
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

    // Enrich with document details
    const enrichedDocuments = await Promise.all(
      template.documents.map(async (doc: any) => {
        const docInfo = await db.collection('documents').findOne(
          { _id: new ObjectId(doc.documentId) },
          { 
            projection: { 
              originalFilename: 1, 
              numPages: 1, 
              size: 1,
              cloudinaryPdfUrl: 1
            } 
          }
        );
        return {
          ...doc,
          filename: docInfo?.originalFilename || 'Unknown',
          numPages: docInfo?.numPages || 0,
          size: docInfo?.size || 0,
          cloudinaryPdfUrl: docInfo?.cloudinaryPdfUrl
        };
      })
    );

    return NextResponse.json({
      success: true,
      template: {
        ...template,
        _id: template._id.toString(),
        documents: enrichedDocuments
      }
    });

  } catch (error) {
    console.error('❌ [GROUP TEMPLATE] Error fetching template:', error);
    return NextResponse.json(
      { error: 'Failed to fetch template' },
      { status: 500 }
    );
  }
}

// PATCH - Update template
export async function PATCH(
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

    const updates = await request.json();

    const result = await db.collection('document_group_templates').updateOne(
      {
        _id: new ObjectId(templateId),
        organizationId: organizationId
      },
      {
        $set: {
          ...updates,
          updatedAt: new Date()
        }
      }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Template updated successfully'
    });

  } catch (error) {
    console.error('❌ [GROUP TEMPLATE] Error updating:', error);
    return NextResponse.json(
      { error: 'Failed to update template' },
      { status: 500 }
    );
  }
}

// DELETE - Soft delete template
export async function DELETE(
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

    const result = await db.collection('document_group_templates').updateOne(
      {
        _id: new ObjectId(templateId),
        organizationId: organizationId
      },
      {
        $set: {
          isActive: false,
          deletedAt: new Date()
        }
      }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Template deleted successfully'
    });

  } catch (error) {
    console.error('❌ [GROUP TEMPLATE] Error deleting:', error);
    return NextResponse.json(
      { error: 'Failed to delete template' },
      { status: 500 }
    );
  }
}