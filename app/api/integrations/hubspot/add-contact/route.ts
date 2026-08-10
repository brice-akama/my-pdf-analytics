// app/api/integrations/hubspot/add-contact/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { verifyUserFromRequest } from '@/lib/auth';
import { getValidHubSpotToken } from '@/lib/integrations/hubspot';

// ── POST: manually add one viewer as a HubSpot contact ─────────────
export async function POST(request: NextRequest) {
  try {
    const user = await verifyUserFromRequest(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { email } = await request.json();
    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'email is required' }, { status: 400 });
    }

    const token = await getValidHubSpotToken(user.id);

    const res = await fetch('https://api.hubapi.com/crm/v3/objects/contacts', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ properties: { email } }),
    });
    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      return NextResponse.json({ error: data?.message || 'Failed to add contact' }, { status: 500 });
    }

    return NextResponse.json({ success: true, contactId: data.id });
  } catch (error) {
    console.error('❌ HubSpot add-contact error:', error);
    return NextResponse.json({ error: 'Failed to add contact' }, { status: 500 });
  }
}