import { NextRequest, NextResponse } from "next/server";
import { verifyUserFromRequest } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const user = await verifyUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Build Google OAuth URL with Gmail scopes
    const googleAuthUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
    googleAuthUrl.searchParams.append("client_id", process.env.GOOGLE_CLIENT_ID!);
    googleAuthUrl.searchParams.append("redirect_uri", process.env.GMAIL_REDIRECT_URI!);
    googleAuthUrl.searchParams.append("response_type", "code");
    googleAuthUrl.searchParams.append("scope", "https://www.googleapis.com/auth/gmail.send https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/userinfo.email");
    googleAuthUrl.searchParams.append("access_type", "offline");
    googleAuthUrl.searchParams.append("prompt", "consent");
    googleAuthUrl.searchParams.append("state", user.id);

    // ✅ Use Response.redirect() instead of redirect()
    return Response.redirect(googleAuthUrl.toString(), 307);
  } catch (error) {
    console.error("Gmail connect error:", error);
    return NextResponse.json({ error: "Failed to connect" }, { status: 500 });
  }
}