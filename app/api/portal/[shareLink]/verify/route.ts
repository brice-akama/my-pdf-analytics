// app/api/portal/[shareLink]/verify/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { dbPromise } from '@/app/api/lib/mongodb';
import { ObjectId } from 'mongodb';
import crypto from 'crypto';

interface Space {
  _id: ObjectId;
  userId: string;
  name: string;
  publicAccess: {
    enabled: boolean;
    shareLink: string | null;
    requireEmail: boolean;
    requirePassword: boolean;
    password: string | null;
    currentViews: number;
  };
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

    console.log('🔐 Verifying access:', { shareLink, email });

    const db = await dbPromise;

    // Find space
    const space = await db.collection('spaces').findOne({
      'publicAccess.shareLink': shareLink,
      'publicAccess.enabled': true
    });

    if (!space) {
      return NextResponse.json({
        success: false,
        error: 'Invalid link'
      }, { status: 404 });
    }

    // Check password if required
    if (space.publicAccess.requirePassword) {
      if (!password) {
        return NextResponse.json({
          success: false,
          error: 'Password required'
        }, { status: 401 });
      }

      const bcrypt = require('bcryptjs');
      const passwordMatch = await bcrypt.compare(password, space.publicAccess.password);
      
      if (!passwordMatch) {
        return NextResponse.json({
          success: false,
          error: 'Incorrect password'
        }, { status: 401 });
      }
    }

    // Generate visitor ID
    const visitorId = crypto.randomBytes(16).toString('hex');

    // Save visitor info (for tracking in Step 5)
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

    // Update space with new visitor
    await db.collection<Space>('spaces').updateOne(
      { _id: space._id },
      {
        $push: { visitors: visitor },
        $inc: { 'publicAccess.currentViews': 1 }
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