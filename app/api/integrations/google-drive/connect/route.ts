import { NextRequest, NextResponse } from "next/server";
import { verifyUserFromRequest } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    // ✅ Verify user
    const user = await verifyUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // ✅ Build Google OAuth URL
    const googleAuthUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
    googleAuthUrl.searchParams.append("client_id", process.env.GOOGLE_CLIENT_ID!);
    googleAuthUrl.searchParams.append("redirect_uri", process.env.GOOGLE_DRIVE_REDIRECT_URI!);
    googleAuthUrl.searchParams.append("response_type", "code");
    googleAuthUrl.searchParams.append("scope", "https://www.googleapis.com/auth/drive.readonly https://www.googleapis.com/auth/userinfo.email");
    googleAuthUrl.searchParams.append("access_type", "offline");
    googleAuthUrl.searchParams.append("prompt", "consent");
    googleAuthUrl.searchParams.append("state", user.email); // ✅ Pass user ID to identify them later

    // ✅ Redirect user to Google
    return NextResponse.redirect(googleAuthUrl.toString());
  } catch (error) {
    console.error("Google Drive connect error:", error);
    return NextResponse.json({ error: "Failed to connect" }, { status: 500 });
  }
}