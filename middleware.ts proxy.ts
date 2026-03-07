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

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // ========================================
  // 🔐 ADMIN ROUTES
  // ========================================
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

  // ========================================
  // 🔐 USER ROUTES & TOKEN REFRESH
  // ========================================
  const userToken = request.cookies.get("token")?.value;

  // dashboard routes can load without token (frontend will handle redirects)
  if (pathname === "/dashboard" || pathname.startsWith("/dashboard/")) {
    if (!userToken) {
      const referer = request.headers.get("referer");
      const isFromSignupOrLogin =
        referer?.includes("/signup") || referer?.includes("/login");

      if (isFromSignupOrLogin) return NextResponse.next();

      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  if (!userToken) return NextResponse.next();

  // --- Decode without verifying (Edge-safe, does not use crypto)
  const base64Payload = userToken.split(".")[1];
  const decodedPayload = base64Payload
    ? JSON.parse(Buffer.from(base64Payload, "base64").toString())
    : null;

  if (!decodedPayload || !decodedPayload.exp) return NextResponse.next();

  const now = Math.floor(Date.now() / 1000);
  const timeUntilExpiry = decodedPayload.exp - now;

  // Token expired → redirect only dashboard pages
  if (timeUntilExpiry <= 0) {
    if (pathname.startsWith("/dashboard")) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    return NextResponse.next();
  }

  // Token expiring soon → silently refresh it
  if (timeUntilExpiry < 86400) {
    const newToken = await refreshUserToken(decodedPayload);
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

export const config = {
  matcher: ["/admin/:path*", "/dashboard/:path*", "/api/:path*"],
};
