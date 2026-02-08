// app/api/auth/google/route.ts
import { NextRequest, NextResponse } from "next/server";
import { dbPromise } from '../../lib/mongodb';
import jwt from 'jsonwebtoken';

const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v3/userinfo";

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;

// ----------------------------
// Base64URL helpers
// ----------------------------
function base64urlEncode(obj: any) {
  const b = Buffer.from(JSON.stringify(obj)).toString("base64");
  return b.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64urlDecodeToObj(s: string) {
  if (!s) return null;
  const pad = (4 - (s.length % 4)) % 4;
  const b64 = s.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat(pad);
  try {
    const json = Buffer.from(b64, "base64").toString("utf8");
    return JSON.parse(json);
  } catch (e) {
    console.warn("⚠️ Failed to decode state:", e);
    return null;
  }
}

// ----------------------------
// Main GET handler
// ----------------------------
export async function GET(request: NextRequest) {
  try {
    if (!CLIENT_ID || !CLIENT_SECRET) {
      console.error("❌ Missing Google OAuth env vars");
      return NextResponse.json(
        { error: "Google OAuth not configured" },
        { status: 500 }
      );
    }

    const url = new URL(request.url);
    const incomingState = url.searchParams.get("state") || "";
    const mode = url.searchParams.get("mode") || "login"; // login | signup
    const nextParam =
      url.searchParams.get("next") ||
      (mode === "login" ? "/dashboard" : "/signup?step=2");
    const code = url.searchParams.get("code");
    const providerError = url.searchParams.get("error");

    // Step 0: Handle provider errors
    if (providerError) {
      console.warn("⚠️ Google OAuth provider error:", providerError);
      return NextResponse.redirect(
        `${url.origin}${nextParam}?oauth_error=${encodeURIComponent(providerError)}`
      );
    }

    // Step 1: Start flow (no "code" yet)
    if (!code) {
      const redirectUri = `${request.nextUrl.origin}/api/auth/google`;
      const authUrl = new URL(GOOGLE_AUTH_URL);
      authUrl.searchParams.set("client_id", CLIENT_ID);
      authUrl.searchParams.set("redirect_uri", redirectUri);
      authUrl.searchParams.set("response_type", "code");
      authUrl.searchParams.set("scope", "openid email profile");
      const statePayload = { mode, next: nextParam, cs: incomingState };
      authUrl.searchParams.set("state", base64urlEncode(statePayload));
      authUrl.searchParams.set("prompt", "select_account");

      console.log("🌍 Redirecting to Google for", mode);
      return NextResponse.redirect(authUrl.toString());
    }

    // Step 2: Callback (has "code")
    const redirectUri = `${request.nextUrl.origin}/api/auth/google`;
    console.log("🔁 Callback received with code:", code.slice(0, 8) + "...");

    const tokenBody = new URLSearchParams();
    tokenBody.set("code", code);
    tokenBody.set("client_id", CLIENT_ID);
    tokenBody.set("client_secret", CLIENT_SECRET);
    tokenBody.set("redirect_uri", redirectUri);
    tokenBody.set("grant_type", "authorization_code");

    const tokenRes = await fetch(GOOGLE_TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: tokenBody.toString(),
    });

    const tokenText = await tokenRes.text();
    let tokenJson: any = {};
    try {
      tokenJson = JSON.parse(tokenText);
    } catch {
      tokenJson = { raw: tokenText };
    }

    // ✅ Better error message
    if (!tokenRes.ok || !tokenJson.access_token) {
      console.error("❌ Google token exchange failed:", tokenJson);
      return NextResponse.json(
        {
          error: "Failed to exchange code",
          googleError: tokenJson.error,
          googleDescription: tokenJson.error_description,
        },
        { status: 502 }
      );
    }

    // Step 3: Fetch user info
    const userRes = await fetch(GOOGLE_USERINFO_URL, {
      headers: { Authorization: `Bearer ${tokenJson.access_token}` },
    });

    const profile = await userRes.json();
    if (!userRes.ok) {
      console.error("❌ Failed to fetch user info:", profile);
      return NextResponse.json(
        { error: "Failed to fetch userinfo", detail: profile },
        { status: 502 }
      );
    }

    // Step 4: Decode state
    const decodedState = base64urlDecodeToObj(incomingState);
    const clientState = decodedState?.cs || "";
    const effectiveMode = decodedState?.mode || mode;
    const effectiveNext = decodedState?.next || nextParam;

    // Step 5: Handle login / signup
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;

    if (effectiveMode === "login") {
      console.log("✅ Google login successful for:", profile.email);
      
      // ✅ ONLY FOR LOGIN: Check if user exists and set cookie
      const db = await dbPromise;
      const users = db.collection('users');
      const user = await users.findOne({ email: profile.email });
      
      if (!user) {
        return NextResponse.redirect(`${baseUrl}/login?error=user_not_found`);
      }
      
      // ✅ Generate JWT token for existing user
      const token = jwt.sign(
        { userId: user._id.toString(), email: user.email },
        process.env.JWT_SECRET!,
        { expiresIn: '7d' }
      );
      
      const response = NextResponse.redirect(`${baseUrl}${effectiveNext}`);
      
      // ✅ Set HTTP-only cookie
      response.cookies.set('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7,
        path: '/'
      });
      
      return response;
    }

    // Step 6: Build profile and redirect for signup
    // ✅ NO cookie logic here - /api/auth/signup will handle it after they complete the form
    const smallProfile = {
      firstName: profile.given_name || profile.name?.split(" ")?.[0] || "",
      lastName: profile.family_name || "",
      full_name: profile.name || "",
      email: profile.email || "",
      companyName: "",
      avatar: profile.picture || "",
      providerId: profile.sub || "",
    };

    const profileB64 = base64urlEncode(smallProfile);
    const redirectUrl = new URL(effectiveNext, baseUrl);
    if (clientState) redirectUrl.searchParams.set("state", clientState);
    redirectUrl.searchParams.set("profile", profileB64);

    console.log("✅ Google signup successful for:", profile.email);
    return NextResponse.redirect(redirectUrl.toString());
  } catch (err: any) {
    console.error("🔥 GOOGLE AUTH ERROR:", err?.message || err, err?.stack);
    return NextResponse.json(
      { error: err?.message || "Internal server error" },
      { status: 500 }
    );
  }
}