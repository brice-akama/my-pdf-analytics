// app/api/lib/teamHelpers.ts
import { dbPromise } from "./mongodb";

/**
 * Get all team member IDs for an organization (including owner)
 * Used for filtering documents that should be visible to owner/admin
 */
export async function getTeamMemberIds(userId: string, role: string): Promise<string[]> {
  const db = await dbPromise;
  
  // Get user's profile to find organization
  const profile = await db.collection("profiles").findOne({ user_id: userId });
  const organizationId = profile?.organization_id || userId;
  
  // If member (not owner/admin), return only their own ID
  if (role === "member") {
    return [userId];
  }
  
  // For owner/admin, get ALL team member IDs
  const members = await db.collection("organization_members")
    .find({ 
      organizationId,
      status: "active" 
    })
    .project({ userId: 1 })
    .toArray();
  
  // Include owner + all active members
  const memberIds = members.map(m => m.userId).filter(Boolean);
  return [organizationId, ...memberIds]; // Owner always included
}