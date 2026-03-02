import { NextRequest, NextResponse } from 'next/server';
import { dbPromise } from '@/app/api/lib/mongodb';
import { verifyUserFromRequest } from '@/lib/auth';
import { ObjectId } from 'mongodb';

// POST — share doc to team
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await verifyUserFromRequest(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const db = await dbPromise;
    const documentId = params.id;

    if (!ObjectId.isValid(documentId)) {
      return NextResponse.json({ error: 'Invalid document ID' }, { status: 400 });
    }

    // Must be YOUR document
    const document = await db.collection('documents').findOne({
      _id: new ObjectId(documentId),
      userId: user.id,
    });

    if (!document) {
      return NextResponse.json(
        { error: 'Document not found or you do not own it' },
        { status: 404 }
      );
    }

    if (document.sharedToTeam === true) {
      return NextResponse.json(
        { error: 'Already shared to team' },
        { status: 409 }
      );
    }

    // Find the workspace/team this user belongs to
    const teamRecord = await db.collection('teams').findOne({
      $or: [
        { ownerId: user.id },
        { 'members.userId': user.id },
        { 'members.email': user.email },
      ],
    });

    if (!teamRecord) {
      return NextResponse.json(
        { error: 'You are not part of any team. Invite members first.' },
        { status: 400 }
      );
    }

    const workspaceId = teamRecord._id.toString();

    // Mark document as shared to team
    await db.collection('documents').updateOne(
      { _id: new ObjectId(documentId) },
      {
        $set: {
          sharedToTeam: true,
          workspaceId,
          sharedToTeamAt: new Date(),
          sharedToTeamBy: user.id,
          sharedToTeamByEmail: user.email,
        },
      }
    );

    // Log in team_documents for fast team-wide queries
    await db.collection('team_documents').updateOne(
      { documentId, workspaceId },
      {
        $set: {
          documentId,
          workspaceId,
          sharedBy: user.id,
          sharedByEmail: user.email,
          sharedAt: new Date(),
          filename: document.originalFilename || document.filename,
          isActive: true,
        },
      },
      { upsert: true }
    );

    return NextResponse.json({
      success: true,
      message: 'Document shared to team',
      workspaceId,
    });

  } catch (error) {
    console.error('❌ Share to team error:', error);
    return NextResponse.json({ error: 'Failed to share' }, { status: 500 });
  }
}

// DELETE — unshare from team (owner only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await verifyUserFromRequest(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const db = await dbPromise;
    const documentId = params.id;

    if (!ObjectId.isValid(documentId)) {
      return NextResponse.json({ error: 'Invalid document ID' }, { status: 400 });
    }

    const document = await db.collection('documents').findOne({
      _id: new ObjectId(documentId),
      userId: user.id, // ONLY the owner can unshare
    });

    if (!document) {
      return NextResponse.json(
        { error: 'Document not found or you do not own it' },
        { status: 404 }
      );
    }

    if (!document.sharedToTeam) {
      return NextResponse.json(
        { error: 'Document is not shared to team' },
        { status: 409 }
      );
    }

    await db.collection('documents').updateOne(
      { _id: new ObjectId(documentId) },
      {
        $set: {
          sharedToTeam: false,
          unsharedFromTeamAt: new Date(),
        },
        $unset: {
          workspaceId: '',
          sharedToTeamAt: '',
          sharedToTeamBy: '',
          sharedToTeamByEmail: '',
        },
      }
    );

    await db.collection('team_documents').updateOne(
      { documentId },
      { $set: { isActive: false, unsharedAt: new Date() } }
    );

    return NextResponse.json({
      success: true,
      message: 'Document removed from team',
    });

  } catch (error) {
    console.error('❌ Unshare error:', error);
    return NextResponse.json({ error: 'Failed to unshare' }, { status: 500 });
  }
}