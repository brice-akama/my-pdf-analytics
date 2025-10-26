import { NextRequest, NextResponse } from 'next/server';
import { dbPromise } from '../lib/mongodb';
import { verifyUserFromRequest } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const user = await verifyUserFromRequest(authHeader);
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = await dbPromise;
    
    // Get user's spaces
    const spaces = await db.collection('spaces')
      .find({ userId: user.id })
      .sort({ updatedAt: -1 })
      .toArray();

    return NextResponse.json({
      success: true,
      spaces
    });

  } catch (error) {
    console.error('Get spaces error:', error);
    return NextResponse.json({ error: 'Failed to get spaces' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const user = await verifyUserFromRequest(authHeader);
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { name, template, color } = await request.json();
    
    const db = await dbPromise;
    
    const space = {
      userId: user.id,
      name,
      template: template || null,
      color: color || '#8B5CF6',
      active: true,
      documents: [],
      members: [{ email: user.email, role: 'owner' }],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await db.collection('spaces').insertOne(space);

    return NextResponse.json({
      success: true,
      spaceId: result.insertedId.toString(),
      space: { ...space, _id: result.insertedId }
    });

  } catch (error) {
    console.error('Create space error:', error);
    return NextResponse.json({ error: 'Failed to create space' }, { status: 500 });
  }
}