import { NextRequest, NextResponse } from "next/server";
import { sendContactEmail } from "@/lib/emailService";

const ipSubmissions = new Map<string, { count: number; windowStart: number }>();

const RATE_LIMIT = {
  maxRequests: 3,
  windowMs: 60 * 60 * 1000,
};

function checkRateLimit(ip: string): {
  allowed: boolean;
  remaining: number;
  resetInMinutes: number;
} {
  const now = Date.now();
  const record = ipSubmissions.get(ip);

  if (!record) {
    ipSubmissions.set(ip, { count: 1, windowStart: now });
    return { allowed: true, remaining: RATE_LIMIT.maxRequests - 1, resetInMinutes: 60 };
  }

  const windowAge = now - record.windowStart;

  if (windowAge > RATE_LIMIT.windowMs) {
    ipSubmissions.set(ip, { count: 1, windowStart: now });
    return { allowed: true, remaining: RATE_LIMIT.maxRequests - 1, resetInMinutes: 60 };
  }

  if (record.count >= RATE_LIMIT.maxRequests) {
    const resetInMinutes = Math.ceil((RATE_LIMIT.windowMs - windowAge) / 1000 / 60);
    return { allowed: false, remaining: 0, resetInMinutes };
  }

  record.count += 1;
  ipSubmissions.set(ip, record);
  return {
    allowed: true,
    remaining: RATE_LIMIT.maxRequests - record.count,
    resetInMinutes: Math.ceil((RATE_LIMIT.windowMs - windowAge) / 1000 / 60),
  };
}

setInterval(() => {
  const now = Date.now();
  for (const [ip, record] of ipSubmissions.entries()) {
    if (now - record.windowStart > RATE_LIMIT.windowMs) {
      ipSubmissions.delete(ip);
    }
  }
}, 60 * 60 * 1000);

//  This is the critical line — named export, uppercase POST
export async function POST(request: NextRequest) {
  try {
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      request.headers.get("x-real-ip") ??
      "anonymous";

    const { allowed, remaining, resetInMinutes } = checkRateLimit(ip);

    if (!allowed) {
      return NextResponse.json(
        {
          success: false,
          error: `Too many messages sent. Please try again in ${resetInMinutes} minute${resetInMinutes === 1 ? "" : "s"}.`,
        },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { name, email, subject, message } = body;

    if (!name?.trim() || !email?.trim() ||
        !subject?.trim() || !message?.trim()) {
      return NextResponse.json(
        { success: false, error: "All fields are required" },
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

    await sendContactEmail({ name, email, subject, message });

    return NextResponse.json({
      success: true,
      message: "Message sent successfully",
      remaining,
    });

  } catch (error) {
    console.error("Contact form error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to send message" },
      { status: 500 }
    );
  }
}