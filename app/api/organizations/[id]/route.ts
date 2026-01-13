// app/api/organizations/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { dbPromise } from '../../lib/mongodb'
import { verifyUserFromRequest } from '@/lib/auth'
import { ObjectId } from 'mongodb'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }  // ✅ FIX
) {
  try {
    const user = await verifyUserFromRequest(request)
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const db = await dbPromise
    const { id: orgId } = await params  // ✅ FIX: Await params

    // ✅ DEBUG: Log what we're looking for
    console.log('🔍 DELETE - User ID:', user.id)
    console.log('🔍 DELETE - User email:', user.email)
    console.log('🔍 DELETE - Org ID:', orgId)

    // ✅ FIX: Try finding by BOTH userId AND email
    let membership = await db.collection('organization_members').findOne({
      organizationId: orgId,
      userId: user.id,
      role: 'owner'
    })

    console.log('🔍 DELETE - Membership by userId:', membership)

    // If not found by userId, try by email
    if (!membership) {
      membership = await db.collection('organization_members').findOne({
        organizationId: orgId,
        email: user.email,
        role: 'owner'
      })
      console.log('🔍 DELETE - Membership by email:', membership)
    }

    // ✅ FIX: Also check if user created the organization
    if (!membership) {
      const org = await db.collection('organizations').findOne({
        _id: new ObjectId(orgId)
      })
      
      console.log('🔍 DELETE - Organization data:', org)
      
      if (org && (org.createdBy === user.id || org.ownerId === user.id)) {
        console.log('✅ User is organization creator/owner')
        // Allow deletion - user created the org
      } else {
        return NextResponse.json({ 
          error: 'Only the organization owner can delete it' 
        }, { status: 403 })
      }
    }

    // Delete all spaces in this organization
    const spacesResult = await db.collection('spaces').deleteMany({
      organizationId: orgId
    })

    console.log(`🗑️ Deleted ${spacesResult.deletedCount} spaces`)

    // Delete all members
    const membersResult = await db.collection('organization_members').deleteMany({
      organizationId: orgId
    })

    console.log(`🗑️ Deleted ${membersResult.deletedCount} members`)

    // Delete the organization
    const orgResult = await db.collection('organizations').deleteOne({
      _id: new ObjectId(orgId)
    })

    console.log(`✅ Deleted organization ${orgId}`)

    return NextResponse.json({
      success: true,
      message: 'Organization deleted successfully',
      deletedSpaces: spacesResult.deletedCount,
      deletedMembers: membersResult.deletedCount
    })

  } catch (error) {
    console.error('❌ Delete organization error:', error)
    return NextResponse.json({ 
      error: 'Failed to delete organization' 
    }, { status: 500 })
  }
}