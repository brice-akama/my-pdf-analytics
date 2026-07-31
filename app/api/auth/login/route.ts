// app/api/auth/login/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { dbPromise } from '../../lib/mongodb';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import {
  sanitizeInput,
  isValidEmail,
  getClientIP,
  getUserAgent,
  checkRateLimit
} from '@/lib/security';

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 Login API called');

    // 🔒 Ensure JWT_SECRET is set
    const JWT_SECRET = process.env.JWT_SECRET;
    if (!JWT_SECRET) {
      console.error('❌ JWT_SECRET is not configured');
      return NextResponse.json(
        { error: 'Server misconfiguration', code: 'MISSING_JWT_SECRET' },
        { status: 500 }
      );
    }

    console.log('✅ JWT_SECRET exists');

    const db = await dbPromise;
    console.log('✅ Database connected');

    const users = db.collection('users');
    const auditLog = db.collection('audit_log');

    const clientIP = getClientIP(request);
    const userAgent = getUserAgent(request);

    console.log('🌍 Client Info:', { clientIP, userAgent });

    // 🔒 Rate limit login attempts — 10 per IP per hour. Wrapped so a bug
    // in checkRateLimit itself can NEVER block a real login — fail-open.
    try {
      const rateLimitExceeded = await Promise.resolve(checkRateLimit(`login:${clientIP}`, 10, 3600000));
      if (rateLimitExceeded) {
        return NextResponse.json(
          { error: 'Too many login attempts. Please try again later.', code: 'RATE_LIMITED' },
          { status: 429 }
        );
      }
    } catch (err) {
      console.error('⚠️ Rate limit check failed (non-blocking):', err);
    }

    const body = await request.json().catch((err) => {
      console.error('❌ Failed to parse request body:', err);
      return null;
    });

    if (!body) {
      console.error('❌ Request body is null');
      return NextResponse.json(
        { error: 'Invalid request body', code: 'INVALID_REQUEST' },
        { status: 400 }
      );
    }

    console.log('📦 Raw request body:', body);

    const { email, password } = body;

// ✅ Only sanitize email, NOT password
const sanitizedEmail = sanitizeInput(email || '').toLowerCase();

console.log('🧼 Sanitized Email:', sanitizedEmail);

if (!sanitizedEmail || !isValidEmail(sanitizedEmail)) {
  console.error('❌ Invalid email format');
  return NextResponse.json(
    { error: 'Invalid email', code: 'INVALID_EMAIL' },
    { status: 400 }
  );
}

// ✅ Check password exists but DON'T sanitize it
if (!password || typeof password !== 'string') {
  console.error('❌ Password missing or invalid');
  return NextResponse.json(
    { error: 'Password is required', code: 'MISSING_PASSWORD' },
    { status: 400 }
  );
}

    console.log('🔍 Searching user in database...');
    const user = await users.findOne({ email: sanitizedEmail });

    if (!user) {
      console.error('❌ User not found for email:', sanitizedEmail);
      return NextResponse.json(
        { error: 'Invalid email or password', code: 'INVALID_CREDENTIALS' },
        { status: 401 }
      );
    }

    console.log('✅ User found:', {
      id: user._id?.toString(),
      email: user.email,
      provider: user.provider
    });

    if (!user.passwordHash) {
      console.error('❌ passwordHash missing in database for user');
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    console.log('🔐 Password comparison result:', isPasswordValid);

    if (!isPasswordValid) {
      console.error('❌ Invalid password for user:', sanitizedEmail);

      await auditLog.insertOne({
        user_id: user._id,
        action: 'failed_login',
        ip_address: clientIP,
        user_agent: userAgent,
        metadata: { email: sanitizedEmail },
        created_at: new Date(),
      });

      return NextResponse.json(
        { error: 'Invalid email or password', code: 'INVALID_CREDENTIALS' },
        { status: 401 }
      );
    }

    console.log('✅ Password valid. Generating JWT...');

    // Record this login on the user document — this is what the admin
    // dashboard's "last login" reads. Wrapped so a write failure here
    // never blocks the actual login.
    try {
      await users.updateOne(
        { _id: user._id },
        { $set: { lastLoginAt: new Date() } }
      );
    } catch (err) {
      console.error('⚠️ Failed to update lastLoginAt (non-blocking):', err);
    }

    const token = jwt.sign(
      { userId: user._id.toString(), email: user.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    console.log('🎟️ JWT generated');

    await auditLog.insertOne({
      user_id: user._id,
      action: 'login',
      ip_address: clientIP,
      user_agent: userAgent,
      metadata: { email: sanitizedEmail },
      created_at: new Date(),
    });

    console.log('📝 Login audit log inserted');

    const response = NextResponse.json(
      {
        success: true,
        message: 'Login successful',
        user: {
          id: user._id.toString(),
          email: user.email,
          full_name: user.profile?.fullName || '',
          provider: user.provider,
          profile: {
            firstName: user.profile?.firstName || '',
            lastName: user.profile?.lastName || '',
            companyName: user.profile?.companyName || '',
            avatarUrl: user.profile?.avatarUrl || null,
          },
        },
      },
      { status: 200 }
    );

    response.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    });

    console.log('🍪 Cookie set. Returning success response.');

    return response;

  } catch (error) {
    console.error('🔥 Login error (CATCH BLOCK):', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
