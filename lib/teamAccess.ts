import { Db, ObjectId } from 'mongodb';

export async function canAccessDocument(
  db: Db,
  document: any,
  userId: string
): Promise<boolean> {
    console.log(' canAccessDocument called');
  console.log(' userId:', userId);
  console.log(' document.userId:', document?.userId);
  // Owner always has access
    if (document.userId === userId) {
    console.log(' User is owner');
    return true;
  }

   console.log('🔎 sharedToTeam:', document?.sharedToTeam);
  console.log('🔎 workspaceId:', document?.workspaceId);

  // Document must be shared to a team
  if (!document.sharedToTeam || !document.workspaceId) {
    console.log('❌ Document not shared to team');
    return false;
  }

  const profile = await db.collection('profiles').findOne({ user_id: userId });
  console.log('👤 Team member profile:', profile?.organization_id);
  
  const userOrgId = profile?.organization_id || userId;
  console.log('🏢 userOrgId:', userOrgId);
  console.log('🏢 document.workspaceId:', document.workspaceId);

  if (userOrgId === document.workspaceId) {
    console.log('✅ User is org owner');
    return true;
  }

  const membership = await db.collection('organization_members').findOne({
    organizationId: document.workspaceId,
    userId,
    status: 'active',
  });
  console.log('👥 Membership found:', !!membership);
  console.log('👥 Membership data:', membership);

  return !!membership;
}