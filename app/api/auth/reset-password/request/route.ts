 // app/api/auth/reset-password/request/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { dbPromise } from '../../../lib/mongodb';
import { sanitizeInput, isValidEmail } from '@/lib/security';
 import { sendPasswordResetEmail } from '@/lib/emailService.welcome';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;
    
    const sanitizedEmail = sanitizeInput(email || '').toLowerCase();

    if (!sanitizedEmail || !isValidEmail(sanitizedEmail)) {
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 }
      );
    }

    const db = await dbPromise;
    const users = db.collection('users');
    const profiles = db.collection('profiles');
    
    // ✅ Check BOTH collections
    console.log('🔍 Looking for user:', sanitizedEmail);
    
    const user = await users.findOne({ email: sanitizedEmail });
    const profile = await profiles.findOne({ email: sanitizedEmail });

    console.log('👤 User found in users collection:', user ? 'YES' : 'NO');
    console.log('👤 Profile found in profiles collection:', profile ? 'YES' : 'NO');

    // ✅ User must exist in at least one collection
    if (!user && !profile) {
      console.log('⚠️ Reset requested for non-existent email:', sanitizedEmail);
      return NextResponse.json({ 
        success: true, 
        message: 'If that email exists, we sent a code' 
      });
    }

    if (user?.provider === 'google') {
  return NextResponse.json({
    error: 'This account uses Google Sign-In. Please login with Google instead.'
  }, { status: 400 });
}

    // ✅ Get user name from either collection
    let recipientName = 'User';
    
    if (user?.profile?.firstName) {
      recipientName = user.profile.firstName;
    } else if (user?.profile?.fullName) {
      recipientName = user.profile.fullName;
    } else if (profile?.first_name) {
      recipientName = profile.first_name;
    } else if (profile?.full_name) {
      recipientName = profile.full_name;
    }

    console.log('👤 Recipient name:', recipientName);

    // ✅ Generate 6-digit code
    const resetCode = crypto.randomInt(100000, 999999).toString();
    const resetToken = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    // ✅ Store reset token
    await db.collection('password_resets').insertOne({
      email: sanitizedEmail,
      code: resetCode,
      token: resetToken,
      user_id: user?._id?.toString() || profile?.user_id || profile?._id?.toString(),
      expires_at: expiresAt,
      created_at: new Date()
    });

    console.log('💾 Reset token stored in database');

    // ✅ Send email with code using Resend
    try {
      console.log('📧 Sending reset email to:', sanitizedEmail);
      
      const emailResult = await sendPasswordResetEmail({
        recipientName: recipientName,
        recipientEmail: sanitizedEmail,
        resetCode: resetCode,
      });
      
      console.log('✅ Password reset email sent successfully:', emailResult);
    } catch (emailError: any) {
      console.error('❌ Failed to send reset email:', emailError);
      console.error('❌ Error message:', emailError.message);
      console.error('❌ Error details:', emailError);
      // Don't fail the request if email fails
    }
    
    console.log(`🔐 Reset code for ${sanitizedEmail}: ${resetCode}`);

    return NextResponse.json({ 
      success: true, 
      message: 'Reset code sent to your email' 
    });

  } catch (error: any) {
    console.error('❌ Reset request error:', error);
    console.error('❌ Error message:', error.message);
    console.error('❌ Error stack:', error.stack);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
