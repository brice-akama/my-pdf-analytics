import { NextRequest, NextResponse } from "next/server"
import { dbPromise } from "@/app/api/lib/mongodb"

export type TeamsNotifyPayload = {
  userId: string
  event: 'document_viewed' | 'document_downloaded' | 'signature_completed' | 'file_request_received'
  documentName: string
  documentId: string
  viewerName?: string
  viewerEmail?: string
  viewerLocation?: string
  documentThumbnail?: string // cloudinary thumbnail URL
  pageCount?: number
  extraInfo?: string
}

const EVENT_CONFIG = {
  document_viewed: {
    emoji: '👁️',
    title: 'Document Viewed',
    color: 'accent',
    accentColor: '#0078D4',
    badge: 'VIEW',
    badgeColor: 'good',
  },
  document_downloaded: {
    emoji: '⬇️',
    title: 'Document Downloaded',
    color: 'accent',
    accentColor: '#107C10',
    badge: 'DOWNLOAD',
    badgeColor: 'good',
  },
  signature_completed: {
    emoji: '✍️',
    title: 'Signature Completed',
    color: 'accent',
    accentColor: '#6366F1',
    badge: 'SIGNED',
    badgeColor: 'accent',
  },
  file_request_received: {
    emoji: '📁',
    title: 'File Request Received',
    color: 'accent',
    accentColor: '#FF8C00',
    badge: 'FILE REQUEST',
    badgeColor: 'warning',
  },
}

function buildAdaptiveCard(payload: TeamsNotifyPayload, config: typeof EVENT_CONFIG[keyof typeof EVENT_CONFIG]) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const docUrl = `${appUrl}/documents/${payload.documentId}`
  const time = new Date().toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  })

  // Facts array — only show fields that exist
  const facts = [
    payload.viewerName && { title: '👤 Viewer', value: payload.viewerName },
    payload.viewerEmail && { title: '📧 Email', value: payload.viewerEmail },
    payload.viewerLocation && { title: '📍 Location', value: payload.viewerLocation },
    payload.pageCount && { title: '📄 Pages', value: payload.pageCount.toString() },
    payload.extraInfo && { title: 'ℹ️ Details', value: payload.extraInfo },
    { title: '🕐 Time', value: time },
  ].filter(Boolean)

  return {
    type: "message",
    attachments: [
      {
        contentType: "application/vnd.microsoft.card.adaptive",
        contentUrl: null,
        content: {
          "$schema": "http://adaptivecards.io/schemas/adaptive-card.json",
          type: "AdaptiveCard",
          version: "1.4",
          body: [
            // Top color bar + event badge
            {
              type: "ColumnSet",
              style: "emphasis",
              bleed: true,
              columns: [
                {
                  type: "Column",
                  width: "stretch",
                  items: [
                    {
                      type: "TextBlock",
                      text: `${config.emoji} ${config.title}`,
                      weight: "Bolder",
                      size: "Medium",
                      color: "Accent",
                      wrap: true,
                    }
                  ],
                  verticalContentAlignment: "Center",
                },
                {
                  type: "Column",
                  width: "auto",
                  items: [
                    {
                      type: "Badge",
                      value: config.badge,
                      style: config.badgeColor,
                      shape: "rounded",
                    }
                  ],
                  verticalContentAlignment: "Center",
                }
              ]
            },

            // Divider
            { type: "Separator" },

            // Document info row
            {
              type: "ColumnSet",
              columns: [
                // Thumbnail if available, else icon
                {
                  type: "Column",
                  width: "auto",
                  items: [
                    payload.documentThumbnail
                      ? {
                          type: "Image",
                          url: payload.documentThumbnail,
                          size: "Medium",
                          style: "RoundedCorners",
                          altText: payload.documentName,
                        }
                      : {
                          type: "TextBlock",
                          text: "📄",
                          size: "ExtraLarge",
                        }
                  ]
                },
                // Document name + metadata
                {
                  type: "Column",
                  width: "stretch",
                  items: [
                    {
                      type: "TextBlock",
                      text: payload.documentName,
                      weight: "Bolder",
                      size: "Default",
                      wrap: true,
                      maxLines: 2,
                    },
                    {
                      type: "TextBlock",
                      text: `Document ID: ${payload.documentId.slice(-8).toUpperCase()}`,
                      size: "Small",
                      color: "Light",
                      spacing: "None",
                    }
                  ]
                }
              ]
            },

            // Facts table
            {
              type: "FactSet",
              facts,
              spacing: "Medium",
            },
          ],

          // Action buttons
          actions: [
            {
              type: "Action.OpenUrl",
              title: "📄 View Document",
              url: docUrl,
              style: "positive",
            },
            {
              type: "Action.OpenUrl",
              title: "📊 View Analytics",
              url: `${docUrl}?tab=analytics`,
            },
            {
              type: "Action.OpenUrl",
              title: "🏠 Dashboard",
              url: `${appUrl}/dashboard`,
            },
          ]
        }
      }
    ]
  }
}

export async function sendTeamsNotification(payload: TeamsNotifyPayload): Promise<boolean> {
  try {
    const db = await dbPromise
    const integration = await db.collection("integrations").findOne({
      userId: payload.userId,
      provider: "teams",
      isActive: true,
    })

    if (!integration?.teamId || !integration?.channelId) {
      console.log("Teams: no channel selected, skipping")
      return false
    }

    let accessToken = integration.accessToken

    // Refresh token if expired
    if (new Date() >= new Date(integration.expiresAt)) {
      console.log("🔄 Teams token refreshing...")
      const refreshRes = await fetch(
        "https://login.microsoftonline.com/common/oauth2/v2.0/token",
        {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            grant_type: "refresh_token",
            refresh_token: integration.refreshToken,
            client_id: process.env.OUTLOOK_CLIENT_ID!,
            client_secret: process.env.OUTLOOK_CLIENT_SECRET!,
            redirect_uri: process.env.TEAMS_REDIRECT_URI!,
          }),
        }
      )
      const refreshData = await refreshRes.json()
      if (!refreshRes.ok) {
        console.error("❌ Teams token refresh failed:", refreshData)
        return false
      }
      accessToken = refreshData.access_token
      const newExpiresAt = new Date(Date.now() + refreshData.expires_in * 1000)
      await db.collection("integrations").updateOne(
        { userId: payload.userId, provider: "teams" },
        { $set: { accessToken, expiresAt: newExpiresAt, updatedAt: new Date() } }
      )
      console.log("✅ Teams token refreshed")
    }

    const config = EVENT_CONFIG[payload.event]
    const card = buildAdaptiveCard(payload, config)

    const res = await fetch(
      `https://graph.microsoft.com/v1.0/teams/${integration.teamId}/channels/${integration.channelId}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(card),
      }
    )

    if (!res.ok) {
      const err = await res.json()
      console.error("❌ Teams notification failed:", JSON.stringify(err, null, 2))
      return false
    }

    console.log(`✅ Teams rich card sent: ${payload.event} for "${payload.documentName}"`)
    return true

  } catch (error) {
    console.error("Teams notification error:", error)
    return false
  }
}

// API route for direct calls
export async function POST(request: NextRequest) {
  try {
    const payload: TeamsNotifyPayload = await request.json()
    const success = await sendTeamsNotification(payload)
    return NextResponse.json({ success })
  } catch (error) {
    return NextResponse.json({ error: "Failed" }, { status: 500 })
  }
}