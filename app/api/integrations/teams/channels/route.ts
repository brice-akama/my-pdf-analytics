import { NextRequest, NextResponse } from "next/server"
import { verifyUserFromRequest } from "@/lib/auth"
import { dbPromise } from "@/app/api/lib/mongodb"
 

async function refreshTeamsToken(userId: string, refreshToken: string, db: any) {
  const refreshRes = await fetch(
    "https://login.microsoftonline.com/common/oauth2/v2.0/token",
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: refreshToken,
        client_id: process.env.OUTLOOK_CLIENT_ID!,
        client_secret: process.env.OUTLOOK_CLIENT_SECRET!,
        redirect_uri: process.env.TEAMS_REDIRECT_URI!,
      }),
    }
  )
  const data = await refreshRes.json()
  if (!refreshRes.ok) return null

  const newExpiresAt = new Date(Date.now() + data.expires_in * 1000)
  await db.collection("integrations").updateOne(
    { userId, provider: "teams" },
    { $set: { accessToken: data.access_token, expiresAt: newExpiresAt, updatedAt: new Date() } }
  )
  return data.access_token
}

export async function GET(request: NextRequest) {
  try {
    const user = await verifyUserFromRequest(request)
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const db = await dbPromise
    const integration = await db.collection("integrations").findOne({
      userId: user.id,
      provider: "teams",
      isActive: true,
    })

    if (!integration) {
      return NextResponse.json({ teams: [], reason: "not_connected" })
    }

    let accessToken = integration.accessToken

    if (new Date() >= new Date(integration.expiresAt)) {
      accessToken = await refreshTeamsToken(user.id, integration.refreshToken, db)
      if (!accessToken) {
        return NextResponse.json({ teams: [], reason: "token_expired" })
      }
    }

    const teamsRes = await fetch(
      "https://graph.microsoft.com/v1.0/me/joinedTeams?$select=id,displayName",
      { headers: { Authorization: `Bearer ${accessToken}` } }
    )

    if (!teamsRes.ok) {
      const err = await teamsRes.json()
      console.error("Teams fetch error:", err)
      // Return empty gracefully — never 500
      return NextResponse.json({
        teams: [],
        reason: "no_teams_access",
        hint: "Personal Microsoft accounts do not support Teams channels. A work or school account is required."
      })
    }

    const teamsData = await teamsRes.json()
    const teams = teamsData.value || []

    if (teams.length === 0) {
      return NextResponse.json({ teams: [], reason: "no_teams_found" })
    }

    const teamsWithChannels = await Promise.all(
      teams.map(async (team: any) => {
        try {
          const channelsRes = await fetch(
            `https://graph.microsoft.com/v1.0/teams/${team.id}/channels?$select=id,displayName`,
            { headers: { Authorization: `Bearer ${accessToken}` } }
          )
          const channelsData = await channelsRes.json()
          return {
            teamId: team.id,
            teamName: team.displayName,
            channels: (channelsData.value || []).map((ch: any) => ({
              channelId: ch.id,
              channelName: ch.displayName,
            })),
          }
        } catch {
          return { teamId: team.id, teamName: team.displayName, channels: [] }
        }
      })
    )

    return NextResponse.json({ success: true, teams: teamsWithChannels })

  } catch (error) {
    console.error("Teams channels error:", error)
    // Never crash — always return something usable
    return NextResponse.json({ teams: [], reason: "unknown_error" })
  }
}