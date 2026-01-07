// lib/folderPermissions.ts
import { ObjectId } from 'mongodb';

export async function checkFolderAccess(
  db: any,
  folderId: string,
  spaceId: string,
  userEmail: string
): Promise<{
  hasAccess: boolean;
  permission: any | null;
  reason?: string;
}> {
  try {
    // First check if user has space-level access
    const space = await db.collection('spaces').findOne({
      _id: new ObjectId(spaceId)
    });

    if (!space) {
      return { hasAccess: false, permission: null, reason: 'Space not found' };
    }

    // Owner always has access
    const owner = await db.collection('users').findOne({ _id: new ObjectId(space.userId) });
    if (owner && owner.email === userEmail) {
      return { 
        hasAccess: true, 
        permission: { 
          role: 'owner', 
          canDownload: true, 
          canUpload: true,
          watermarkEnabled: false
        } 
      };
    }

    // Check space-level member
    const spaceMember = space.members?.find((m: any) => m.email === userEmail);
    
    // Check folder-specific permission
    const folderPermission = await db.collection('folder_permissions').findOne({
      folderId,
      spaceId,
      grantedTo: userEmail.toLowerCase(),
      isActive: true
    });

    // If has folder permission, check expiry
    if (folderPermission) {
      if (folderPermission.expiresAt && new Date(folderPermission.expiresAt) < new Date()) {
        return { 
          hasAccess: false, 
          permission: null, 
          reason: 'Access expired' 
        };
      }

      return { 
        hasAccess: true, 
        permission: folderPermission 
      };
    }

    // If space admin/editor, they have access to all folders
    if (spaceMember && ['owner', 'admin', 'editor'].includes(spaceMember.role)) {
      return { 
        hasAccess: true, 
        permission: { 
          role: spaceMember.role, 
          canDownload: true, 
          canUpload: true,
          watermarkEnabled: false
        } 
      };
    }

    // No access
    return { 
      hasAccess: false, 
      permission: null, 
      reason: 'No permission for this folder' 
    };

  } catch (error) {
    console.error('❌ Check folder access error:', error);
    return { 
      hasAccess: false, 
      permission: null, 
      reason: 'Server error' 
    };
  }
}