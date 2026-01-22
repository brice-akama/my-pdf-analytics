// app/api/user/preferences/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { verifyUserFromRequest } from '@/lib/auth';
import { ObjectId } from 'mongodb';
import { dbPromise } from '../../lib/mongodb';

export async function GET(request: NextRequest) {  
  try {
    const user = await verifyUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = await dbPromise;
    const profile = await db.collection('profiles').findOne({ 
      user_id: user.id 
    });

    // Default preferences if none exist
    const preferences = profile?.preferences || {
      emailNotifications: true,
      documentReminders: true,
      marketingEmails: false,
    };

    return NextResponse.json({
      success: true,
      preferences
    });

  } catch (error) {
    console.error('Get preferences error:', error);
    return NextResponse.json({
      error: 'Failed to get preferences'
    }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const user = await verifyUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { preferences } = await request.json();

    if (!preferences) {
      return NextResponse.json({ 
        error: 'Preferences required' 
      }, { status: 400 });
    }

    const db = await dbPromise;
    
    // Update or create preferences
    await db.collection('profiles').updateOne(
      { user_id: user.id },
      { 
        $set: { 
          preferences: {
            emailNotifications: preferences.emailNotifications ?? true,
            documentReminders: preferences.documentReminders ?? true,
            marketingEmails: preferences.marketingEmails ?? false,
          },
          updated_at: new Date()
        } 
      },
      { upsert: true }
    );

    return NextResponse.json({
      success: true,
      message: 'Preferences updated successfully'
    });

  } catch (error) {
    console.error('Update preferences error:', error);
    return NextResponse.json({
      error: 'Failed to update preferences'
    }, { status: 500 });
  }
}