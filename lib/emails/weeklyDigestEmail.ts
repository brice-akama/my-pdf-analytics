// lib/emails/weeklyDigestEmail.ts

export type DigestInvestor = {
  email:         string
  formattedTime: string
  docsViewed:    number
  totalDocs:     number
  downloads:     number
  lastSeen:      string
  isNew:         boolean
  linkLabel:     string | null
  engagementScore: number
}

export type DigestDocument = {
  name:      string
  views:     number
  totalTime: string
  skippedBy: number
}

export type DigestQuestion = {
  email:    string
  question: string
  document: string
  askedAt:  string
}

export type DigestSpace = {
  spaceId:       string
  spaceName:     string
  spaceUrl:      string
  newVisitors:   number
  totalViews:    number
  totalDownloads: number
  totalQuestions: number
  topInvestors:  DigestInvestor[]
  documentStats: DigestDocument[]
  newQuestions:  DigestQuestion[]
  dealHeatScore: number
  heatLabel:     string
}

// ─── helpers ──────────────────────────────────────────────────────────────────

function heatColor(score: number): string {
  if (score >= 70) return '#ef4444'
  if (score >= 40) return '#f97316'
  if (score >= 15) return '#3b82f6'
  return '#94a3b8'
}

function heatEmoji(score: number): string {
  if (score >= 70) return '🔥 Very active'
  if (score >= 40) return '⚡ Active'
  if (score >= 15) return '🌤️ Some activity'
  return '💤 Quiet week'
}

// ─── main builder ─────────────────────────────────────────────────────────────

