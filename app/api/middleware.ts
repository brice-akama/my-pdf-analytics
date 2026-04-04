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

// ── Fast token decode (no crypto, just reads the payload) ─────
// This lets us check expiry without a full jwtVerify round-trip.
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

  // ── ADMIN ROUTES ─────────────────────────────────────────
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

  // ── ROOT REDIRECT ─────────────────────────────────────────
  // If logged-in user hits homepage → send to dashboard
  if (pathname === "/") {
    const userToken = request.cookies.get("token")?.value;
    if (userToken) {
      const payload = await verifyToken(userToken, USER_SECRET);
      if (payload) {
        return NextResponse.redirect(new URL("/dashboard", request.url));
      }
    }
    return NextResponse.next(); // not logged in → show homepage normally
  }

  // ── DASHBOARD ROUTES ──────────────────────────────────────
  // Full cryptographic verify at the edge so the client never
  // needs to make a separate /api/auth/verify round-trip.
  if (pathname === "/dashboard" || pathname.startsWith("/dashboard/")) {
    const userToken = request.cookies.get("token")?.value;

    // No token at all → kick to login immediately
    if (!userToken) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    // Fast-path expiry check (no crypto) first to avoid unnecessary
    // jwtVerify calls on clearly-expired tokens
    const decoded = fastDecodeToken(userToken);
    const now = Math.floor(Date.now() / 1000);

    if (!decoded || !decoded.exp || decoded.exp <= now) {
      const response = NextResponse.redirect(new URL("/login", request.url));
      // Clear the stale cookie so the login page starts clean
      response.cookies.delete("token");
      return response;
    }

    // Full cryptographic verify — runs at the edge, zero client RTT
    const payload = await verifyToken(userToken, USER_SECRET);
    if (!payload) {
      const response = NextResponse.redirect(new URL("/login", request.url));
      response.cookies.delete("token");
      return response;
    }

    // Token is valid — inject user info as a request header so the
    // dashboard page can read it server-side without another DB call.
    // (Optional: useful if you later move to server components)
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("x-user-id", String(payload.userId ?? ""));
    requestHeaders.set("x-user-email", String(payload.email ?? ""));

    const response = NextResponse.next({ request: { headers: requestHeaders } });

    // ── TOKEN REFRESH ──────────────────────────────────────
    // If the token expires within 24 hours, silently issue a fresh one.
    // This keeps the user logged in without any client-side work.
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

  // ── ALL OTHER ROUTES (including /api) ─────────────────────
  const userToken = request.cookies.get("token")?.value;
  if (!userToken) return NextResponse.next();

  const decoded = fastDecodeToken(userToken);
  if (!decoded || !decoded.exp) return NextResponse.next();

  const now = Math.floor(Date.now() / 1000);
  const timeUntilExpiry = decoded.exp - now;

  // Expired on a non-dashboard route — just continue, let the API
  // return 401 naturally; don't hard-redirect non-dashboard pages.
  if (timeUntilExpiry <= 0) return NextResponse.next();

  // Refresh if expiring soon
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

// ── MATCHER ───────────────────────────────────────────────────
export const config = {
  matcher: ["/", "/admin/:path*", "/dashboard/:path*", "/api/:path*"],
};