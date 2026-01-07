// app/api/spaces/[id]/members/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { dbPromise } from '@/app/api/lib/mongodb';
import { verifyUserFromRequest } from '@/lib/auth';
import { ObjectId } from 'mongodb';

/* ======================================================
   GET: Get all members with activity stats
====================================================== */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: spaceId } = await params;
    const user = await verifyUserFromRequest(request);

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const db = await dbPromise;

    // Check if user has permission (owner or admin)
    const space = await db.collection('spaces').findOne({
      _id: new ObjectId(spaceId),
      $or: [
        { userId: user.id },
        { 'members.email': user.email, 'members.role': { $in: ['admin', 'owner'] } }
      ]
    });

    if (!space) {
      return NextResponse.json(
        { success: false, error: 'Access denied' },
        { status: 403 }
      );
    }

    const members = space.members || [];

    // Get activity stats for each member
    const membersWithStats = await Promise.all(
      members.map(async (member: any) => {
        // Get document views by this member
        const viewsCount = await db.collection('document_views').countDocuments({
          spaceId: new ObjectId(spaceId),
          userEmail: member.email
        });

        // Get downloads by this member
        const downloadsCount = await db.collection('document_downloads').countDocuments({
          spaceId: new ObjectId(spaceId),
          userEmail: member.email
        });

        // Get last activity
        const lastActivity = await db.collection('space_activity_logs')
          .findOne(
            { 
              spaceId: spaceId,
              userId: member.userId || null,
              $or: [
                { userId: member.userId },
                { 'details.email': member.email }
              ]
            },
            { sort: { timestamp: -1 } }
          );

        return {
          id: member.userId || member.email,
          email: member.email,
          role: member.role || 'viewer',
          status: member.status || 'active',
          addedAt: member.addedAt || space.createdAt,
          lastAccessedAt: member.lastAccessedAt || lastActivity?.timestamp || null,
          viewsCount,
          downloadsCount,
          invitationStatus: member.userId ? 'accepted' : 'pending'
        };
      })
    );

    return NextResponse.json({
      success: true,
      members: membersWithStats,
      spaceOwner: space.userId
    });

  } catch (error) {
    console.error('❌ Get members error:', error);
    return NextResponse.json(
      { success: false, error: 'Server error' },
      { status: 500 }
    );
  }
}