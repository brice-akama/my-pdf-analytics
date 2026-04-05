import { NextResponse } from 'next/server';

export async function GET() {
  const results: Record<string, string> = {};

  try {
    const base = process.env.NEXT_PUBLIC_APP_URL || 'https://docmetrics.io';
    const CRON_SECRET = process.env.CRON_SECRET;

    const headers = {
      Authorization: `Bearer ${CRON_SECRET}`
    };

    const [reminders, expiration, expiry, digest] = await Promise.allSettled([
      fetch(`${base}/api/cron/send-reminders`, { headers }),
      fetch(`${base}/api/cron/send-expiration-warnings`, { headers }),
      fetch(`${base}/api/cron/check-expiry`, { headers }),
      fetch(`${base}/api/cron/weekly-digest`, { headers }),
    ]);

    results.reminders   = reminders.status;
    results.expiration  = expiration.status;
    results.expiry      = expiry.status;
    results.digest      = digest.status;

  } catch (error) {
    console.error('Cron run-all error:', error);
  }

  return NextResponse.json({ success: true, results });
}