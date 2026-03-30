// app/api/auth/google/route.ts
//
// FIXES APPLIED:
//  #1 — Removed internal fetch(`/api/auth/signup`) call.
//       Calling your own serverless endpoint from within a serverless function
//       causes the OAuth code to be consumed on a DIFFERENT cold instance,
//       triggering "invalid_grant" on the second attempt and HTML 502 responses.
//       Signup logic is now inlined directly — one DB write, one token, done.
//
//  #2 — All fetch() calls now check res.ok before res.json() to prevent
//       "Unexpected token '<'" JSON parse crashes when Google or internal
//       routes return HTML error pages.
//
//  #3 — State is decoded from the CALLBACK url params, not from the initial
//       request params, so mode/next survive the redirect round-trip correctly.

import { NextRequest, NextResponse } from "next/server";
import { dbPromise } from "../../lib/mongodb";
import { ObjectId } from "mongodb";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { sendWelcomeEmail } from "@/lib/emailService";
import { notifyInviterOfAcceptance } from "@/lib/emails/teamEmails";

const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v3/userinfo";

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID!;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET!;

// ----------------------------
// Base64URL helpers
// ----------------------------
function base64urlEncode(obj: Record<string, unknown>) {
  const b = Buffer.from(JSON.stringify(obj)).toString("base64");
  return b.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64urlDecodeToObj(s: string): Record<string, string> | null {
  if (!s) return null;
  const pad = (4 - (s.length % 4)) % 4;
  const b64 = s.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat(pad);
  try {
    return JSON.parse(Buffer.from(b64, "base64").toString("utf8"));
  } catch (e) {
    console.warn("⚠️ Failed to decode state:", e);
    return null;
  }
}

// ----------------------------
// Inline signup logic (replaces the internal fetch call)
// ----------------------------
async function createGoogleUser(profile: {
  email: string;
  given_name?: string;
  family_name?: string;
  name?: string;
  picture?: string;
}) {
  const db = await dbPromise;
  const users = db.collection("users");
  const profiles = db.collection("profiles");
  const auditLog = db.collection("audit_log");

  // Ensure indexes
  await Promise.all([
    users.createIndex({ email: 1 }, { unique: true }),
    profiles.createIndex({ email: 1 }, { unique: true }),
    profiles.createIndex({ user_id: 1 }, { unique: true }),
  ]);

  const email = profile.email.toLowerCase().trim();
  const firstName = profile.given_name || profile.name?.split(" ")?.[0] || "";
  const lastName =
    profile.family_name || profile.name?.split(" ").slice(1).join(" ") || "";
  const fullName = [firstName, lastName].filter(Boolean).join(" ");
  const avatarUrl = profile.picture || null;
  const now = new Date();

  // Check existing
  const existingUser = await users.findOne({ email });
  if (existingUser) {
    return { userId: existingUser._id.toString(), email, isNew: false };
  }

  // Random password for OAuth users (never used for login)
  const randomPassword = Math.random().toString(36).slice(-16) + Math.random().toString(36).slice(-16);
  const passwordHash = await bcrypt.hash(randomPassword, 10);

  const userDoc = {
    email,
    passwordHash,
    provider: "google",
    profile: {
      firstName,
      lastName: lastName || null,
      fullName,
      companyName: null,
      avatarUrl,
    },
    email_verified: true,
    created_at: now,
    updated_at: now,
  };

  const insertResult = await users.insertOne(userDoc);
  const insertedUserId = insertResult.insertedId.toString();

  // Auto-accept pending organization invitations
  const pendingInvitations = await db
    .collection("organization_members")
    .find({ email, status: "invited" })
    .toArray();

  let organizationId = insertedUserId;
  let userRole = "owner";

  if (pendingInvitations.length > 0) {
    const invite = pendingInvitations[0];
    organizationId = invite.organizationId;
    userRole = invite.role;

    for (const inv of pendingInvitations) {
      await db.collection("organization_members").updateOne(
        { _id: inv._id },
        {
          $set: {
            userId: insertedUserId,
            status: "active",
            joinedAt: now,
            lastActiveAt: now,
          },
        }
      );
    }

    console.log(`✅ Google user ${email} joined org ${organizationId} as ${userRole}`);

    // Fire-and-forget inviter notification
    notifyInviterOfAcceptance({
      invitedByUserId: invite.invitedBy,
      newMemberName: fullName || firstName,
      newMemberEmail: email,
      role: userRole,
      organizationName: invite.organizationName || "your team",
    }).catch((err) => {
      console.error("❌ Failed to notify inviter (non-blocking):", err);
    });
  }

  const profileDoc = {
    _id: new ObjectId(insertedUserId),
    user_id: insertedUserId,
    email,
    full_name: fullName,
    first_name: firstName,
    last_name: lastName || null,
    avatar_url: avatarUrl,
    company_name: null,
    organization_id: organizationId,
    role: userRole,
    created_at: now,
  };

  await profiles.updateOne(
    { user_id: insertedUserId },
    { $set: profileDoc },
    { upsert: true }
  );

  await auditLog.insertOne({
    user_id: insertedUserId,
    action: "signup",
    ip_address: "oauth",
    user_agent: "google-oauth",
    metadata: { email, signup_method: "oauth" },
    created_at: now,
  });

  // Fire-and-forget welcome email
  sendWelcomeEmail({ recipientName: firstName, recipientEmail: email }).catch(
    (err) => console.error("⚠️ Welcome email failed (non-blocking):", err)
  );

  console.log(`✅ Google signup complete for: ${email}`);
  return { userId: insertedUserId, email, isNew: true };
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
    const code = url.searchParams.get("code");
    const providerError = url.searchParams.get("error");
    const rawState = url.searchParams.get("state") || "";

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;
    const redirectUri = `${request.nextUrl.origin}/api/auth/google`;

    // Step 0: Handle provider errors (e.g. user cancelled)
    if (providerError) {
      console.warn("⚠️ Google OAuth provider error:", providerError);
      return NextResponse.redirect(
        `${baseUrl}/login?oauth_error=${encodeURIComponent(providerError)}`
      );
    }

    // Step 1: Start flow — redirect to Google
    if (!code) {
      const incomingMode = url.searchParams.get("mode") || "login";
      const incomingNext =
        url.searchParams.get("next") ||
        (incomingMode === "login" ? "/dashboard" : "/dashboard");
      const incomingCs = url.searchParams.get("state") || "";

      const authUrl = new URL(GOOGLE_AUTH_URL);
      authUrl.searchParams.set("client_id", CLIENT_ID);
      authUrl.searchParams.set("redirect_uri", redirectUri);
      authUrl.searchParams.set("response_type", "code");
      authUrl.searchParams.set("scope", "openid email profile");
      authUrl.searchParams.set(
        "state",
        base64urlEncode({ mode: incomingMode, next: incomingNext, cs: incomingCs })
      );
      authUrl.searchParams.set("prompt", "select_account");
      // ✅ access_type=online avoids refresh_token issues that cause invalid_grant
      authUrl.searchParams.set("access_type", "online");

      console.log("🌍 Redirecting to Google for mode:", incomingMode);
      return NextResponse.redirect(authUrl.toString());
    }

    // Step 2: Callback — exchange code for tokens
    console.log("🔁 OAuth callback received, exchanging code...");

    const tokenBody = new URLSearchParams({
      code,
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    });

    const tokenRes = await fetch(GOOGLE_TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: tokenBody.toString(),
    });

    // ✅ FIX #2: Always read as text first, then parse safely
    const tokenText = await tokenRes.text();
    let tokenJson: Record<string, string> = {};
    try {
      tokenJson = JSON.parse(tokenText);
    } catch {
      console.error("❌ Google token response was not JSON:", tokenText.slice(0, 200));
      return NextResponse.redirect(`${baseUrl}/login?error=oauth_token_parse_failed`);
    }

    if (!tokenRes.ok || !tokenJson.access_token) {
      console.error("❌ Google token exchange failed:", tokenJson);
      return NextResponse.redirect(
        `${baseUrl}/login?error=${encodeURIComponent(tokenJson.error || "token_exchange_failed")}`
      );
    }

    // Step 3: Fetch user info from Google
    const userRes = await fetch(GOOGLE_USERINFO_URL, {
      headers: { Authorization: `Bearer ${tokenJson.access_token}` },
    });

    if (!userRes.ok) {
      const errText = await userRes.text();
      console.error("❌ Failed to fetch Google user info:", errText.slice(0, 200));
      return NextResponse.redirect(`${baseUrl}/login?error=userinfo_failed`);
    }

    const googleProfile = await userRes.json();

    if (!googleProfile.email) {
      console.error("❌ Google profile missing email:", googleProfile);
      return NextResponse.redirect(`${baseUrl}/login?error=no_email`);
    }

    // Step 4: Decode state to get mode/next
    const decodedState = base64urlDecodeToObj(rawState);
    const effectiveMode = decodedState?.mode || "login";
    const effectiveNext = decodedState?.next || "/dashboard";

    console.log(`✅ Google profile received: ${googleProfile.email} (mode: ${effectiveMode})`);

    // Step 5: Find or create user
    const db = await dbPromise;
    const users = db.collection("users");

    const existingUser = await users.findOne({ email: googleProfile.email.toLowerCase() });

    let userId: string;

    if (existingUser) {
      // ✅ User exists — log them in regardless of mode
      userId = existingUser._id.toString();
      console.log(`✅ Existing user login: ${googleProfile.email}`);
    } else if (effectiveMode === "login") {
      // ✅ Login mode but no account found — redirect with friendly error
      console.warn(`⚠️ Login attempt for non-existent account: ${googleProfile.email}`);
      return NextResponse.redirect(`${baseUrl}/login?error=user_not_found`);
    } else {
      // ✅ Signup mode — create account inline (no internal fetch!)
      const result = await createGoogleUser(googleProfile);
      userId = result.userId;
    }

    // Step 6: Sign JWT and redirect
    const token = jwt.sign(
      { userId, email: googleProfile.email.toLowerCase() },
      process.env.JWT_SECRET!,
      { expiresIn: "7d" }
    );

    const redirectTo = effectiveMode === "signup" ? "/dashboard" : `${effectiveNext}`;
    const response = NextResponse.redirect(`${baseUrl}${redirectTo}`);

    response.cookies.set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });

    return response;

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("🔥 GOOGLE AUTH ERROR:", message);
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://www.docmetrics.io";
    return NextResponse.redirect(`${baseUrl}/login?error=internal_error`);
  }
}