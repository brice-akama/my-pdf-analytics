// app/api/integrations/hubspot/settings/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { verifyUserFromRequest } from '@/lib/auth';
import { dbPromise } from '@/app/api/lib/mongodb';

// ── GET: read the current toggle state ────────────────────────────
export async function GET(request: NextRequest) {
  try {
    const user = await verifyUserFromRequest(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const db = await dbPromise;
    const integration = await db.collection('integrations').findOne({
      userId: user.id, provider: 'hubspot', isActive: true,
    });

    return NextResponse.json({
      success: true,
      autoCreateContacts: integration?.autoCreateContacts === true,
    });
  } catch (error) {
    console.error('❌ HubSpot settings GET error:', error);
    return NextResponse.json({ error: 'Failed to load settings' }, { status: 500 });
  }
}

// ── PATCH: flip the toggle ─────────────────────────────────────────
export async function PATCH(request: NextRequest) {
  try {
    const user = await verifyUserFromRequest(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { autoCreateContacts } = await request.json();
    if (typeof autoCreateContacts !== 'boolean') {
      return NextResponse.json({ error: 'autoCreateContacts must be true or false' }, { status: 400 });
    }

    const db = await dbPromise;
    const result = await db.collection('integrations').updateOne(
      { userId: user.id, provider: 'hubspot', isActive: true },
      { $set: { autoCreateContacts, updatedAt: new Date() } }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: 'HubSpot not connected' }, { status: 404 });
    }

    return NextResponse.json({ success: true, autoCreateContacts });
  } catch (error) {
    console.error('❌ HubSpot settings PATCH error:', error);
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
  }
}