 import { NextRequest, NextResponse } from 'next/server';
import { dbPromise } from '@/app/api/lib/mongodb';
import { verifyUserFromRequest } from '@/lib/auth';
import { ObjectId } from 'mongodb';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: documentId } = await params;
  console.log('📥 POST /team - Document ID:', documentId);

  try {
    const user = await verifyUserFromRequest(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const db = await dbPromise;

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
      return NextResponse.json({ error: 'Already shared to team' }, { status: 409 });
    }

    // ✅ USE YOUR ACTUAL STRUCTURE: profiles + organization_members
    const profile = await db.collection('profiles').findOne({ user_id: user.id });
    const organizationId = profile?.organization_id || user.id;

    console.log('🏢 Organization ID:', organizationId);

    // Verify user is part of an org (either owner OR member)
    const isOwner = organizationId === user.id || profile?.organization_id == null;
    const isMember = await db.collection('organization_members').findOne({
      organizationId,
      userId: user.id,
      status: 'active',
    });

    if (!isOwner && !isMember) {
      return NextResponse.json(
        { error: 'You are not part of any team workspace.' },
        { status: 400 }
      );
    }

    // Mark document as shared to team
    await db.collection('documents').updateOne(
      { _id: new ObjectId(documentId) },
      {
        $set: {
          sharedToTeam: true,
          workspaceId: organizationId,        // ✅ use organizationId not teamId
          sharedToTeamAt: new Date(),
          sharedToTeamBy: user.id,
          sharedToTeamByEmail: user.email,
        },
      }
    );

    // Log in team_documents for fast team-wide queries
    await db.collection('team_documents').updateOne(
      { documentId, workspaceId: organizationId },
      {
        $set: {
          documentId,
          workspaceId: organizationId,
          sharedBy: user.id,
          sharedByEmail: user.email,
          sharedAt: new Date(),
          filename: document.originalFilename || document.filename,
          isActive: true,
        },
      },
      { upsert: true }
    );

    console.log(`✅ Document ${documentId} shared to org ${organizationId} by ${user.email}`);

    return NextResponse.json({
      success: true,
      message: 'Document shared to team successfully',
      workspaceId: organizationId,
    });

  } catch (error) {
    console.error('❌ Share to team error:', error);
    return NextResponse.json({ error: 'Failed to share' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: documentId } = await params;
  console.log('📥 DELETE /team - Document ID:', documentId);

  try {
    const user = await verifyUserFromRequest(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const db = await dbPromise;

    if (!ObjectId.isValid(documentId)) {
      return NextResponse.json({ error: 'Invalid document ID' }, { status: 400 });
    }

    // Only the original owner can unshare
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

    console.log(`✅ Document ${documentId} unshared by ${user.email}`);

    return NextResponse.json({
      success: true,
      message: 'Document removed from team',
    });

  } catch (error) {
    console.error('❌ Unshare error:', error);
    return NextResponse.json({ error: 'Failed to unshare' }, { status: 500 });
  }
}