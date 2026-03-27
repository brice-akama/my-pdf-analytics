import { NextResponse } from 'next/server';

export async function GET() {
  const results: Record<string, string> = {};

  try {
    const base = process.env.NEXT_PUBLIC_APP_URL || 'https://docmetrics.io';

    const [reminders, expiration, expiry, digest] = await Promise.allSettled([
      fetch(`${base}/api/cron/send-reminders`),
      fetch(`${base}/api/cron/send-expiration-warnings`),
      fetch(`${base}/api/cron/check-expiry`),
      fetch(`${base}/api/cron/weekly-digest`),
    ]);

    results.reminders = reminders.status;
    results.expiration = expiration.status;
    results.expiry = expiry.status;
    results.digest = digest.status;

  } catch (error) {
    console.error('Cron run-all error:', error);
  }

  return NextResponse.json({ success: true, results });
}