import { NextRequest, NextResponse } from "next/server"
import { verifyUserFromRequest } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    const user = await verifyUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const microsoftAuthUrl = new URL("https://login.microsoftonline.com/common/oauth2/v2.0/authorize")
    microsoftAuthUrl.searchParams.append("client_id", process.env.OUTLOOK_CLIENT_ID!)
    microsoftAuthUrl.searchParams.append("redirect_uri", process.env.OUTLOOK_REDIRECT_URI!)
    microsoftAuthUrl.searchParams.append("response_type", "code")
    microsoftAuthUrl.searchParams.append("scope", "https://graph.microsoft.com/Mail.Send https://graph.microsoft.com/User.Read offline_access")
    microsoftAuthUrl.searchParams.append("response_mode", "query")
    microsoftAuthUrl.searchParams.append("state", user.id)

    return Response.redirect(microsoftAuthUrl.toString(), 307)
  } catch (error) {
    console.error("Outlook connect error:", error)
    return NextResponse.json({ error: "Failed to connect" }, { status: 500 })
  }
}