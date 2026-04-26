// app/api/spaces/[id]/audit/export/route.ts
//
// WHAT THIS DOES:
//   Generates a professional PDF-ready HTML audit report for a space.
//   The frontend opens this URL in a new tab and the user prints to PDF.
//   No extra npm packages needed — pure HTML/CSS that prints perfectly.
//
// WHY HTML NOT A REAL PDF LIBRARY:
//   PDF generation libraries (puppeteer, pdfkit) require a headless browser
//   or complex setup on Vercel serverless. HTML + browser print = zero deps,
//   works everywhere, and looks just as professional.
//
// ACCESS CONTROL:
//   Requires Pro or Business plan (same as the audit log tab).
//   Only the space owner or members can access.

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
      return new NextResponse('Audit log export requires Pro or Business plan.', { status: 403 })
    }

    const db = await dbPromise
    const space = await db.collection('spaces').findOne({ _id: new ObjectId(spaceId) })
    if (!space) return new NextResponse('Space not found', { status: 404 })

    const isOwner = space.userId === user._id.toString()
    const isMember = space.members?.some(
      (m: any) => m.email === user.email || m.userId === user._id.toString()
    )
    if (!isOwner && !isMember) return new NextResponse('Access denied', { status: 403 })

    // Fetch all activity logs
    const logs = await db.collection('activityLogs')
      .find({ spaceId: new ObjectId(spaceId) })
      .sort({ timestamp: -1 })
      .limit(500)
      .toArray()

    const generatedAt = new Date().toLocaleString('en-US', {
      month: 'long', day: 'numeric', year: 'numeric',
      hour: '2-digit', minute: '2-digit', timeZoneName: 'short'
    })

    const formatDate = (d: any) => {
      if (!d) return '—'
      return new Date(d).toLocaleString('en-US', {
        month: 'short', day: 'numeric', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
      })
    }

    const categoryColor: Record<string, string> = {
      documents: '#3B82F6',
      members:   '#8B5CF6',
      links:     '#6366F1',
      visitors:  '#10B981',
      settings:  '#F59E0B',
    }

    const getCategory = (event: string): string => {
      if (['document_view', 'document_viewed', 'view', 'download', 'file_download',
           'document_download', 'document_uploaded', 'document_deleted'].includes(event)) return 'documents'
      if (['member_added', 'member_removed', 'member_role_changed'].includes(event)) return 'members'
      if (['share_link_created', 'share_link_disabled', 'share_link_enabled'].includes(event)) return 'links'
      if (['portal_enter', 'portal_opened', 'space_open', 'question_asked', 'nda_signed'].includes(event)) return 'visitors'
      return 'settings'
    }

    const rows = logs.map(log => {
      const cat = getCategory(log.event)
      const color = categoryColor[cat] || '#64748B'
      const actor = log.visitorEmail || log.performedBy || '—'
      return `
        <tr>
          <td style="padding:10px 12px;font-size:12px;color:#475569;white-space:nowrap;">
            ${formatDate(log.timestamp)}
          </td>
          <td style="padding:10px 12px;">
            <span style="display:inline-block;padding:2px 8px;border-radius:99px;font-size:11px;font-weight:600;background:${color}20;color:${color};text-transform:capitalize;">
              ${cat}
            </span>
          </td>
          <td style="padding:10px 12px;font-size:12px;color:#1E293B;font-family:monospace;">
            ${log.event}
          </td>
          <td style="padding:10px 12px;font-size:12px;color:#475569;">
            ${actor}
          </td>
          <td style="padding:10px 12px;font-size:12px;color:#475569;">
            ${log.documentName || '—'}
          </td>
          <td style="padding:10px 12px;font-size:12px;color:#94A3B8;font-family:monospace;">
            ${log.ipAddress || '—'}
          </td>
        </tr>
      `
    }).join('')

    // Summary counts
    const totalEvents = logs.length
    const uniqueVisitors = new Set(logs.map(l => l.visitorEmail).filter(Boolean)).size
    const totalViews = logs.filter(l => ['view', 'document_view', 'document_viewed'].includes(l.event)).length
    const totalDownloads = logs.filter(l => ['download', 'file_download', 'document_download'].includes(l.event)).length

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Audit Log — ${space.name}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #fff; color: #1E293B; }

    .cover {
      padding: 60px 48px 40px;
      border-bottom: 3px solid #6366F1;
    }
    .cover-logo {
      font-size: 13px; font-weight: 700; letter-spacing: 0.1em;
      text-transform: uppercase; color: #6366F1; margin-bottom: 40px;
    }
    .cover-title { font-size: 32px; font-weight: 800; color: #0F172A; margin-bottom: 8px; }
    .cover-subtitle { font-size: 16px; color: #64748B; margin-bottom: 32px; }
    .cover-meta { display: flex; gap: 40px; flex-wrap: wrap; }
    .cover-meta-item { }
    .cover-meta-label { font-size: 11px; font-weight: 600; text-transform: uppercase;
      letter-spacing: 0.08em; color: #94A3B8; margin-bottom: 4px; }
    .cover-meta-value { font-size: 14px; font-weight: 600; color: #1E293B; }

    .summary { display: flex; gap: 0; border-bottom: 1px solid #E2E8F0; }
    .summary-card {
      flex: 1; padding: 24px 28px; border-right: 1px solid #E2E8F0;
    }
    .summary-card:last-child { border-right: none; }
    .summary-number { font-size: 28px; font-weight: 800; color: #0F172A; }
    .summary-label { font-size: 12px; color: #64748B; margin-top: 4px; }

    .section { padding: 32px 48px; }
    .section-title {
      font-size: 13px; font-weight: 700; text-transform: uppercase;
      letter-spacing: 0.08em; color: #64748B; margin-bottom: 16px;
    }

    table { width: 100%; border-collapse: collapse; }
    thead tr { background: #F8FAFC; border-bottom: 2px solid #E2E8F0; }
    thead th {
      padding: 10px 12px; text-align: left; font-size: 11px; font-weight: 700;
      text-transform: uppercase; letter-spacing: 0.06em; color: #64748B;
    }
    tbody tr { border-bottom: 1px solid #F1F5F9; }
    tbody tr:hover { background: #FAFAFA; }
    tbody tr:last-child { border-bottom: none; }

    .footer {
      padding: 24px 48px; border-top: 1px solid #E2E8F0; background: #F8FAFC;
      display: flex; justify-content: space-between; align-items: center;
    }
    .footer-text { font-size: 11px; color: #94A3B8; }

    @media print {
      @page { margin: 0; size: A4 landscape; }
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .no-print { display: none !important; }
    }
  </style>
</head>
<body>

  <!-- Print button (hidden when printing) -->
  <div class="no-print" style="position:fixed;top:16px;right:16px;z-index:999;">
    <button onclick="window.print()"
      style="padding:10px 20px;background:#6366F1;color:#fff;border:none;border-radius:8px;font-size:14px;font-weight:600;cursor:pointer;box-shadow:0 4px 12px rgba(99,102,241,0.3);">
      ⬇ Download PDF
    </button>
  </div>

  <!-- Cover -->
  <div class="cover">
    <div class="cover-logo">DocMetrics</div>
    <div class="cover-title">Audit Log Report</div>
    <div class="cover-subtitle">${space.name}</div>
    <div class="cover-meta">
      <div class="cover-meta-item">
        <div class="cover-meta-label">Generated</div>
        <div class="cover-meta-value">${generatedAt}</div>
      </div>
      <div class="cover-meta-item">
        <div class="cover-meta-label">Generated by</div>
        <div class="cover-meta-value">${user.email}</div>
      </div>
      <div class="cover-meta-item">
        <div class="cover-meta-label">Total Events</div>
        <div class="cover-meta-value">${totalEvents.toLocaleString()}</div>
      </div>
    </div>
  </div>

  <!-- Summary -->
  <div class="summary">
    <div class="summary-card">
      <div class="summary-number">${totalEvents}</div>
      <div class="summary-label">Total Events</div>
    </div>
    <div class="summary-card">
      <div class="summary-number">${uniqueVisitors}</div>
      <div class="summary-label">Unique Visitors</div>
    </div>
    <div class="summary-card">
      <div class="summary-number">${totalViews}</div>
      <div class="summary-label">Document Views</div>
    </div>
    <div class="summary-card">
      <div class="summary-number">${totalDownloads}</div>
      <div class="summary-label">Downloads</div>
    </div>
  </div>

  <!-- Event Log Table -->
  <div class="section">
    <div class="section-title">Activity Log (${totalEvents} events)</div>
    <table>
      <thead>
        <tr>
          <th>Timestamp</th>
          <th>Category</th>
          <th>Event</th>
          <th>Actor</th>
          <th>Document</th>
          <th>IP Address</th>
        </tr>
      </thead>
      <tbody>
        ${rows || '<tr><td colspan="6" style="padding:24px;text-align:center;color:#94A3B8;">No events recorded</td></tr>'}
      </tbody>
    </table>
  </div>

  <!-- Footer -->
  <div class="footer">
    <span class="footer-text">Confidential — Generated by DocMetrics · ${generatedAt}</span>
    <span class="footer-text">Space: ${space.name} · ${totalEvents} events</span>
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
    console.error('Audit export error:', error)
    return new NextResponse('Server error', { status: 500 })
  }
}