// app/api/integrations/teams/notify/route.ts
import { NextRequest, NextResponse } from "next/server"
import { dbPromise } from "@/app/api/lib/mongodb"

export type TeamsNotifyPayload = {
  userId: string
  event:
    | 'document_open'
    | 'document_viewed'
    | 'document_downloaded'
    | 'signature_completed'
    | 'file_request_received'
    | 'document_completed'
    | 'document_revisited'
    | 'session_summary'
    // legacy — handled for backwards compat
    | 'portal_enter'
  documentName: string
  documentId: string
  viewerName?: string
  viewerEmail?: string
  viewerLocation?: string
  documentThumbnail?: string
  pageCount?: number
  extraInfo?: string
  totalTimeSeconds?: number
  pagesViewed?: number
  intentLevel?: 'high' | 'medium' | 'low'
  visitCount?: number
  lastVisitAgo?: string
  completionPercent?: number
  spaceName?: string
  spaceId?: string
}

// ── Normalise legacy event names ──────────────────────────────────
function normaliseEvent(event: string): string {
  if (event === 'portal_enter' || event === 'space_open') return 'document_open'
  return event
}

const EVENT_CONFIG: Record<string, {
  title: string
  accentColor: string
  badge: string
  badgeColor: string
}> = {
  document_open: {
    title:       'Document Opened',
    accentColor: '#0078D4',
    badge:       'OPENED',
    badgeColor:  'good',
  },
  document_viewed: {
    title:       'Document Viewed',
    accentColor: '#0078D4',
    badge:       'VIEWED',
    badgeColor:  'good',
  },
  document_downloaded: {
    title:       'Document Downloaded',
    accentColor: '#107C10',
    badge:       'DOWNLOADED',
    badgeColor:  'good',
  },
  signature_completed: {
    title:       'Signature Completed',
    accentColor: '#6366F1',
    badge:       'SIGNED',
    badgeColor:  'accent',
  },
  file_request_received: {
    title:       'File Request Received',
    accentColor: '#FF8C00',
    badge:       'FILE RECEIVED',
    badgeColor:  'warning',
  },
  document_completed: {
    title:       'Document Fully Read',
    accentColor: '#107C10',
    badge:       'COMPLETED',
    badgeColor:  'good',
  },
  document_revisited: {
    title:       'Document Revisited',
    accentColor: '#6366F1',
    badge:       'REVISIT',
    badgeColor:  'accent',
  },
  session_summary: {
    title:       'Session Summary',
    accentColor: '#0078D4',
    badge:       'SUMMARY',
    badgeColor:  'default',
  },
}

function formatTime(seconds: number): string {
  if (seconds < 60)   return `${seconds}s`
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`
  return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`
}

 function intentText(level: 'high' | 'medium' | 'low'): string {
  return level.charAt(0).toUpperCase() + level.slice(1)
}

