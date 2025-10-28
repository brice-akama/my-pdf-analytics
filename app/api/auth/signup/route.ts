// app/api/auth/signup/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { dbPromise } from '../../lib/mongodb';
import { ObjectId } from 'mongodb';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import {
  sanitizeInput,
  isValidEmail,
  isValidPassword,
  isValidName,
  getClientIP,
  getUserAgent,
  checkRateLimit
} from '@/lib/security';

export async function POST(request: NextRequest) {
  try {
    const db = await dbPromise;
    const users = db.collection('users');
    const profiles = db.collection('profiles');
    const auditLog = db.collection('audit_log');

    await Promise.all([
      users.createIndex({ email: 1 }, { unique: true }),
      profiles.createIndex({ email: 1 }, { unique: true }),
      profiles.createIndex({ user_id: 1 }, { unique: true })
    ]);

    const clientIP = getClientIP(request);
    const userAgent = getUserAgent(request);

    // Rate limit
    const rateLimitExceeded = await Promise.resolve(checkRateLimit(`signup:${clientIP}`, 3, 3600000));
    if (rateLimitExceeded) {
      return NextResponse.json({ error: 'Too many signup attempts' }, { status: 429 });
    }

    const body = await request.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    // ✅ Accept Google payload too
    const { firstName, lastName, companyName, email, password, avatar, full_name } = body;

    const sanitizedFirstName = sanitizeInput(firstName || (full_name?.split(' ')[0] ?? ''));
    const sanitizedLastName = sanitizeInput(lastName || (full_name?.split(' ').slice(1).join(' ') ?? ''));
    const sanitizedCompanyName = sanitizeInput(companyName || '');
    const sanitizedEmail = sanitizeInput(email || '').toLowerCase();
    const sanitizedAvatar = sanitizeInput(avatar || '');

    // ✅ Smarter OAuth detection — assume OAuth if there's no password or we have avatar/full_name
    const isOAuthSignup = !password || !!sanitizedAvatar || !!full_name;

    const missingFields: string[] = [];
    const invalidFields: { field: string; reason: string }[] = [];

    if (!sanitizedFirstName) missingFields.push('firstName');
    else if (!isValidName(sanitizedFirstName)) invalidFields.push({ field: 'firstName', reason: 'Invalid first name' });

    if (!sanitizedEmail) missingFields.push('email');
    else if (!isValidEmail(sanitizedEmail)) invalidFields.push({ field: 'email', reason: 'Invalid email address' });

    // ✅ Skip password check if Google signup
    if (!isOAuthSignup) {
      if (!password) missingFields.push('password');
      else if (!isValidPassword(password)) invalidFields.push({ field: 'password', reason: 'Password too weak' });
    }

    if (missingFields.length) {
      return NextResponse.json({ error: 'Missing required fields', missingFields }, { status: 400 });
    }

    if (invalidFields.length) {
      return NextResponse.json({ error: 'Invalid field values', invalidFields }, { status: 400 });
    }

    const fullName = `${sanitizedFirstName}${sanitizedLastName ? ' ' + sanitizedLastName : ''}`.trim();
    const existingProfile = await profiles.findOne({ email: sanitizedEmail });
    if (existingProfile) {
      return NextResponse.json({ error: 'Email already exists' }, { status: 409 });
    }

    // ✅ Random password for OAuth users
    const randomPassword = Math.random().toString(36).slice(-16);
    const passwordToHash = isOAuthSignup ? randomPassword : password;
    const passwordHash = await bcrypt.hash(passwordToHash, 10);
    const now = new Date();

    const userDoc = {
      email: sanitizedEmail,
      passwordHash,
      provider: isOAuthSignup ? 'google' : 'local',
      profile: {
        firstName: sanitizedFirstName,
        lastName: sanitizedLastName || null,
        fullName,
        companyName: sanitizedCompanyName || null,
        avatarUrl: sanitizedAvatar || null
      },
      email_verified: isOAuthSignup ? true : false,
      created_at: now,
      updated_at: now
    };

    const insertResult = await users.insertOne(userDoc);
    const insertedUserId = insertResult.insertedId.toString();

    const profileDoc = {
      _id: new ObjectId(insertedUserId),
      user_id: insertedUserId,
      email: sanitizedEmail,
      full_name: fullName,
      first_name: sanitizedFirstName,
      last_name: sanitizedLastName || null,
      avatar_url: sanitizedAvatar || null,
      company_name: sanitizedCompanyName || null,
      created_at: now
    };

    await profiles.updateOne({ user_id: insertedUserId }, { $set: profileDoc }, { upsert: true });

    await auditLog.insertOne({
      user_id: insertedUserId,
      action: 'signup',
      ip_address: clientIP,
      user_agent: userAgent,
      metadata: {
        email: sanitizedEmail,
        signup_method: isOAuthSignup ? 'oauth' : 'email'
      },
      created_at: now
    });

    const token = jwt.sign(
      { userId: insertedUserId, email: sanitizedEmail },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    );

    return NextResponse.json({
      success: true,
      message: 'Account created successfully',
      token,
      user: {
        id: insertedUserId,
        email: sanitizedEmail,
        full_name: fullName,
        provider: userDoc.provider,
        profile: userDoc.profile
      }
    });
  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
