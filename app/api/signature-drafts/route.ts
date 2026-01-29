// app/api/signature-drafts/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { dbPromise } from '../lib/mongodb';
import { verifyUserFromRequest } from '@/lib/auth';
import { ObjectId } from 'mongodb';

// GET - List all drafts for current user
export async function GET(request: NextRequest) {
  try {
    console.log('🔍 [DRAFTS API] GET request received');
    
    const user = await verifyUserFromRequest(request);
    if (!user) {
      console.log('❌ [DRAFTS API] Unauthorized - no user');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('✅ [DRAFTS API] User authenticated:', user.id);

    const db = await dbPromise;

    // Get user's organization
    const profile = await db.collection('profiles').findOne({
      user_id: user.id,
    });
    const organizationId = profile?.organization_id || user.id;
    
    console.log('🏢 [DRAFTS API] Organization ID:', organizationId);

    // Fetch all drafts for this user
    const drafts = await db.collection('signature_request_drafts')
      .find({
        userId: user.id,
        organizationId: organizationId,
        // Don't show expired drafts (older than 30 days)
        createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
      })
      .sort({ lastSaved: -1 })
      .toArray();

    console.log(`📋 [DRAFTS API] Found ${drafts.length} drafts for user ${user.id}`);
    console.log('📋 [DRAFTS API] Draft document IDs:', drafts.map(d => d.documentId.toString()));

    return NextResponse.json({
      success: true,
      drafts: drafts.map(d => ({
        ...d,
        _id: d._id.toString(),
        documentId: d.documentId.toString(),
      }))
    });

  } catch (error) {
    console.error('❌ [DRAFTS API] Error fetching drafts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch drafts' },
      { status: 500 }
    );
  }
}