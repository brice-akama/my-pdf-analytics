// app/api/spaces/[id]/compliance-report/route.ts
//
// WHAT THIS DOES:
//   Generates a professional compliance/executive summary PDF report.
//   Unlike the audit log (which shows every single event), this is a
//   HIGH-LEVEL SUMMARY that a CEO, lawyer, or board member can read in 2 minutes.
//
//   Includes:
//   - Space overview and key metrics
//   - Who accessed what documents and when
//   - NDA signature records
//   - Share link summary
//   - Q&A activity summary
//   - Timeline of key events
//
// USE CASE:
//   After a fundraising round closes, the founder generates this report
//   and sends it to their lawyer as evidence of investor due diligence activity.
//   Or a sales manager uses it to show their VP which prospects engaged most.

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { dbPromise } from '@/app/api/lib/mongodb'
import { ObjectId } from 'mongodb'
import { checkAccess } from '@/lib/checkAccess'
import { hasFeature } from '@/lib/planLimits'

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: spaceId } = await context.params

    const access = await checkAccess(request)
    if (!access.ok) return access.response
    const { user, plan } = access

    if (!hasFeature(plan, 'fullAuditLogs')) {
      return new NextResponse('Compliance reports require Pro or Business plan.', { status: 403 })
    }

    const db = await dbPromise
    const space = await db.collection('spaces').findOne({ _id: new ObjectId(spaceId) })
    if (!space) return new NextResponse('Space not found', { status: 404 })

    const isOwner = space.userId === user._id.toString()
    const isMember = space.members?.some(
      (m: any) => m.email === user.email || m.userId === user._id.toString()
    )
    if (!isOwner && !isMember) return new NextResponse('Access denied', { status: 403 })

    // ── Fetch all data in parallel ────────────────────────────────────────────
    const [logs, documents, comments] = await Promise.all([
      db.collection('activityLogs')
        .find({ spaceId: new ObjectId(spaceId) })
        .sort({ timestamp: -1 })
        .limit(1000)
        .toArray(),
      db.collection('documents')
        .find({ spaceId: spaceId, archived: { $ne: true } })
        .toArray(),
      db.collection('documents')
        .find({ spaceId: spaceId })
        .toArray(),
       db.collection('portal_comments')
        .find({ spaceId: spaceId })
        .toArray(),
    ])

    const generatedAt = new Date().toLocaleString('en-US', {
      month: 'long', day: 'numeric', year: 'numeric',
      hour: '2-digit', minute: '2-digit', timeZoneName: 'short'
    })

    const fmt = (d: any) => {
      if (!d) return '—'
      return new Date(d).toLocaleDateString('en-US', {
        month: 'short', day: 'numeric', year: 'numeric'
      })
    }

    const fmtFull = (d: any) => {
      if (!d) return '—'
      return new Date(d).toLocaleString('en-US', {
        month: 'short', day: 'numeric', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
      })
    }

    // ── Key metrics ───────────────────────────────────────────────────────────
    const viewEvents = logs.filter(l => ['view', 'document_view', 'document_viewed'].includes(l.event))
    const downloadEvents = logs.filter(l => ['download', 'file_download', 'document_download'].includes(l.event))
    const uniqueVisitors = [...new Set(logs.map(l => l.visitorEmail).filter(Boolean))]
    const ndaSignatures = space.ndaSignatures || []
    const shareLinks = Array.isArray(space.publicAccess) ? space.publicAccess : space.publicAccess ? [space.publicAccess] : []

    // ── Per-visitor engagement ────────────────────────────────────────────────
    const visitorMap: Record<string, {
      email: string
      views: number
      downloads: number
      docsViewed: Set<string>
      firstSeen: Date
      lastSeen: Date
      signedNDA: boolean
    }> = {}

    for (const log of logs) {
      const email = log.visitorEmail
      if (!email) continue
      if (!visitorMap[email]) {
        visitorMap[email] = {
          email,
          views: 0,
          downloads: 0,
          docsViewed: new Set(),
          firstSeen: new Date(log.timestamp),
          lastSeen: new Date(log.timestamp),
          signedNDA: false,
        }
      }
      const v = visitorMap[email]
      const ts = new Date(log.timestamp)
      if (ts < v.firstSeen) v.firstSeen = ts
      if (ts > v.lastSeen) v.lastSeen = ts
      if (['view', 'document_view', 'document_viewed'].includes(log.event)) {
        v.views++
        if (log.documentName) v.docsViewed.add(log.documentName)
      }
      if (['download', 'file_download', 'document_download'].includes(log.event)) v.downloads++
    }

    // Mark NDA signers
    for (const sig of ndaSignatures) {
      if (sig.email && visitorMap[sig.email]) {
        visitorMap[sig.email].signedNDA = true
      }
    }

    const visitors = Object.values(visitorMap).sort((a, b) => b.views - a.views)

    // ── Per-document stats ────────────────────────────────────────────────────
    const docMap: Record<string, { name: string; views: number; downloads: number; viewers: Set<string> }> = {}
    for (const log of logs) {
      const name = log.documentName
      if (!name) continue
      if (!docMap[name]) docMap[name] = { name, views: 0, downloads: 0, viewers: new Set() }
      if (['view', 'document_view', 'document_viewed'].includes(log.event)) {
        docMap[name].views++
        if (log.visitorEmail) docMap[name].viewers.add(log.visitorEmail)
      }
      if (['download', 'file_download', 'document_download'].includes(log.event)) docMap[name].downloads++
    }
    const docStats = Object.values(docMap).sort((a, b) => b.views - a.views)

    // ── Key timeline events ───────────────────────────────────────────────────
    const keyEvents = logs
      .filter(l => [
        'nda_signed', 'share_link_created', 'member_added',
        'document_uploaded', 'question_asked'
      ].includes(l.event))
      .slice(0, 20)

    const keyEventLabel: Record<string, string> = {
      nda_signed:         '✍️ NDA Signed',
      share_link_created: '🔗 Share Link Created',
      member_added:       '👤 Member Added',
      document_uploaded:  '📤 Document Uploaded',
      question_asked:     '💬 Question Asked',
    }

    // ── Answered vs unanswered Q&A ────────────────────────────────────────────
    const answeredQA = comments.filter((c: any) => c.reply).length
    const unansweredQA = comments.filter((c: any) => !c.reply).length

    // ── Build HTML ─────────────────────────────────────────────────────────────
    const visitorRows = visitors.map((v, i) => `
      <tr>
        <td style="padding:10px 14px;font-size:13px;font-weight:600;color:#1E293B;">
          ${i + 1}. ${v.email}
        </td>
        <td style="padding:10px 14px;font-size:13px;color:#475569;text-align:center;">${v.views}</td>
        <td style="padding:10px 14px;font-size:13px;color:#475569;text-align:center;">${v.downloads}</td>
        <td style="padding:10px 14px;font-size:13px;color:#475569;text-align:center;">${v.docsViewed.size}</td>
        <td style="padding:10px 14px;font-size:13px;color:#475569;text-align:center;">
          ${v.signedNDA ? '<span style="color:#10B981;font-weight:600;">✓ Signed</span>' : '—'}
        </td>
        <td style="padding:10px 14px;font-size:12px;color:#94A3B8;">${fmt(v.firstSeen)}</td>
        <td style="padding:10px 14px;font-size:12px;color:#94A3B8;">${fmt(v.lastSeen)}</td>
      </tr>
    `).join('')

    const docRows = docStats.slice(0, 20).map((d, i) => `
      <tr>
        <td style="padding:10px 14px;font-size:13px;font-weight:600;color:#1E293B;">
          ${i + 1}. ${d.name}
        </td>
        <td style="padding:10px 14px;font-size:13px;color:#475569;text-align:center;">${d.views}</td>
        <td style="padding:10px 14px;font-size:13px;color:#475569;text-align:center;">${d.downloads}</td>
        <td style="padding:10px 14px;font-size:13px;color:#475569;text-align:center;">${d.viewers.size}</td>
      </tr>
    `).join('')

    const timelineRows = keyEvents.map(e => `
      <tr>
        <td style="padding:8px 14px;font-size:12px;color:#94A3B8;white-space:nowrap;">${fmtFull(e.timestamp)}</td>
        <td style="padding:8px 14px;font-size:13px;color:#1E293B;">${keyEventLabel[e.event] || e.event}</td>
        <td style="padding:8px 14px;font-size:12px;color:#475569;">${e.visitorEmail || e.performedBy || '—'}</td>
        <td style="padding:8px 14px;font-size:12px;color:#475569;">${e.documentName || '—'}</td>
      </tr>
    `).join('')

    const ndaRows = ndaSignatures.map((sig: any) => `
      <tr>
        <td style="padding:8px 14px;font-size:13px;font-weight:600;color:#1E293B;">${sig.email}</td>
        <td style="padding:8px 14px;font-size:12px;color:#475569;">${fmtFull(sig.signedAt)}</td>
        <td style="padding:8px 14px;font-size:12px;color:#94A3B8;font-family:monospace;">${sig.ipAddress || '—'}</td>
      </tr>
    `).join('')

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Compliance Report — ${space.name}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #fff; color: #1E293B; line-height: 1.5; }

    .cover { padding: 56px 48px 40px; background: linear-gradient(135deg, #1E293B 0%, #334155 100%); color: #fff; }
    .cover-tag { font-size: 11px; font-weight: 700; letter-spacing: 0.15em; text-transform: uppercase; color: #94A3B8; margin-bottom: 16px; }
    .cover-title { font-size: 36px; font-weight: 800; margin-bottom: 8px; }
    .cover-space { font-size: 18px; color: #CBD5E1; margin-bottom: 40px; }
    .cover-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; }
    .cover-stat { background: rgba(255,255,255,0.08); border-radius: 12px; padding: 16px 20px; }
    .cover-stat-num { font-size: 26px; font-weight: 800; }
    .cover-stat-label { font-size: 11px; color: #94A3B8; margin-top: 4px; text-transform: uppercase; letter-spacing: 0.06em; }

    .section { padding: 36px 48px; border-bottom: 1px solid #F1F5F9; }
    .section:last-child { border-bottom: none; }
    .section-header { display: flex; align-items: center; gap: 12px; margin-bottom: 20px; }
    .section-icon { font-size: 20px; }
    .section-title { font-size: 16px; font-weight: 700; color: #0F172A; }
    .section-subtitle { font-size: 13px; color: #64748B; margin-left: auto; }

    table { width: 100%; border-collapse: collapse; }
    thead tr { background: #F8FAFC; }
    thead th { padding: 10px 14px; text-align: left; font-size: 11px; font-weight: 700;
      text-transform: uppercase; letter-spacing: 0.06em; color: #64748B; border-bottom: 2px solid #E2E8F0; }
    thead th.center { text-align: center; }
    tbody tr { border-bottom: 1px solid #F1F5F9; transition: background 0.1s; }
    tbody tr:last-child { border-bottom: none; }
    tbody tr:hover { background: #FAFAFA; }

    .badge { display: inline-block; padding: 2px 8px; border-radius: 99px; font-size: 11px; font-weight: 600; }
    .badge-green { background: #D1FAE5; color: #065F46; }
    .badge-blue  { background: #DBEAFE; color: #1E40AF; }
    .badge-gray  { background: #F1F5F9; color: #475569; }

    .no-data { padding: 32px; text-align: center; color: #94A3B8; font-size: 13px; }

    .footer { padding: 20px 48px; background: #F8FAFC; border-top: 1px solid #E2E8F0;
      display: flex; justify-content: space-between; align-items: center; }
    .footer-text { font-size: 11px; color: #94A3B8; }

    @media print {
      @page { margin: 0; size: A4; }
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .no-print { display: none !important; }
      .section { page-break-inside: avoid; }
    }
  </style>
</head>
<body>

  <!-- Print button -->
  <div class="no-print" style="position:fixed;top:16px;right:16px;z-index:999;display:flex;gap:8px;">
    <button onclick="window.print()"
      style="padding:10px 20px;background:#1E293B;color:#fff;border:none;border-radius:8px;font-size:14px;font-weight:600;cursor:pointer;">
      ⬇ Download PDF
    </button>
  </div>

  <!-- Cover -->
  <div class="cover">
    <div class="cover-tag">DocMetrics · Compliance Report</div>
    <div class="cover-title">Due Diligence Summary</div>
    <div class="cover-space">${space.name}</div>
    <div class="cover-grid">
      <div class="cover-stat">
        <div class="cover-stat-num">${uniqueVisitors.length}</div>
        <div class="cover-stat-label">Unique Visitors</div>
      </div>
      <div class="cover-stat">
        <div class="cover-stat-num">${viewEvents.length}</div>
        <div class="cover-stat-label">Document Views</div>
      </div>
      <div class="cover-stat">
        <div class="cover-stat-num">${ndaSignatures.length}</div>
        <div class="cover-stat-label">NDA Signatures</div>
      </div>
      <div class="cover-stat">
        <div class="cover-stat-num">${documents.length}</div>
        <div class="cover-stat-label">Documents</div>
      </div>
    </div>
    <div style="margin-top:28px;font-size:12px;color:#94A3B8;">
      Generated ${generatedAt} · by ${user.email}
    </div>
  </div>

  <!-- Visitor Engagement -->
  <div class="section">
    <div class="section-header">
      <span class="section-icon">👥</span>
      <span class="section-title">Visitor Engagement</span>
      <span class="section-subtitle">${visitors.length} unique visitor${visitors.length !== 1 ? 's' : ''}</span>
    </div>
    ${visitors.length === 0
      ? '<div class="no-data">No visitor activity recorded yet</div>'
      : `<table>
          <thead>
            <tr>
              <th>Visitor</th>
              <th class="center">Views</th>
              <th class="center">Downloads</th>
              <th class="center">Docs Seen</th>
              <th class="center">NDA</th>
              <th>First Visit</th>
              <th>Last Visit</th>
            </tr>
          </thead>
          <tbody>${visitorRows}</tbody>
        </table>`
    }
  </div>

  <!-- Document Performance -->
  <div class="section">
    <div class="section-header">
      <span class="section-icon">📄</span>
      <span class="section-title">Document Performance</span>
      <span class="section-subtitle">Most viewed first</span>
    </div>
    ${docStats.length === 0
      ? '<div class="no-data">No document views recorded yet</div>'
      : `<table>
          <thead>
            <tr>
              <th>Document</th>
              <th class="center">Views</th>
              <th class="center">Downloads</th>
              <th class="center">Unique Viewers</th>
            </tr>
          </thead>
          <tbody>${docRows}</tbody>
        </table>`
    }
  </div>

  <!-- NDA Signatures -->
  ${ndaSignatures.length > 0 ? `
  <div class="section">
    <div class="section-header">
      <span class="section-icon">✍️</span>
      <span class="section-title">NDA Signatures</span>
      <span class="section-subtitle">${ndaSignatures.length} signed</span>
    </div>
    <table>
      <thead>
        <tr>
          <th>Signer</th>
          <th>Signed At</th>
          <th>IP Address</th>
        </tr>
      </thead>
      <tbody>${ndaRows}</tbody>
    </table>
  </div>` : ''}

  <!-- Q&A Summary -->
  ${comments.length > 0 ? `
  <div class="section">
    <div class="section-header">
      <span class="section-icon">💬</span>
      <span class="section-title">Q&A Activity</span>
      <span class="section-subtitle">${comments.length} question${comments.length !== 1 ? 's' : ''}</span>
    </div>
    <div style="display:flex;gap:16px;margin-bottom:20px;">
      <div style="flex:1;padding:16px;background:#F0FDF4;border-radius:10px;border:1px solid #BBF7D0;text-align:center;">
        <div style="font-size:22px;font-weight:800;color:#065F46;">${answeredQA}</div>
        <div style="font-size:12px;color:#065F46;margin-top:4px;">Answered</div>
      </div>
      <div style="flex:1;padding:16px;background:#FEF3C7;border-radius:10px;border:1px solid #FDE68A;text-align:center;">
        <div style="font-size:22px;font-weight:800;color:#92400E;">${unansweredQA}</div>
        <div style="font-size:12px;color:#92400E;margin-top:4px;">Awaiting Reply</div>
      </div>
      <div style="flex:1;padding:16px;background:#EFF6FF;border-radius:10px;border:1px solid #BFDBFE;text-align:center;">
        <div style="font-size:22px;font-weight:800;color:#1E40AF;">${comments.length}</div>
        <div style="font-size:12px;color:#1E40AF;margin-top:4px;">Total Questions</div>
      </div>
    </div>
  </div>` : ''}

  <!-- Key Events Timeline -->
  ${keyEvents.length > 0 ? `
  <div class="section">
    <div class="section-header">
      <span class="section-icon">📅</span>
      <span class="section-title">Key Events Timeline</span>
    </div>
    <table>
      <thead>
        <tr>
          <th>Timestamp</th>
          <th>Event</th>
          <th>Actor</th>
          <th>Document</th>
        </tr>
      </thead>
      <tbody>${timelineRows}</tbody>
    </table>
  </div>` : ''}

  <!-- Share Links -->
  ${shareLinks.length > 0 ? `
  <div class="section">
    <div class="section-header">
      <span class="section-icon">🔗</span>
      <span class="section-title">Share Links</span>
      <span class="section-subtitle">${shareLinks.length} link${shareLinks.length !== 1 ? 's' : ''} created</span>
    </div>
    <table>
      <thead>
        <tr>
          <th>Label</th>
          <th>Security</th>
          <th>Created</th>
          <th>Expires</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
        ${shareLinks.map((sl: any) => `
          <tr>
            <td style="padding:10px 14px;font-size:13px;color:#1E293B;">${sl.label || 'Unnamed link'}</td>
            <td style="padding:10px 14px;">
              <span class="badge ${sl.securityLevel === 'whitelist' ? 'badge-blue' : sl.securityLevel === 'password' ? 'badge-green' : 'badge-gray'}">
                ${sl.securityLevel || 'open'}
              </span>
            </td>
            <td style="padding:10px 14px;font-size:12px;color:#475569;">${fmt(sl.createdAt)}</td>
            <td style="padding:10px 14px;font-size:12px;color:#475569;">${sl.expiresAt ? fmt(sl.expiresAt) : 'No expiry'}</td>
            <td style="padding:10px 14px;">
              <span class="badge ${sl.enabled !== false ? 'badge-green' : 'badge-gray'}">
                ${sl.enabled !== false ? 'Active' : 'Disabled'}
              </span>
            </td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  </div>` : ''}

  <!-- Footer -->
  <div class="footer">
    <span class="footer-text">Confidential — DocMetrics Compliance Report · ${generatedAt}</span>
    <span class="footer-text">${space.name} · Generated by ${user.email}</span>
  </div>

</body>
</html>`

    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-store',
      }
    })

  } catch (error) {
    console.error('Compliance report error:', error)
    return new NextResponse('Server error', { status: 500 })
  }
}