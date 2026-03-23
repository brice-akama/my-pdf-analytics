import { NextRequest, NextResponse } from "next/server";
import {
  sendNewsletterWelcomeEmail,
  sendNewsletterNotificationEmail,
} from "@/lib/emailService";

console.log(" newsletter/route.ts loaded");

// ── IN-MEMORY RATE LIMITER ────────────────────────────────────
const ipSubmissions = new Map<string, { count: number; windowStart: number }>();

const RATE_LIMIT = {
  maxRequests: 3,
  windowMs: 60 * 60 * 1000,
};

function checkRateLimit(ip: string): {
  allowed: boolean;
  resetInMinutes: number;
} {
  const now = Date.now();
  const record = ipSubmissions.get(ip);

  if (!record) {
    ipSubmissions.set(ip, { count: 1, windowStart: now });
    return { allowed: true, resetInMinutes: 60 };
  }

  const windowAge = now - record.windowStart;

  if (windowAge > RATE_LIMIT.windowMs) {
    ipSubmissions.set(ip, { count: 1, windowStart: now });
    return { allowed: true, resetInMinutes: 60 };
  }

  if (record.count >= RATE_LIMIT.maxRequests) {
    const resetInMinutes = Math.ceil(
      (RATE_LIMIT.windowMs - windowAge) / 1000 / 60
    );
    return { allowed: false, resetInMinutes };
  }

  record.count += 1;
  ipSubmissions.set(ip, record);
  return { allowed: true, resetInMinutes: 0 };
}

setInterval(() => {
  const now = Date.now();
  for (const [ip, record] of ipSubmissions.entries()) {
    if (now - record.windowStart > RATE_LIMIT.windowMs) {
      ipSubmissions.delete(ip);
    }
  }
}, 60 * 60 * 1000);
// ─────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  console.log("📨 POST /api/newsletter hit");

  try {
    // ── GET IP ────────────────────────────────────────────────
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      request.headers.get("x-real-ip") ??
      "anonymous";

    // ── RATE LIMIT ────────────────────────────────────────────
    const { allowed, resetInMinutes } = checkRateLimit(ip);

    if (!allowed) {
      console.log(" Rate limit exceeded for IP:", ip);
      return NextResponse.json(
        {
          success: false,
          error: `Too many attempts. Please try again in ${resetInMinutes} minute${resetInMinutes === 1 ? "" : "s"}.`,
        },
        { status: 429 }
      );
    }

    // ── PARSE & VALIDATE ──────────────────────────────────────
    const body = await request.json();
    const { email } = body;

    console.log(" Newsletter subscription for:", email);

    if (!email?.trim()) {
      return NextResponse.json(
        { success: false, error: "Email address is required" },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, error: "Invalid email address" },
        { status: 400 }
      );
    }

    // ── SEND BOTH EMAILS IN PARALLEL ─────────────────────────
    console.log("📧 Sending welcome + notification emails...");
    await Promise.all([
      sendNewsletterWelcomeEmail({ email }),        
      sendNewsletterNotificationEmail({ email }),   
    ]);

    console.log(" Newsletter emails sent successfully");

    return NextResponse.json({
      success: true,
      message: "Subscribed successfully",
    });

  } catch (error) {
    console.error("❌ Newsletter route error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to subscribe. Please try again." },
      { status: 500 }
    );
  }
}
 