function buildAdaptiveCard(
  payload: TeamsNotifyPayload,
  config: typeof EVENT_CONFIG[string]
) {
  const appUrl  = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const docUrl  = `${appUrl}/documents/${payload.documentId}`
  const spaceUrl = payload.spaceId ? `${appUrl}/spaces/${payload.spaceId}` : null
  const time    = new Date().toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })

  // Build facts — only include fields that have values
  const facts = [
    payload.viewerEmail    && { title: 'Visitor',     value: payload.viewerEmail },
    payload.viewerName     && payload.viewerName !== payload.viewerEmail
                           && { title: 'Name',        value: payload.viewerName },
    payload.viewerLocation && { title: 'Location',    value: payload.viewerLocation },
    payload.spaceName      && { title: 'Space',       value: payload.spaceName },
    payload.pageCount      && { title: 'Total Pages', value: payload.pageCount.toString() },
    payload.pagesViewed !== undefined
                           && { title: 'Pages Viewed', value: `${payload.pagesViewed} of ${payload.pageCount || '?'}` },
    payload.completionPercent !== undefined
                           && { title: 'Completion',  value: `${payload.completionPercent}%` },
    payload.totalTimeSeconds !== undefined
                           && { title: 'Time Spent',  value: formatTime(payload.totalTimeSeconds) },
    payload.intentLevel    && { title: 'Intent Level', value: intentText(payload.intentLevel) },
    payload.visitCount !== undefined
                           && { title: 'Visit Count', value: `${payload.visitCount} visit${payload.visitCount !== 1 ? 's' : ''}` },
    payload.lastVisitAgo   && { title: 'Last Visit',  value: payload.lastVisitAgo },
    payload.extraInfo      && { title: 'Details',     value: payload.extraInfo },
    { title: 'Time', value: time },
  ].filter(Boolean) as { title: string; value: string }[]

  // Action buttons
  const actions: any[] = [
    {
      type:  'Action.OpenUrl',
      title: 'View Document',
      url:   docUrl,
      style: 'positive',
    },
    {
      type:  'Action.OpenUrl',
      title: 'View Analytics',
      url:   `${docUrl}?tab=analytics`,
    },
  ]

  if (spaceUrl) {
    actions.push({
      type:  'Action.OpenUrl',
      title: 'View Space',
      url:   spaceUrl,
    })
  }

  actions.push({
    type:  'Action.OpenUrl',
    title: 'Dashboard',
    url:   `${appUrl}/dashboard`,
  })

  return {
    type: 'message',
    attachments: [
      {
        contentType: 'application/vnd.microsoft.card.adaptive',
        contentUrl:  null,
        content: {
          $schema: 'http://adaptivecards.io/schemas/adaptive-card.json',
          type:    'AdaptiveCard',
          version: '1.4',
          body: [
            // Header row — title + badge
            {
              type:  'ColumnSet',
              style: 'emphasis',
              bleed: true,
              columns: [
                {
                  type:  'Column',
                  width: 'stretch',
                  items: [
                    {
                      type:   'TextBlock',
                      text:   config.title,
                      weight: 'Bolder',
                      size:   'Medium',
                      color:  'Accent',
                      wrap:   true,
                    },
                  ],
                  verticalContentAlignment: 'Center',
                },
                {
                  type:  'Column',
                  width: 'auto',
                  items: [
                    {
                      type:   'Badge',
                      value:  config.badge,
                      style:  config.badgeColor,
                      shape:  'rounded',
                    },
                  ],
                  verticalContentAlignment: 'Center',
                },
              ],
            },

            { type: 'Separator' },

            // Document info
            {
              type:    'ColumnSet',
              columns: [
                {
                  type:  'Column',
                  width: 'auto',
                  items: [
                    payload.documentThumbnail
                      ? {
                          type:    'Image',
                          url:     payload.documentThumbnail,
                          size:    'Medium',
                          style:   'RoundedCorners',
                          altText: payload.documentName,
                        }
                      : {
                          type: 'TextBlock',
                          text: 'File',
                          size: 'Large',
                        },
                  ],
                },
                {
                  type:  'Column',
                  width: 'stretch',
                  items: [
                    {
                      type:     'TextBlock',
                      text:     payload.documentName,
                      weight:   'Bolder',
                      size:     'Default',
                      wrap:     true,
                      maxLines: 2,
                    },
                    {
                      type:    'TextBlock',
                      text:    `Ref: ${payload.documentId.slice(-8).toUpperCase()}`,
                      size:    'Small',
                      color:   'Light',
                      spacing: 'None',
                    },
                  ],
                },
              ],
            },

            // Facts
            {
              type:    'FactSet',
              facts,
              spacing: 'Medium',
            },
          ],

          actions,
        },
      },
    ],
  }
}

// ── Main sender ───────────────────────────────────────────────────
export async function sendTeamsNotification(
  payload: TeamsNotifyPayload
): Promise<boolean> {
  try {
    const db          = await dbPromise
    const integration = await db.collection('integrations').findOne({
      userId:   payload.userId,
      provider: 'teams',
      isActive: true,
    })

    if (!integration?.teamId || !integration?.channelId) {
      console.log('Teams: no channel selected, skipping')
      return false
    }

    let accessToken = integration.accessToken

    // Refresh token if expired
    if (new Date() >= new Date(integration.expiresAt)) {
      console.log('Teams token refreshing...')
      const refreshRes = await fetch(
        'https://login.microsoftonline.com/common/oauth2/v2.0/token',
        {
          method:  'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            grant_type:    'refresh_token',
            refresh_token: integration.refreshToken,
            client_id:     process.env.OUTLOOK_CLIENT_ID!,
            client_secret: process.env.OUTLOOK_CLIENT_SECRET!,
            redirect_uri:  process.env.TEAMS_REDIRECT_URI!,
          }),
        }
      )
      const refreshData = await refreshRes.json()
      if (!refreshRes.ok) {
        console.error('Teams token refresh failed:', refreshData)
        return false
      }
      accessToken = refreshData.access_token
      const newExpiresAt = new Date(Date.now() + refreshData.expires_in * 1000)
      await db.collection('integrations').updateOne(
        { userId: payload.userId, provider: 'teams' },
        { $set: { accessToken, expiresAt: newExpiresAt, updatedAt: new Date() } }
      )
    }

    // Normalise event before building card
    const normalisedEvent  = normaliseEvent(payload.event)
    const config           = EVENT_CONFIG[normalisedEvent] || EVENT_CONFIG['document_open']
    const normalisedPayload = { ...payload, event: normalisedEvent as any }

    const card = buildAdaptiveCard(normalisedPayload, config)

    const res = await fetch(
      `https://graph.microsoft.com/v1.0/teams/${integration.teamId}/channels/${integration.channelId}/messages`,
      {
        method:  'POST',
        headers: {
          Authorization:  `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(card),
      }
    )

    if (!res.ok) {
      const err = await res.json()
      console.error('Teams notification failed:', JSON.stringify(err, null, 2))
      return false
    }

    console.log(`Teams card sent: ${normalisedEvent} — "${payload.documentName}"`)
    return true

  } catch (error) {
    console.error('Teams notification error:', error)
    return false
  }
}

// ── API route for direct POST calls ──────────────────────────────
export async function POST(request: NextRequest) {
  try {
    const payload: TeamsNotifyPayload = await request.json()
    const success = await sendTeamsNotification(payload)
    return NextResponse.json({ success })
  } catch (error) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}