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
    const { fullName, companyName } = body;

    if (!fullName?.trim()) {
      return NextResponse.json({ error: 'Full name is required' }, { status: 400 });
    }

    // Split full name into first/last
    const nameParts = fullName.trim().split(' ');
    const firstName = nameParts[0];
    const lastName = nameParts.slice(1).join(' ') || '';

    const db = await dbPromise;
    
    // ✅ UPDATE: Use BOTH snake_case AND camelCase for compatibility
    const profileUpdates = {
      // Snake_case (existing fields in your DB)
      first_name: firstName,
      last_name: lastName,
      full_name: fullName.trim(),
      company_name: companyName?.trim() || null,
      // CamelCase (new format)
      firstName,
      lastName,
      fullName: fullName.trim(),
      companyName: companyName?.trim() || null,
      updatedAt: new Date()
    };

    // Update profiles collection
    await db.collection('profiles').updateOne(
      { user_id: user.id },
      { $set: profileUpdates },
      { upsert: true }
    );

    // Update users collection
    await db.collection('users').updateOne(
      { _id: new ObjectId(user.id) },
      { 
        $set: { 
          'profile.firstName': firstName,
          'profile.lastName': lastName,
          'profile.fullName': fullName.trim(),
          'profile.companyName': companyName?.trim() || null,
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