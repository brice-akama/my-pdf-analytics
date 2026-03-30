// app/api/integrations/slack/connect/route.ts

import { NextRequest, NextResponse } from "next/server";
import { verifyUserFromRequest } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const user = await verifyUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const slackAuthUrl = new URL("https://slack.com/oauth/v2/authorize");
    slackAuthUrl.searchParams.append("client_id", process.env.SLACK_CLIENT_ID!);
    slackAuthUrl.searchParams.append("redirect_uri", process.env.SLACK_REDIRECT_URI!);
    slackAuthUrl.searchParams.append(
      "scope",
      "chat:write,chat:write.public,channels:read,groups:read,users:read"  
    );
    slackAuthUrl.searchParams.append("state", user.id);
    slackAuthUrl.searchParams.append("user_scope", "");

    return NextResponse.redirect(slackAuthUrl.toString());
  } catch (error) {
    console.error("Slack connect error:", error);
    return NextResponse.json({ error: "Failed to connect" }, { status: 500 });
  }
}