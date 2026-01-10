// app/api/organizations/[id]/public-info/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { dbPromise } from '@/app/api/lib/mongodb';
import { ObjectId } from 'mongodb';

// ✅ Public endpoint - no auth required
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: orgId } = await params;

    const db = await dbPromise;

    const org = await db.collection('organizations').findOne({
      _id: new ObjectId(orgId)
    });

    if (!org) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      );
    }

    // ✅ Return only public info (no sensitive data)
    return NextResponse.json({
      success: true,
      name: org.name,
      slug: org.slug
    });

  } catch (error) {
    console.error('Get public org info error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch organization' },
      { status: 500 }
    );
  }
}