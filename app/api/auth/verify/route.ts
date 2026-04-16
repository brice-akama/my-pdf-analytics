// Create this file: app/api/auth/verify/route.ts

import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { dbPromise } from '../../lib/mongodb';

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('token')?.value;

   

    if (!token) {
      console.log('❌ No token found in cookies');
      return NextResponse.json({ 
        authenticated: false,
        error: 'Not authenticated' 
      }, { status: 401 });
    }

    // Verify JWT token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET_KEY!) as {
        userId: string;
        email: string;
        exp?: number;
      };
    } catch (error) {
      console.error('❌ JWT verification failed:', error);
      return NextResponse.json({ 
        authenticated: false,
        error: 'Invalid token' 
      }, { status: 401 });
    }

    console.log('✅ Token verified for user:', decoded.email);

    // Optional: Check if user still exists in database
    try {
      const db = await dbPromise;
      const users = db.collection('users');
      const user = await users.findOne({ email: decoded.email });

      if (!user) {
        console.log('⚠️ User not found in database');
        return NextResponse.json({ 
          authenticated: false,
          error: 'User not found' 
        }, { status: 401 });
      }

      // Return user info
      return NextResponse.json({
        authenticated: true,
        user: {
          id: decoded.userId,
          email: decoded.email,
          profile: user.profile
        }
      });
    } catch (dbError) {
      console.error('❌ Database error:', dbError);
      // Even if DB check fails, token is valid
      return NextResponse.json({
        authenticated: true,
        user: {
          id: decoded.userId,
          email: decoded.email
        }
      });
    }
  } catch (error) {
    console.error('❌ Verify endpoint error:', error);
    return NextResponse.json({ 
      authenticated: false,
      error: 'Internal server error' 
    }, { status: 500 });
  }
}

// Optional: Also handle POST requests if needed
export async function POST(request: NextRequest) {
  return GET(request);
} 