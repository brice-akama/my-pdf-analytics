import { NextRequest, NextResponse } from "next/server";

const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v3/userinfo";

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;

// safe base64url helpers (works across Node versions)
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
    return null;
  }
}

export async function GET(request: NextRequest) {
  try {
    if (!CLIENT_ID || !CLIENT_SECRET) {
      console.error("Google OAuth env vars missing");
      return NextResponse.json({ error: "OAuth not configured on server" }, { status: 500 });
    }

    const url = new URL(request.url);
    // incoming state is either the client cs token (when initiating) or the payload we encoded (callback)
    const incomingState = url.searchParams.get("state") || "";
    const mode = url.searchParams.get("mode") || "login"; // login | signup
    const nextParam = url.searchParams.get("next") || (mode === "login" ? "/dashboard" : "/signup?step=4");
    const code = url.searchParams.get("code");
    const providerError = url.searchParams.get("error");

    if (providerError) {
      console.warn("OAuth provider returned error:", providerError);
      return NextResponse.redirect(`${nextParam}?oauth_error=${encodeURIComponent(providerError)}`);
    }

    // START FLOW: no code => redirect to Google auth
    if (!code) {
      const redirectUri = `${request.nextUrl.origin}/api/auth/google`;
      const authUrl = new URL(GOOGLE_AUTH_URL);
      authUrl.searchParams.set("client_id", CLIENT_ID);
      authUrl.searchParams.set("redirect_uri", redirectUri);
      authUrl.searchParams.set("response_type", "code");
      authUrl.searchParams.set("scope", "openid email profile");
      // encode a small payload into state so we can carry mode/next and echo client's cs token
      const statePayload = { mode, next: nextParam, cs: incomingState };
      authUrl.searchParams.set("state", base64urlEncode(statePayload));
      authUrl.searchParams.set("prompt", "select_account");
      return NextResponse.redirect(authUrl.toString());
    }

    // CALLBACK: code exists -> exchange for token
    const redirectUri = `${request.nextUrl.origin}/api/auth/google`;
    const tokenBody = new URLSearchParams();
    tokenBody.set("code", code);
    tokenBody.set("client_id", CLIENT_ID);
    tokenBody.set("client_secret", CLIENT_SECRET);
    tokenBody.set("redirect_uri", redirectUri);
    tokenBody.set("grant_type", "authorization_code");

    const tokenRes = await fetch(GOOGLE_TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: tokenBody.toString()
    });

    const tokenText = await tokenRes.text().catch(() => "");
    let tokenJson: any;
    try {
      tokenJson = tokenText ? JSON.parse(tokenText) : null;
    } catch (e) {
      console.error("Failed to parse token response:", tokenText);
      return NextResponse.json({ error: "Failed to exchange code (invalid token response)" }, { status: 502 });
    }

    if (!tokenRes.ok) {
      console.error("Token endpoint error:", tokenJson || tokenText);
      return NextResponse.json({ error: "Failed to exchange code", detail: tokenJson || tokenText }, { status: 502 });
    }

    const accessToken = tokenJson.access_token;
    if (!accessToken) {
      console.error("No access token in token response:", tokenJson);
      return NextResponse.json({ error: "No access token returned" }, { status: 502 });
    }

    // Get user info
    const userRes = await fetch(GOOGLE_USERINFO_URL, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    const userText = await userRes.text().catch(() => "");
    let profile: any;
    try {
      profile = userText ? JSON.parse(userText) : null;
    } catch (e) {
      console.error("Failed to parse userinfo:", userText);
      return NextResponse.json({ error: "Failed to fetch userinfo (invalid response)" }, { status: 502 });
    }
    if (!userRes.ok) {
      console.error("Userinfo endpoint error:", profile || userText);
      return NextResponse.json({ error: "Failed to fetch userinfo", detail: profile || userText }, { status: 502 });
    }

    // decode the state payload we originally encoded to get the client's cs token
    const decodedState = base64urlDecodeToObj(incomingState);
    const clientState = decodedState?.cs || ""; // this is what frontend stored in sessionStorage

    // Decide redirect based on mode (from decoded state)
    const effectiveMode = decodedState?.mode || mode;
    const effectiveNext = decodedState?.next || nextParam;

    if (effectiveMode === "login") {
      // For login, redirect to next (typically /dashboard).
      // Optionally: set cookie/session here or create/link user in DB.
      return NextResponse.redirect(effectiveNext);
    }

    // For signup: prepare a small profile payload to help frontend auto-fill and optionally auto-submit
    const smallProfile = {
      firstName: profile.given_name || profile.name?.split(" ")?.[0] || "",
      lastName: profile.family_name || "",
      email: profile.email || "",
      companyName: "",
      picture: profile.picture || "",
      providerId: profile.sub || ""
    };

    const profileB64 = base64urlEncode(smallProfile);
    const redirectUrl = new URL(effectiveNext, request.nextUrl.origin);
    // Echo back the client's original short state token (cs) so frontend can verify against sessionStorage
    if (clientState) redirectUrl.searchParams.set("state", clientState);
    redirectUrl.searchParams.set("profile", profileB64);

    return NextResponse.redirect(redirectUrl.toString());
  } catch (err) {
    console.error("Google OAuth route error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}