// app/api/signature-drafts/[documentId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { dbPromise } from '../../lib/mongodb';
import { verifyUserFromRequest } from '@/lib/auth';
import { ObjectId } from 'mongodb';

// ⭐ FIX: GET endpoint - await params
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ documentId: string }> } // ← CHANGED TO PROMISE
) {
  try {
    const { documentId } = await params; // ⭐ AWAIT HERE
    console.log('🔍 [DRAFT GET] Loading draft for document:', documentId);
    
    const user = await verifyUserFromRequest(request);
    if (!user) {
      console.log('❌ [DRAFT GET] Unauthorized');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('✅ [DRAFT GET] User:', user.id);

    const db = await dbPromise;

    // Get user's organization
    const profile = await db.collection('profiles').findOne({
      user_id: user.id,
    });
    const organizationId = profile?.organization_id || user.id;
    
    console.log('🏢 [DRAFT GET] Organization:', organizationId);

    // Find draft for this document
    const draft = await db.collection('signature_request_drafts').findOne({
      documentId: new ObjectId(documentId),
      userId: user.id,
      
    });

    if (!draft) {
      console.log(`📋 [DRAFT GET] No draft found for document ${documentId}`);
      return NextResponse.json({
        success: true,
        draft: null
      });
    }

    console.log(`✅ [DRAFT GET] Draft found! Last saved: ${draft.lastSaved}`);
    console.log(`📊 [DRAFT GET] Recipients: ${draft.recipients?.length || 0}, Fields: ${draft.signatureFields?.length || 0}`);

    return NextResponse.json({
      success: true,
      draft: {
        ...draft,
        _id: draft._id.toString(),
        documentId: draft.documentId.toString(),
      }
    });

  } catch (error) {
    console.error('❌ [DRAFT GET] Error loading draft:', error);
    return NextResponse.json(
      { error: 'Failed to load draft' },
      { status: 500 }
    );
  }
}

// ⭐ FIX: POST endpoint - await params
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ documentId: string }> } // ← CHANGED TO PROMISE
) {
  try {
    const { documentId } = await params; // ⭐ AWAIT HERE
    console.log('💾 [DRAFT SAVE] Saving draft for document:', documentId);
    
    const user = await verifyUserFromRequest(request);
    if (!user) {
      console.log('❌ [DRAFT SAVE] Unauthorized');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = await dbPromise;
    const draftData = await request.json();
    
    console.log('📊 [DRAFT SAVE] Draft data received:', {
      recipients: draftData.recipients?.length || 0,
      fields: draftData.signatureFields?.length || 0,
      viewMode: draftData.viewMode,
      signingOrder: draftData.signingOrder
    });

    // Get user's organization
    const profile = await db.collection('profiles').findOne({
      user_id: user.id,
    });
    const organizationId = profile?.organization_id || user.id;

    console.log('🏢 [DRAFT SAVE] Organization:', organizationId);
    console.log('👤 [DRAFT SAVE] User ID:', user.id);
    console.log('📄 [DRAFT SAVE] Looking for document:', documentId);

    // ⭐ FIX: Check BOTH userId and organizationId
    const document = await db.collection('documents').findOne({
      _id: new ObjectId(documentId),
      $or: [
        { userId: user.id },
        { organizationId: organizationId }
      ]
    });

    if (!document) {
      console.log('❌ [DRAFT SAVE] Document not found');
      console.log('   Searched for:', {
        _id: documentId,
        userId: user.id,
        organizationId: organizationId
      });
      
      // ⭐ DEBUG: Let's see what documents exist
      const allUserDocs = await db.collection('documents').find({
        userId: user.id
      }).limit(5).toArray();
      console.log('📋 [DRAFT SAVE] User documents found:', allUserDocs.map(d => ({
        id: d._id.toString(),
        filename: d.filename,
        userId: d.userId,
        organizationId: d.organizationId
      })));
      
      return NextResponse.json(
        { error: 'Document not found or access denied' },
        { status: 404 }
      );
    }

    console.log('✅ [DRAFT SAVE] Document verified:', document.filename);

    // Prepare draft document
    const now = new Date();
    const draftDocument = {
      documentId: new ObjectId(documentId),
      userId: user.id,
      organizationId: organizationId,
      
      // All signature page data
      recipients: draftData.recipients || [],
      signatureFields: draftData.signatureFields || [],
      
      // Settings
      viewMode: draftData.viewMode || 'isolated',
      signingOrder: draftData.signingOrder || 'any',
      expirationDays: draftData.expirationDays || '30',
      accessCodeRequired: draftData.accessCodeRequired || false,
      accessCodeType: draftData.accessCodeType,
      accessCodeHint: draftData.accessCodeHint,
      accessCode: draftData.accessCode,
      intentVideoRequired: draftData.intentVideoRequired || false,
      
      // Message & dates
      message: draftData.message || '',
      dueDate: draftData.dueDate,
      scheduledSendDate: draftData.scheduledSendDate,
      ccRecipients: draftData.ccRecipients || [],
      
      // Metadata
      lastSaved: now,
      updatedAt: now,
    };

    // Upsert (update if exists, insert if new)
    const result = await db.collection('signature_request_drafts').updateOne(
      {
        documentId: new ObjectId(documentId),
        userId: user.id,
         
      },
      {
        $set: draftDocument,
        $setOnInsert: {
          createdAt: now,
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        }
      },
      { upsert: true }
    );

    console.log(`✅ [DRAFT SAVE] Draft ${result.upsertedCount ? 'created' : 'updated'} successfully`);

    return NextResponse.json({
      success: true,
      message: result.upsertedCount ? 'Draft created' : 'Draft updated',
      lastSaved: now,
    });

  } catch (error) {
    console.error('❌ [DRAFT SAVE] Error saving draft:', error);
    return NextResponse.json(
      { error: 'Failed to save draft' },
      { status: 500 }
    );
  }
}

// ⭐ FIX: DELETE endpoint - await params
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ documentId: string }> } // ← CHANGED TO PROMISE
) {
  try {
    const { documentId } = await params; // ⭐ AWAIT HERE
    
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

    const result = await db.collection('signature_request_drafts').deleteOne({
      documentId: new ObjectId(documentId),
      userId: user.id,
       
    });

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { error: 'Draft not found' },
        { status: 404 }
      );
    }

    console.log(`🗑️ Draft deleted for document ${documentId}`);

    return NextResponse.json({
      success: true,
      message: 'Draft deleted'
    });

  } catch (error) {
    console.error('❌ Error deleting draft:', error);
    return NextResponse.json(
      { error: 'Failed to delete draft' },
      { status: 500 }
    );
  }
}
 

 

 