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
    // 🔒 Ensure JWT_SECRET is set
    const JWT_SECRET = process.env.JWT_SECRET;
    if (!JWT_SECRET) {
      console.error('JWT_SECRET is not configured');
      return NextResponse.json(
        { error: 'Server misconfiguration', code: 'MISSING_JWT_SECRET' },
        { status: 500 }
      );
    }

    const db = await dbPromise;
    const users = db.collection('users');
    const auditLog = db.collection('audit_log');

    const clientIP = getClientIP(request);
    const userAgent = getUserAgent(request);

    // Rate limiting
    const rateLimitExceeded = await Promise.resolve(checkRateLimit(`login:${clientIP}`, 5, 3600000));
    if (rateLimitExceeded) {
      return NextResponse.json(
        { error: 'Too many login attempts', code: 'RATE_LIMIT_EXCEEDED' },
        { status: 429 }
      );
    }

    const body = await request.json().catch(() => null);
    if (!body) {
      return NextResponse.json(
        { error: 'Invalid request body', code: 'INVALID_REQUEST' },
        { status: 400 }
      );
    }

    const { email, password } = body;
    const sanitizedEmail = sanitizeInput(email || '').toLowerCase();

    if (!sanitizedEmail || !isValidEmail(sanitizedEmail)) {
      return NextResponse.json(
        { error: 'Invalid email', code: 'INVALID_EMAIL' },
        { status: 400 }
      );
    }
    if (!password) {
      return NextResponse.json(
        { error: 'Password is required', code: 'MISSING_PASSWORD' },
        { status: 400 }
      );
    }

    const user = await users.findOne({ email: sanitizedEmail });
    if (!user) {
      // ⚠️ Don't reveal if email exists — but you're already returning generic error (good!)
      return NextResponse.json(
        { error: 'Invalid email or password', code: 'INVALID_CREDENTIALS' },
        { status: 401 }
      );
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
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

    // ✅ Generate JWT token
    const token = jwt.sign(
      { userId: user._id.toString(), email: user.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // ✅ Audit successful login
    await auditLog.insertOne({
      user_id: user._id,
      action: 'login',
      ip_address: clientIP,
      user_agent: userAgent,
      metadata: { email: sanitizedEmail },
      created_at: new Date(),
    });

    // ✅ Return token + user (include profile for consistency with signup)
    return NextResponse.json(
      {
        success: true,
        message: 'Login successful',
        token,
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
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}