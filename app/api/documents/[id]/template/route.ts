//api/documents/[id]/template/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { dbPromise } from '@/app/api/lib/mongodb';
import { verifyUserFromRequest } from '@/lib/auth';
import { ObjectId } from 'mongodb';

// POST - Save document as signable template
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // ✅ Await params in Next.js 15
    const { id } = await params;
    
    // ✅ Verify user via HTTP-only cookie
    const user = await verifyUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = await dbPromise;
    const documentId = new ObjectId(id);

    // ✅ Verify ownership of the document
    const document = await db.collection('documents').findOne({
      _id: documentId,
      userId: user.id,
    });

    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    // Get template data from request
    const body = await request.json();
    const { signatureFields, recipients } = body;

    // Validate
    if (!signatureFields || signatureFields.length === 0) {
      return NextResponse.json(
        { error: 'At least one signature field is required' },
        { status: 400 }
      );
    }

    // Save template configuration to document
    await db.collection('documents').updateOne(
      { _id: documentId },
      {
        $set: {
          isTemplate: true,
          templateConfig: {
            signatureFields,
            recipients: recipients || [],
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          updatedAt: new Date(),
        },
      }
    );

    console.log('✅ Document converted to signable template:', id);

    return NextResponse.json({
      success: true,
      message: 'Document converted to signable template successfully',
      templateId: id,
    });

  } catch (error) {
    console.error('❌ Template creation error:', error);
    return NextResponse.json(
      { error: 'Failed to save template' },
      { status: 500 }
    );
  }
}

// GET - Retrieve template configuration
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // ✅ Await params in Next.js 15
    const { id } = await params;
    
    // ✅ Verify user via HTTP-only cookie
    const user = await verifyUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = await dbPromise;
    const documentId = new ObjectId(id);

    // ✅ Verify ownership of the document
    const document = await db.collection('documents').findOne({
      _id: documentId,
      userId: user.id,
    });

    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    if (!document.isTemplate) {
      return NextResponse.json(
        { error: 'Document is not a template' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      template: document.templateConfig,
    });

  } catch (error) {
    console.error('❌ Get template error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve template' },
      { status: 500 }
    );
  }
}

// DELETE - Remove template configuration (convert back to regular document)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // ✅ Await params in Next.js 15
    const { id } = await params;
    
    // ✅ Verify user via HTTP-only cookie
    const user = await verifyUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = await dbPromise;
    const documentId = new ObjectId(id);

    // ✅ Verify ownership of the document
    const document = await db.collection('documents').findOne({
      _id: documentId,
      userId: user.id,
    });

    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    // Remove template configuration
    await db.collection('documents').updateOne(
      { _id: documentId },
      {
        $unset: {
          isTemplate: '',
          templateConfig: '',
        },
        $set: {
          updatedAt: new Date(),
        },
      }
    );

    console.log('✅ Template configuration removed:', id);

    return NextResponse.json({
      success: true,
      message: 'Template configuration removed successfully',
    });

  } catch (error) {
    console.error('❌ Delete template error:', error);
    return NextResponse.json(
      { error: 'Failed to remove template' },
      { status: 500 }
    );
  }
}