import { NextRequest, NextResponse } from 'next/server';
import { dbPromise } from '@/app/api/lib/mongodb';
import { verifyUserFromRequest } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const user = await verifyUserFromRequest(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const db = await dbPromise;

    // ✅ USE YOUR ACTUAL STRUCTURE
    const profile = await db.collection('profiles').findOne({ user_id: user.id });
    const organizationId = profile?.organization_id || user.id;

    console.log('🏢 Fetching team docs for org:', organizationId);

    const documents = await db.collection('documents')
      .find(
        {
          workspaceId: organizationId,
          sharedToTeam: true,
          archived: { $ne: true },
        },
        { projection: { fileData: 0 } }
      )
      .sort({ sharedToTeamAt: -1 })
      .toArray();

    console.log(`✅ Found ${documents.length} team documents`);

    const transformed = documents.map(doc => ({
      ...doc,
      _id: doc._id.toString(),
      isOwner: doc.userId === user.id,
      sharedByEmail: doc.sharedToTeamByEmail || 'Unknown',
      sharedAt: doc.sharedToTeamAt || doc.createdAt,
    }));

    // Get org name from owner profile
    const ownerProfile = await db.collection('profiles').findOne({
      user_id: organizationId,
    });

    return NextResponse.json({
      success: true,
      documents: transformed,
      teamName: ownerProfile?.company_name || profile?.company_name || 'Team',
      workspaceId: organizationId,
    });

  } catch (error) {
    console.error('❌ Fetch team documents error:', error);
    return NextResponse.json({ error: 'Failed to fetch team documents' }, { status: 500 });
  }
}