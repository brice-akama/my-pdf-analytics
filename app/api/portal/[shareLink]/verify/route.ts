// app/api/portal/[shareLink]/verify/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { dbPromise } from '@/app/api/lib/mongodb';
import { ObjectId } from 'mongodb';
import crypto from 'crypto';

interface Space {
  _id: ObjectId;
  userId: string;
  name: string;
  publicAccess: Array<{
    enabled: boolean;
    shareLink: string | null;
    requireEmail: boolean;
    requirePassword: boolean;
    password: string | null;
    currentViews: number;
    securityLevel: string;
    allowedEmails: string[];
    allowedDomains: string[];
    expiresAt?: Date | null;
    viewLimit?: number | null;
  }>;
  visitors: Array<{
    id: string;
    email: string;
    ipAddress: string;
    userAgent: string;
    firstVisit: Date;
    lastVisit: Date;
    totalViews: number;
    documentsViewed: string[];
    timeSpent: number;
  }>;
}

export async function POST(
  request: NextRequest,
  context: { params: { shareLink: string } | Promise<{ shareLink: string }> }
) {
  try {
    const params = context.params instanceof Promise 
      ? await context.params 
      : context.params;
    
    const shareLink = params.shareLink;
    const body = await request.json();
    const { email, password } = body;

    console.log('🔐 Verifying access:', { shareLink, email: email?.substring(0, 3) + '***' });

    const db = await dbPromise;

    // ✅ FIX: Query using $elemMatch since publicAccess is now an array
    const space = await db.collection('spaces').findOne({
      'publicAccess': {
        $elemMatch: { shareLink: shareLink, enabled: true }
      }
    });

    if (!space) {
      return NextResponse.json({
        success: false,
        error: 'Invalid or expired link'
      }, { status: 404 });
    }

    // ✅ FIX: Find the specific link config from the array
    const linkConfig = Array.isArray(space.publicAccess)
      ? space.publicAccess.find((l: any) => l.shareLink === shareLink && l.enabled !== false)
      : space.publicAccess;

    if (!linkConfig) {
      return NextResponse.json({
        success: false,
        error: 'Invalid or expired link'
      }, { status: 404 });
    }

    // ✅ FIX: Check expiry on linkConfig
    if (linkConfig.expiresAt && new Date(linkConfig.expiresAt) < new Date()) {
      return NextResponse.json({
        success: false,
        error: 'This link has expired'
      }, { status: 403 });
    }

    // ✅ FIX: Check view limit on linkConfig
    if (linkConfig.viewLimit && linkConfig.currentViews >= linkConfig.viewLimit) {
      return NextResponse.json({
        success: false,
        error: 'This link has reached its view limit'
      }, { status: 403 });
    }

    // ✅ FIX: Get security level from linkConfig
    const securityLevel = linkConfig.securityLevel || 'open';
    console.log(`🔒 Security level: ${securityLevel}`);

    // STEP 1: Check email whitelist (for 'whitelist' level)
    if (securityLevel === 'whitelist') {
      if (!email) {
        return NextResponse.json({
          success: false,
          error: 'Email required'
        }, { status: 401 });
      }

      const emailLower = email.toLowerCase();

      // ✅ FIX: Read from linkConfig
      const allowedEmails = linkConfig.allowedEmails || [];
      const allowedDomains = linkConfig.allowedDomains || [];
      
      // Check exact email match
      const emailAllowed = allowedEmails.includes(emailLower);
      
      // Check domain match (e.g., any @client.com)
      const emailDomain = emailLower.split('@')[1];
      const domainAllowed = allowedDomains.length > 0 && allowedDomains.includes(emailDomain);
      
      if (!emailAllowed && !domainAllowed) {
        console.log(`❌ Email not whitelisted: ${email}`);
        console.log(`   Allowed emails:`, allowedEmails);
        console.log(`   Allowed domains:`, allowedDomains);
        return NextResponse.json({
          success: false,
          error: 'This email is not authorized to access this space'
        }, { status: 403 });
      }

      console.log(`✅ Email whitelisted: ${email}`);
    }

    // STEP 2: Check password (for 'password' and 'whitelist' levels)
    // ✅ FIX: Read requirePassword and password from linkConfig
    if (linkConfig.requirePassword) {
      if (!password) {
        return NextResponse.json({
          success: false,
          error: 'Password required'
        }, { status: 401 });
      }

      const bcrypt = require('bcryptjs');
      const passwordMatch = await bcrypt.compare(password, linkConfig.password);
      
      if (!passwordMatch) {
        console.log(`❌ Incorrect password attempt for: ${email}`);
        return NextResponse.json({
          success: false,
          error: 'Incorrect password'
        }, { status: 401 });
      }

      console.log(`✅ Password verified`);
    }

    console.log(`✅ All security checks passed for: ${email} (level: ${securityLevel})`);

    // Generate visitor ID
    const visitorId = crypto.randomBytes(16).toString('hex');

    // Save visitor info
    const visitor = {
      id: visitorId,
      email: email || 'anonymous',
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown',
      firstVisit: new Date(),
      lastVisit: new Date(),
      totalViews: 1,
      documentsViewed: [],
      timeSpent: 0
    };

    // ✅ FIX: Use positional $ operator to increment the correct array element's currentViews
    await db.collection('spaces').updateOne(
      { _id: space._id, 'publicAccess.shareLink': shareLink },
      {
        $push: { visitors: visitor },
        $inc: { 'publicAccess.$.currentViews': 1 }
      } as any
    );

    console.log(`✅ Access granted for: ${email || 'anonymous'}`);

    return NextResponse.json({
      success: true,
      message: 'Access granted',
      visitorId
    });

  } catch (error) {
    console.error('❌ Verify error:', error);
    return NextResponse.json({
      success: false,
      error: 'Verification failed'
    }, { status: 500 });
  }
}