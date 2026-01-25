// app/api/spaces/[id]/members/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { dbPromise } from '@/app/api/lib/mongodb';
import { verifyUserFromRequest } from '@/lib/auth';
import { ObjectId } from 'mongodb';
import { getTeamMemberIds } from '@/app/api/lib/teamHelpers';
 
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

    // Get space
    const space = await db.collection('spaces').findOne({
      _id: new ObjectId(spaceId)
    });

    if (!space) {
      return NextResponse.json(
        { success: false, error: 'Space not found' },
        { status: 404 }
      );
    }

    // ✅ CHECK ACCESS PERMISSIONS
    const isMember = space.members?.some((m: any) => m.email === user.email);
    const isOwner = space.userId === user.id;

    if (!isOwner && !isMember) {
      return NextResponse.json(
        { success: false, error: 'Access denied' },
        { status: 403 }
      );
    }

    // ✅ TEAM ISOLATION FOR ORGANIZATION SPACES
    if (space.organizationId) {
      // Get user's role in organization
      const profile = await db.collection("profiles").findOne({ user_id: user.id });
      const userRole = profile?.role || "owner";
      
      // Get visible team member IDs
      const visibleUserIds = await getTeamMemberIds(user.id, userRole);
      
      console.log(`👥 User ${user.email} (${userRole}) can see members from team:`, visibleUserIds);
      
      // For members (not owner/admin), only show themselves
      if (userRole === 'member' && !isOwner) {
        const members = space.members || [];
        const userMember = members.find((m: any) => m.email === user.email);
        
        if (userMember) {
          // Get stats for self only
          const viewsCount = await db.collection('document_views').countDocuments({
            spaceId: new ObjectId(spaceId),
            userEmail: user.email
          });

          const downloadsCount = await db.collection('document_downloads').countDocuments({
            spaceId: new ObjectId(spaceId),
            userEmail: user.email
          });

          const lastActivity = await db.collection('space_activity_logs')
            .findOne(
              { 
                spaceId: spaceId,
                $or: [
                  { userId: user.id },
                  { 'details.email': user.email }
                ]
              },
              { sort: { timestamp: -1 } }
            );

          return NextResponse.json({
            success: true,
            members: [{
              id: user.id,
              email: user.email,
              role: userMember.role || 'viewer',
              status: userMember.status || 'active',
              addedAt: userMember.addedAt || space.createdAt,
              lastAccessedAt: userMember.lastAccessedAt || lastActivity?.timestamp || null,
              viewsCount,
              downloadsCount,
              invitationStatus: 'accepted'
            }],
            spaceOwner: space.userId
          });
        }
      }
    }

    // ✅ OWNER/ADMIN OR PERSONAL SPACE: Show all members
    const members = space.members || [];

    const membersWithStats = await Promise.all(
      members.map(async (member: any) => {
        const viewsCount = await db.collection('document_views').countDocuments({
          spaceId: new ObjectId(spaceId),
          userEmail: member.email
        });

        const downloadsCount = await db.collection('document_downloads').countDocuments({
          spaceId: new ObjectId(spaceId),
          userEmail: member.email
        });

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