//app/api/user/password/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { verifyUserFromRequest } from '@/lib/auth';
import { ObjectId } from 'mongodb';
import bcrypt from 'bcryptjs';
import { dbPromise } from '../../lib/mongodb';

export async function PATCH(request: NextRequest) {
  try {
    // Verify user
    const user = await verifyUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse request body
    const { currentPassword, newPassword } = await request.json();

    // Validation
    if (!currentPassword || !newPassword) {
      return NextResponse.json({ 
        error: 'Current password and new password are required' 
      }, { status: 400 });
    }

    if (newPassword.length < 8) {
      return NextResponse.json({ 
        error: 'New password must be at least 8 characters' 
      }, { status: 400 });
    }

    // Get user from database
    const db = await dbPromise;
    
    // Try to find user by ObjectId
    let userDoc;
    try {
      userDoc = await db.collection('users').findOne({ 
        _id: new ObjectId(user.id) 
      });
    } catch (error) {
      // Fallback to string ID
      userDoc = await db.collection('users').findOne({ 
        id: user.id 
      });
    }

    if (!userDoc) {
      return NextResponse.json({ 
        error: 'User not found' 
      }, { status: 404 });
    }

    // Check for password field (might be 'password' or 'passwordHash')
    const passwordField = userDoc.password || userDoc.passwordHash;
    
    if (!passwordField) {
      return NextResponse.json({ 
        error: 'Password not set for this account' 
      }, { status: 404 });
    }

    // Verify current password
    const isValid = await bcrypt.compare(currentPassword, passwordField);
    
    if (!isValid) {
      return NextResponse.json({ 
        error: 'Current password is incorrect' 
      }, { status: 401 });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password in database
    let updateResult;
    try {
      updateResult = await db.collection('users').updateOne(
        { _id: new ObjectId(user.id) },
        { 
          $set: { 
            password: hashedPassword,
            passwordHash: hashedPassword,
            updated_at: new Date()
          } 
        }
      );
    } catch (error) {
      updateResult = await db.collection('users').updateOne(
        { id: user.id },
        { 
          $set: { 
            password: hashedPassword,
            passwordHash: hashedPassword,
            updated_at: new Date()
          } 
        }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Password updated successfully'
    });

  } catch (error) {
    console.error('❌ Password update error:', error);
    return NextResponse.json({
      error: 'Failed to update password',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}