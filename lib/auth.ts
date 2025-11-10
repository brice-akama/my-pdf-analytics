// lib/auth.ts
// lib/auth.ts
import { dbPromise } from '@/app/api/lib/mongodb';
import jwt from 'jsonwebtoken';
import { ObjectId } from 'mongodb';
import { NextRequest } from 'next/server';

export async function verifyUserFromRequest(request: NextRequest) {
  // Read token from HTTP-only cookie instead of Authorization header
  const token = request.cookies.get('token')?.value;
  
  if (!token) {
    return null;
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string; email: string };
    const db = await dbPromise;
    
    // Fetch user + profile
    const user = await db.collection('users').findOne(
      { _id: new ObjectId(decoded.userId) },
      { projection: { passwordHash: 0 } }
    );

    if (!user) return null;

    const profile = await db.collection('profiles').findOne({ user_id: decoded.userId });

    return {
      id: decoded.userId,
      email: user.email,
      plan: profile?.plan || 'free',
    };
  } catch (error) {
    console.error('Token verification failed:', error);
    return null;
  }
}