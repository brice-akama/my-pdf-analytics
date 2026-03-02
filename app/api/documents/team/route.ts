import { NextRequest, NextResponse } from 'next/server';
import { dbPromise } from '@/app/api/lib/mongodb';
import { verifyUserFromRequest } from '@/lib/auth';

// GET — fetch all team-shared docs visible to the current user
export async function GET(request: NextRequest) {
  try {
    const user = await verifyUserFromRequest(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const db = await dbPromise;

    // Find the team this user belongs to
    const teamRecord = await db.collection('teams').findOne({
      $or: [
        { ownerId: user.id },
        { 'members.userId': user.id },
        { 'members.email': user.email },
      ],
    });

    if (!teamRecord) {
      // Not in a team — return empty, not an error
      return NextResponse.json({
        success: true,
        documents: [],
        teamName: null,
      });
    }

    const workspaceId = teamRecord._id.toString();

    // Fetch all documents shared to this workspace
    // IMPORTANT: we do NOT filter by userId here — that's the whole point.
    // Any team member can see all docs shared to the workspace.
    const documents = await db.collection('documents')
      .find(
        {
          workspaceId,
          sharedToTeam: true,
          archived: { $ne: true },
        },
        { projection: { fileData: 0 } } // never return raw file binary
      )
      .sort({ sharedToTeamAt: -1 })
      .toArray();

    const transformed = documents.map(doc => ({
      ...doc,
      _id: doc._id.toString(),
      // Flag whether the current user owns this doc
      isOwner: doc.userId === user.id,
      // Show who shared it
      sharedByEmail: doc.sharedToTeamByEmail || 'Unknown',
      sharedAt: doc.sharedToTeamAt || doc.createdAt,
    }));

    return NextResponse.json({
      success: true,
      documents: transformed,
      teamName: teamRecord.name || teamRecord.companyName || 'Team',
      workspaceId,
    });

  } catch (error) {
    console.error('❌ Fetch team documents error:', error);
    return NextResponse.json({ error: 'Failed to fetch team documents' }, { status: 500 });
  }
}