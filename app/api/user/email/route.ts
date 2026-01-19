import { NextRequest, NextResponse } from 'next/server';
import { dbPromise } from '../../lib/mongodb';
import { verifyUserFromRequest } from '@/lib/auth';
import { ObjectId } from 'mongodb';

export async function PATCH(request: NextRequest) {
  try {
    const user = await verifyUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { newEmail } = await request.json();

    if (!newEmail) {
      return NextResponse.json({ 
        error: 'New email is required' 
      }, { status: 400 });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newEmail)) {
      return NextResponse.json({ 
        error: 'Invalid email format' 
      }, { status: 400 });
    }

    const db = await dbPromise;

    // Check if email already exists
    const existingUser = await db.collection('users').findOne({ 
      email: newEmail.toLowerCase() 
    });

    if (existingUser) {
      return NextResponse.json({ 
        error: 'Email already in use' 
      }, { status: 409 });
    }

    const lowerEmail = newEmail.toLowerCase();

    // Update in users collection
    await db.collection('users').updateOne(
      { _id: new ObjectId(user.id) },
      { 
        $set: { 
          email: lowerEmail,
          email_verified: false, // Require re-verification
          updated_at: new Date()
        } 
      }
    );

    // Update in profiles collection
    await db.collection('profiles').updateOne(
      { user_id: user.id },
      { 
        $set: { 
          email: lowerEmail,
          updatedAt: new Date()
        } 
      }
    );

    return NextResponse.json({
      success: true,
      message: 'Email updated successfully. Please verify your new email.',
      newEmail: lowerEmail
    });

  } catch (error) {
    console.error('Email update error:', error);
    return NextResponse.json({
      error: 'Failed to update email'
    }, { status: 500 });
  }
}