export function buildWeeklyDigestHtml({
  ownerName,
  weekStart,
  weekEnd,
  spaces,
  appUrl,
}: {
  ownerName: string
  weekStart: string
  weekEnd:   string
  spaces:    DigestSpace[]
  appUrl:    string
}): string {

  const totalVisitors  = spaces.reduce((s, sp) => s + sp.newVisitors,    0)
  const totalViews     = spaces.reduce((s, sp) => s + sp.totalViews,     0)
  const totalDownloads = spaces.reduce((s, sp) => s + sp.totalDownloads, 0)
  const totalQuestions = spaces.reduce((s, sp) => s + sp.totalQuestions, 0)
  const hasActivity    = totalViews > 0 || totalVisitors > 0

  // ── per-space blocks ──────────────────────────────────────────────────────
  const spaceBlocks = spaces.map(space => {

    // investor rows
    const investorRows = space.topInvestors.slice(0, 6).map(inv => {
      const initial = inv.email.charAt(0).toUpperCase()
      const score   = inv.engagementScore
      const scoreColor = score >= 70 ? '#ef4444' : score >= 40 ? '#f97316' : score >= 15 ? '#3b82f6' : '#94a3b8'
      return `
        <tr>
          <td style="padding:10px 0;border-bottom:1px solid #f1f5f9;">
            <table width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
              <td width="38" valign="middle">
                <div style="width:34px;height:34px;border-radius:50%;background:linear-gradient(135deg,#1e293b 0%,#475569 100%);color:white;font-weight:800;font-size:14px;text-align:center;line-height:34px;">
                  ${initial}
                </div>
              </td>
              <td valign="middle" style="padding-left:10px;">
                <div style="font-size:13px;font-weight:600;color:#0f172a;line-height:1.3;">${inv.email}</div>
                <div style="font-size:11px;color:#94a3b8;margin-top:2px;line-height:1.3;">
                  ${inv.docsViewed}/${inv.totalDocs} docs
                  ${inv.linkLabel ? `&nbsp;·&nbsp;<span style="color:#6366f1;">${inv.linkLabel}</span>` : ''}
                  &nbsp;·&nbsp;${inv.lastSeen}
                  ${inv.isNew ? `&nbsp;·&nbsp;<span style="color:#10b981;font-weight:700;">NEW</span>` : ''}
                </div>
              </td>
              <td align="right" valign="middle" style="white-space:nowrap;">
                <div style="font-size:15px;font-weight:800;color:#0f172a;">${inv.formattedTime}</div>
                ${inv.downloads > 0
                  ? `<div style="font-size:11px;color:#10b981;margin-top:2px;">⬇&nbsp;${inv.downloads} download${inv.downloads > 1 ? 's' : ''}</div>`
                  : ''
                }
              </td>
              <td width="46" align="right" valign="middle" style="padding-left:12px;">
                <div style="display:inline-block;background:${scoreColor}1a;color:${scoreColor};border:1px solid ${scoreColor}40;border-radius:8px;padding:3px 8px;font-size:12px;font-weight:700;white-space:nowrap;">
                  ${score}
                </div>
              </td>
            </tr></table>
          </td>
        </tr>`
    }).join('')

    // document rows
    const docRows = space.documentStats.slice(0, 6).map(doc => {
      const hasViews = doc.views > 0
      return `
        <tr>
          <td style="padding:8px 0;border-bottom:1px solid #f8fafc;">
            <table width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
              <td valign="middle">
                <div style="font-size:13px;font-weight:${hasViews ? '500' : '400'};color:${hasViews ? '#0f172a' : '#cbd5e1'};">
                  ${hasViews ? '📄' : '⬜'}&nbsp;${doc.name}
                </div>
                ${doc.skippedBy > 0
                  ? `<div style="font-size:11px;color:#f59e0b;margin-top:2px;">⚠&nbsp;${doc.skippedBy} investor${doc.skippedBy > 1 ? 's' : ''} never opened this</div>`
                  : ''
                }
              </td>
              <td align="right" valign="middle" style="white-space:nowrap;padding-left:12px;">
                ${hasViews
                  ? `<span style="font-size:13px;font-weight:700;color:#0f172a;">${doc.totalTime}</span>
                     <span style="font-size:11px;color:#94a3b8;margin-left:6px;">${doc.views} view${doc.views > 1 ? 's' : ''}</span>`
                  : `<span style="font-size:11px;color:#e2e8f0;font-style:italic;">Not opened</span>`
                }
              </td>
            </tr></table>
          </td>
        </tr>`
    }).join('')

    // question blocks
    const questionBlocks = space.newQuestions.slice(0, 3).map(q => `
      <div style="background:#fffbeb;border-left:3px solid #f59e0b;padding:10px 14px;border-radius:0 8px 8px 0;margin-bottom:8px;">
        <div style="font-size:12px;font-weight:700;color:#92400e;margin-bottom:4px;">${q.email}</div>
        <div style="font-size:13px;color:#1c1917;line-height:1.4;">"${q.question}"</div>
        <div style="font-size:11px;color:#a16207;margin-top:4px;">
          ${q.document !== 'general' ? `re: ${q.document}&nbsp;·&nbsp;` : ''}${q.askedAt}
        </div>
      </div>`
    ).join('')

    const heat = heatColor(space.dealHeatScore)
    const barW = Math.min(100, space.dealHeatScore)

    return `
      <!--[if mso]><table width="100%"><tr><td><![endif]-->
      <div style="margin-bottom:28px;border:1px solid #e2e8f0;border-radius:14px;overflow:hidden;background:white;">

        <!-- Space header bar -->
        <div style="background:#0f172a;padding:20px 24px 16px;">
          <table width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
            <td valign="top">
              <div style="font-size:17px;font-weight:800;color:white;letter-spacing:-0.01em;">${space.spaceName}</div>
              <div style="font-size:12px;color:#64748b;margin-top:3px;">
                ${space.newVisitors} visitor${space.newVisitors !== 1 ? 's' : ''}
                &nbsp;·&nbsp;${space.totalViews} view${space.totalViews !== 1 ? 's' : ''}
                &nbsp;·&nbsp;${space.totalDownloads} download${space.totalDownloads !== 1 ? 's' : ''}
                ${space.totalQuestions > 0 ? `&nbsp;·&nbsp;${space.totalQuestions} question${space.totalQuestions > 1 ? 's' : ''}` : ''}
              </div>
            </td>
            <td align="right" valign="top" style="white-space:nowrap;padding-left:16px;">
              <div style="font-size:26px;font-weight:900;color:${heat};line-height:1;">${space.dealHeatScore}</div>
              <div style="font-size:10px;color:#475569;text-transform:uppercase;letter-spacing:0.06em;margin-top:2px;">heat score</div>
            </td>
          </tr></table>
          <!-- Heat bar -->
          <div style="margin-top:12px;height:3px;background:#1e293b;border-radius:3px;">
            <div style="height:3px;width:${barW}%;background:${heat};border-radius:3px;"></div>
          </div>
          <div style="font-size:11px;color:#64748b;margin-top:6px;">${heatEmoji(space.dealHeatScore)}</div>
        </div>

        <!-- Body -->
        <div style="padding:20px 24px;">

          ${space.topInvestors.length > 0 ? `
          <!-- Investor activity -->
          <div style="margin-bottom:20px;">
            <div style="font-size:10px;font-weight:800;color:#94a3b8;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:10px;">INVESTOR ACTIVITY</div>
            <table width="100%" cellpadding="0" cellspacing="0" border="0">${investorRows}</table>
          </div>` : ''}

          ${space.documentStats.length > 0 ? `
          <!-- Document engagement -->
          <div style="margin-bottom:20px;">
            <div style="font-size:10px;font-weight:800;color:#94a3b8;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:10px;">DOCUMENT ENGAGEMENT</div>
            <table width="100%" cellpadding="0" cellspacing="0" border="0">${docRows}</table>
          </div>` : ''}

          ${space.newQuestions.length > 0 ? `
          <!-- Questions -->
          <div style="margin-bottom:20px;">
            <div style="font-size:10px;font-weight:800;color:#94a3b8;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:10px;">NEW QUESTIONS (${space.newQuestions.length})</div>
            ${questionBlocks}
          </div>` : ''}

          <a href="${space.spaceUrl}" style="display:inline-block;background:#0f172a;color:white;text-decoration:none;padding:10px 20px;border-radius:8px;font-size:13px;font-weight:600;letter-spacing:0.01em;">
            View Full Analytics →
          </a>
        </div>
      </div>
      <!--[if mso]></td></tr></table><![endif]-->`
  }).join('')

  // ── full email ─────────────────────────────────────────────────────────────
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>Weekly Activity Digest</title>
</head>
<body style="margin:0;padding:0;background-color:#f1f5f9;-webkit-font-smoothing:antialiased;">
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f1f5f9;">
<tr><td align="center" style="padding:32px 16px;">
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;">

  <!-- Logo / brand pill -->
  <tr><td align="center" style="padding-bottom:20px;">
    <div style="display:inline-block;background:#0f172a;color:white;font-size:12px;font-weight:800;letter-spacing:0.12em;text-transform:uppercase;padding:5px 14px;border-radius:100px;">
      DocMetrics
    </div>
  </td></tr>

  <!-- Hero headline -->
  <tr><td align="center" style="padding-bottom:24px;">
    <h1 style="margin:0 0 6px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;font-size:26px;font-weight:800;color:#0f172a;letter-spacing:-0.02em;line-height:1.2;">
      Your Weekly Activity Summary
    </h1>
    <p style="margin:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;font-size:14px;color:#64748b;">
      ${weekStart} – ${weekEnd}&nbsp;&nbsp;·&nbsp;&nbsp;Hi ${ownerName} 👋
    </p>
  </td></tr>

  ${hasActivity ? `
  <!-- Summary strip -->
  <tr><td style="padding-bottom:24px;">
    <div style="background:white;border:1px solid #e2e8f0;border-radius:14px;padding:20px 24px;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
        <td align="center" style="border-right:1px solid #f1f5f9;padding:0 8px;">
          <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;font-size:30px;font-weight:900;color:#0f172a;line-height:1;">${totalVisitors}</div>
          <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;font-size:10px;color:#94a3b8;text-transform:uppercase;letter-spacing:0.08em;margin-top:4px;">Visitors</div>
        </td>
        <td align="center" style="border-right:1px solid #f1f5f9;padding:0 8px;">
          <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;font-size:30px;font-weight:900;color:#0f172a;line-height:1;">${totalViews}</div>
          <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;font-size:10px;color:#94a3b8;text-transform:uppercase;letter-spacing:0.08em;margin-top:4px;">Doc Views</div>
        </td>
        <td align="center" style="border-right:1px solid #f1f5f9;padding:0 8px;">
          <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;font-size:30px;font-weight:900;color:#0f172a;line-height:1;">${totalDownloads}</div>
          <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;font-size:10px;color:#94a3b8;text-transform:uppercase;letter-spacing:0.08em;margin-top:4px;">Downloads</div>
        </td>
        <td align="center" style="padding:0 8px;">
          <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;font-size:30px;font-weight:900;color:#0f172a;line-height:1;">${totalQuestions}</div>
          <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;font-size:10px;color:#94a3b8;text-transform:uppercase;letter-spacing:0.08em;margin-top:4px;">Questions</div>
        </td>
      </tr></table>
    </div>
  </td></tr>
  ` : `
  <!-- No activity -->
  <tr><td style="padding-bottom:24px;">
    <div style="background:white;border:1px solid #e2e8f0;border-radius:14px;padding:48px 24px;text-align:center;">
      <div style="font-size:40px;margin-bottom:12px;">💤</div>
      <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;font-size:16px;font-weight:700;color:#0f172a;margin-bottom:6px;">Quiet week</div>
      <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;font-size:14px;color:#64748b;">No investor activity this week.</div>
    </div>
  </td></tr>
  `}

  <!-- Space blocks -->
  <tr><td style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
    ${spaceBlocks}
  </td></tr>

  <!-- CTA -->
  <tr><td align="center" style="padding:8px 0 24px;">
    <a href="${appUrl}/spaces" style="display:inline-block;background:white;border:1px solid #e2e8f0;color:#0f172a;text-decoration:none;padding:13px 28px;border-radius:10px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;font-size:13px;font-weight:700;letter-spacing:0.01em;">
      Open DocMetrics Dashboard →
    </a>
  </td></tr>

  <!-- Footer -->
  <tr><td align="center" style="padding-bottom:32px;">
    <p style="margin:0 0 6px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;font-size:12px;color:#cbd5e1;">
      You're receiving this because you have active spaces on DocMetrics.
    </p>
    <p style="margin:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;font-size:12px;">
      <a href="${appUrl}/settings/notifications" style="color:#94a3b8;text-decoration:none;">Manage email preferences</a>
      &nbsp;·&nbsp;
      <a href="${appUrl}/unsubscribe" style="color:#94a3b8;text-decoration:none;">Unsubscribe</a>
    </p>
    <p style="margin:8px 0 0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;font-size:11px;color:#e2e8f0;">
      © ${new Date().getFullYear()} DocMetrics · Sent every Monday at 8am
    </p>
  </td></tr>

</table>
</td></tr>
</table>
</body>
</html>`
}