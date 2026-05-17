import { NextRequest, NextResponse } from 'next/server';
import { runFollowUpCadenceJob } from '@/lib/followUpCadenceJob';

export async function GET(request: NextRequest) {
  // Verify this is a legitimate cron call
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await runFollowUpCadenceJob();
  return NextResponse.json({ success: true });
}