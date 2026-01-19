import { NextRequest, NextResponse } from 'next/server';
import { dbPromise } from '../../lib/mongodb';
import { verifyUserFromRequest } from '@/lib/auth';
import { ObjectId } from 'mongodb';

// PATCH - Update profile info (name, company)
export async function PATCH(request: NextRequest) {
  try {
    const user = await verifyUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { firstName, lastName, companyName } = body;

    const db = await dbPromise;
    
    // ✅ UPDATE BOTH COLLECTIONS
    const updates = {
      firstName: firstName?.trim(),
      lastName: lastName?.trim(),
      companyName: companyName?.trim(),
      fullName: `${firstName?.trim()} ${lastName?.trim() || ''}`.trim(),
      updatedAt: new Date()
    };

    // Update profiles collection
    await db.collection('profiles').updateOne(
      { user_id: user.id },
      { $set: updates },
      { upsert: true }
    );

    // ✅ ALSO UPDATE users.profile (this is what /api/auth/me reads!)
    await db.collection('users').updateOne(
      { _id: new ObjectId(user.id) },
      { 
        $set: { 
          'profile.firstName': updates.firstName,
          'profile.lastName': updates.lastName,
          'profile.fullName': updates.fullName,
          'profile.companyName': updates.companyName,
          updated_at: new Date()
        } 
      }
    );

    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully'
    });

  } catch (error) {
    console.error('Profile update error:', error);
    return NextResponse.json({
      error: 'Failed to update profile'
    }, { status: 500 });
  }
}