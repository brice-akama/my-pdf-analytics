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
import { sendWelcomeEmail } from '@/lib/emailService';
import { notifyInviterOfAcceptance } from '@/lib/emails/teamEmails';

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
 if (rateLimitExceeded) {   return NextResponse.json({ error: 'Too many signup attempts' }, { status: 429 });
 }

    const body = await request.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    //   Accept Google payload too
   const { firstName, lastName, companyName, email, password, avatar, full_name } = body;

    //   Better fallback handling
    const sanitizedFirstName = sanitizeInput(
      firstName || 
      (full_name ? full_name.split(' ')[0] : '') || 
      ''
    );
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

// ✅ Validate companyName ONLY if provided
if (sanitizedCompanyName && !isValidName(sanitizedCompanyName)) {
  invalidFields.push({ field: 'companyName', reason: 'Invalid company name' });
}

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
    // ✅ ADD THESE DEBUG LOGS
console.log('🔍 Signup Debug:', {
  isOAuthSignup,
  hasPassword: !!password,
  passwordToHash: passwordToHash.slice(0, 3) + '***', // Only show first 3 chars
  passwordLength: passwordToHash.length
});
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

   /* ======================================================
   AUTO-ACCEPT PENDING ORGANIZATION INVITATIONS
====================================================== */

const pendingInvitations = await db
  .collection('organization_members')
  .find({
    email: sanitizedEmail,
    status: 'invited'
  })
  .toArray();

let organizationId = insertedUserId; // Default: user creates own org
let userRole = 'owner'; // Default role

if (pendingInvitations.length > 0) {
  // ✅ JOIN EXISTING ORGANIZATION - DON'T CREATE NEW ONE
  const invite = pendingInvitations[0]; // Take first invitation
  organizationId = invite.organizationId; // Use inviter's org
  userRole = invite.role ; // Use invited role

  for (const inv of pendingInvitations) {
    await db.collection('organization_members').updateOne(
      { _id: inv._id },
      {
        $set: {
          userId: insertedUserId,
          status: 'active',
          joinedAt: new Date(),
          lastActiveAt: new Date()
        }
      }
    );
  }

  console.log(`✅ User ${sanitizedEmail} joined organization ${organizationId} as ${userRole}`);
  // ✅ NOTIFY INVITER — this is the missing piece for the signup flow
  // Run after response is built so it never blocks signup
  const inviterUserIdToNotify = invite.invitedBy;
  const newMemberDisplayName = fullName || sanitizedFirstName;
  const orgName = invite.organizationName || "your team"; // fallback

  // Fire and forget — don't await, don't block signup
  notifyInviterOfAcceptance({
    invitedByUserId: inviterUserIdToNotify,
    newMemberName: newMemberDisplayName,
    newMemberEmail: sanitizedEmail,
    role: userRole,
    organizationName: orgName,
  }).catch((err) => {
    console.error("❌ Signup: failed to notify inviter (non-blocking):", err);
  });
} else {
  console.log(`✅ User ${sanitizedEmail} created new organization as owner`);
}

    const profileDoc = {
      _id: new ObjectId(insertedUserId),
      user_id: insertedUserId,
      email: sanitizedEmail,
      full_name: fullName,
      first_name: sanitizedFirstName,
      last_name: sanitizedLastName || null,
      avatar_url: sanitizedAvatar || null,
      company_name: sanitizedCompanyName || null,
      organization_id: organizationId, //   ADD THIS
  role: userRole, //   ADD THIS
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

    // 📧 Send welcome email
try {
  await sendWelcomeEmail({
    recipientName: sanitizedFirstName,
    recipientEmail: sanitizedEmail,
  });
  console.log('✅ Welcome email queued for:', sanitizedEmail);
} catch (emailError) {
  console.error('⚠️ Failed to send welcome email (non-blocking):', emailError);
  // Don't block signup if email fails
}

    const token = jwt.sign(
      { userId: insertedUserId, email: sanitizedEmail },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    );

    const response = NextResponse.json({
  success: true,
  message: 'Account created successfully',
  user: {
    id: insertedUserId,
    email: sanitizedEmail,
    full_name: fullName,
    provider: userDoc.provider,
    profile: userDoc.profile
  }
});

// Set HTTP-only cookie
response.cookies.set('token', token, {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
   sameSite: 'lax',
  maxAge: 60 * 60 * 24 * 7, // 7 days
  path: '/'
});

return response;
  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
