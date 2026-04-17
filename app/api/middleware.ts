// middleware.ts
//
// WHAT THIS FILE DOES:
//   Runs on every matched request before it reaches any page or API route.
//   Handles three concerns:
//     1. Admin route protection (unchanged from original)
//     2. Dashboard route protection with JWT verify + token refresh (unchanged)
//     3. Root redirect for logged-in users (unchanged)
//
// PHASE 5 ADDITIONS (marked with PHASE 5):
//   Added /plan and /upgrade/* to the protected route list so users cannot
//   access the upgrade page without being logged in.
//   Added /api/webhooks/* to the explicitly allowed list so Paddle's webhook
//   calls are NEVER blocked by auth checks — Paddle does its own signing.
//   Everything else is identical to the original.
//
// WHAT THIS MIDDLEWARE DELIBERATELY DOES NOT DO:
//   It does not check subscription status. That would require a MongoDB query
//   on every single request — too expensive. Subscription enforcement happens
//   inside individual API routes via checkAccess() from lib/checkAccess.ts.
//   The UI shows banners for expired trials but never locks users out entirely.

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify, SignJWT } from "jose";

const ADMIN_SECRET = new TextEncoder().encode(process.env.JWT_SECRET_KEY || "default_secret");
const USER_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "default_secret");

async function verifyToken(token: string, secret: Uint8Array) {
  try {
    const { payload } = await jwtVerify(token, secret);
    return payload;
  } catch {
    return null;
  }
}

async function refreshUserToken(payload: any) {
  return await new SignJWT({
    userId: payload.userId,
    email: payload.email,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("7d")
    .sign(USER_SECRET);
}

// Fast token decode — reads payload without full crypto verify.
// Used for expiry pre-check to avoid unnecessary jwtVerify calls.
function fastDecodeToken(token: string): any | null {
  try {
    const base64Payload = token.split(".")[1];
    if (!base64Payload) return null;
    return JSON.parse(Buffer.from(base64Payload, "base64").toString());
  } catch {
    return null;
  }
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // ── PHASE 5: Webhook routes must NEVER require auth ───────────────────────
  // Paddle calls /api/webhooks/paddle directly with its own signature-based
  // auth. If our middleware tried to check for a user JWT on this route,
  // Paddle's calls would be rejected with 401 and we would never process
  // payment events. Webhook routes bypass all auth checks here.
  if (pathname.startsWith("/api/webhooks/")) {
    return NextResponse.next();
  }

  // ── ADMIN ROUTES (unchanged) ─────────────────────────────────────────────
  if (pathname.startsWith("/admin")) {
    const adminToken = request.cookies.get("auth_token")?.value;
    if (!adminToken) {
      return NextResponse.redirect(new URL("/admin/secure-login", request.url));
    }
    const adminPayload = await verifyToken(adminToken, ADMIN_SECRET);
    if (!adminPayload) {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }
    return NextResponse.next();
  }

  // ── ROOT REDIRECT (unchanged) ────────────────────────────────────────────
  if (pathname === "/") {
    const userToken = request.cookies.get("token")?.value;
    if (userToken) {
      const payload = await verifyToken(userToken, USER_SECRET);
      if (payload) {
        return NextResponse.redirect(new URL("/dashboard", request.url));
      }
    }
    return NextResponse.next();
  }

  // ── DASHBOARD ROUTES (unchanged) ─────────────────────────────────────────
  if (pathname === "/dashboard" || pathname.startsWith("/dashboard/")) {
    const userToken = request.cookies.get("token")?.value;

    if (!userToken) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    const decoded = fastDecodeToken(userToken);
    const now = Math.floor(Date.now() / 1000);

    if (!decoded || !decoded.exp || decoded.exp <= now) {
      const response = NextResponse.redirect(new URL("/login", request.url));
      response.cookies.delete("token");
      return response;
    }

    const payload = await verifyToken(userToken, USER_SECRET);
    if (!payload) {
      const response = NextResponse.redirect(new URL("/login", request.url));
      response.cookies.delete("token");
      return response;
    }

    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("x-user-id", String(payload.userId ?? ""));
    requestHeaders.set("x-user-email", String(payload.email ?? ""));

    const response = NextResponse.next({ request: { headers: requestHeaders } });

    const timeUntilExpiry = (decoded.exp as number) - now;
    if (timeUntilExpiry < 86400) {
      const newToken = await refreshUserToken(decoded);
      response.cookies.set("token", newToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 60 * 60 * 24 * 7,
        path: "/",
      });
    }

    return response;
  }

  // ── PHASE 5: PLAN AND UPGRADE ROUTES ─────────────────────────────────────
  // /plan is where users pick and purchase a subscription.
  // /upgrade/* includes the success page (/upgrade/success).
  // Both require the user to be logged in — an anonymous visitor hitting
  // /plan would have no identity to attach a Paddle checkout to.
  if (pathname === "/plan" || pathname.startsWith("/upgrade/")) {
    const userToken = request.cookies.get("token")?.value;

    if (!userToken) {
      // Send them to login with a redirect param so they come back here after
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }

    const decoded = fastDecodeToken(userToken);
    const now = Math.floor(Date.now() / 1000);

    if (!decoded || !decoded.exp || decoded.exp <= now) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      const response = NextResponse.redirect(loginUrl);
      response.cookies.delete("token");
      return response;
    }

    const payload = await verifyToken(userToken, USER_SECRET);
    if (!payload) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      const response = NextResponse.redirect(loginUrl);
      response.cookies.delete("token");
      return response;
    }

    // Valid token — allow through with token refresh if expiring soon
    const response = NextResponse.next();
    const timeUntilExpiry = (decoded.exp as number) - now;
    if (timeUntilExpiry < 86400) {
      const newToken = await refreshUserToken(decoded);
      response.cookies.set("token", newToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 60 * 60 * 24 * 7,
        path: "/",
      });
    }
    return response;
  }

  // ── ALL OTHER ROUTES (unchanged) ─────────────────────────────────────────
  const userToken = request.cookies.get("token")?.value;
  if (!userToken) return NextResponse.next();

  const decoded = fastDecodeToken(userToken);
  if (!decoded || !decoded.exp) return NextResponse.next();

  const now = Math.floor(Date.now() / 1000);
  const timeUntilExpiry = decoded.exp - now;

  if (timeUntilExpiry <= 0) return NextResponse.next();

  if (timeUntilExpiry < 86400) {
    const newToken = await refreshUserToken(decoded);
    const res = NextResponse.next();
    res.cookies.set("token", newToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });
    return res;
  }

  return NextResponse.next();
}

// ── MATCHER ───────────────────────────────────────────────────────────────────
// PHASE 5: Added /plan and /upgrade/:path* to the matcher so the new
// protected route logic above actually runs for those paths.
// /api/webhooks/:path* is intentionally excluded — webhooks bypass all checks.
export const config = {
  matcher: [
    "/",
    "/admin/:path*",
    "/dashboard/:path*",
    "/plan",
    "/upgrade/:path*",
    "/api/:path*",
  ],
};