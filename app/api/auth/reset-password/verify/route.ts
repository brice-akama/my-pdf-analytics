// app/api/auth/reset-password/verify/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { dbPromise } from '../../../lib/mongodb';
import { sanitizeInput, isValidEmail, isValidPassword } from '@/lib/security';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, code, newPassword } = body;
    
    const sanitizedEmail = sanitizeInput(email || '').toLowerCase();

    if (!sanitizedEmail || !isValidEmail(sanitizedEmail)) {
      return NextResponse.json({ error: 'Invalid email' }, { status: 400 });
    }

    if (!code || code.length !== 6) {
      return NextResponse.json({ error: 'Invalid code' }, { status: 400 });
    }

    if (!isValidPassword(newPassword)) {
      return NextResponse.json({ 
        error: 'Password must be at least 8 characters with uppercase, lowercase, and number' 
      }, { status: 400 });
    }

    const db = await dbPromise;

    // ✅ Find valid reset code
    const resetRequest = await db.collection('password_resets').findOne({
      email: sanitizedEmail,
      code: code,
      expires_at: { $gt: new Date() }
    });

    if (!resetRequest) {
      return NextResponse.json({ 
        error: 'Invalid or expired code' 
      }, { status: 400 });
    }

    // ✅ Hash new password
    const passwordHash = await bcrypt.hash(newPassword, 12);

    // ✅ Update user password
    await db.collection('users').updateOne(
      { email: sanitizedEmail },
      { 
        $set: { 
          passwordHash,
          hasPassword: true, // ✅ Mark that user now has a password
          provider: 'both', // ✅ Can now use both Google and password
          updated_at: new Date()
        } 
      }
    );

    // ✅ Delete used reset code
    await db.collection('password_resets').deleteMany({ email: sanitizedEmail });

    // ✅ Log the action
    await db.collection('audit_log').insertOne({
      user_email: sanitizedEmail,
      action: 'password_reset',
      metadata: { method: 'reset_code' },
      created_at: new Date()
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Password reset successful' 
    });

  } catch (error) {
    console.error('Reset verify error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}