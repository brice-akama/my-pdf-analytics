import { Db, ObjectId } from 'mongodb';

export async function canAccessDocument(
  db: Db,
  document: any,
  userId: string
): Promise<boolean> {
  // Owner always has access
  if (document.userId === userId) return true;

  // Document must be shared to a team
  if (!document.sharedToTeam || !document.workspaceId) return false;

  // Check if user belongs to the same organization as the document's workspace
  const profile = await db.collection('profiles').findOne({ user_id: userId });
  const userOrgId = profile?.organization_id || userId;

  // User is the org owner of that workspace
  if (userOrgId === document.workspaceId) return true;

  // User is an active member of that workspace's org
  const membership = await db.collection('organization_members').findOne({
    organizationId: document.workspaceId,
    userId,
    status: 'active',
  });

  return !!membership;
}