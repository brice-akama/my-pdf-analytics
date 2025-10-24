// lib/auth.ts
import { dbPromise } from '@/app/api/lib/mongodb';
import jwt from 'jsonwebtoken';
import { ObjectId } from 'mongodb';
 

export async function verifyUserFromRequest(authHeader: string | null) {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.split(' ')[1];
  if (!token) return null;

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