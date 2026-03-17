// app/api/public/file-requests/[token]/track/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { dbPromise } from '@/app/api/lib/mongodb';
import { ObjectId } from 'mongodb';
import { Resend } from 'resend';
import { sendSlackNotification } from '@/lib/integrations/slack';
import { getValidHubSpotToken } from '@/lib/integrations/hubspot';
import { createNotification } from '@/lib/notifications';
import { sendTeamsNotification } from '@/app/api/integrations/teams/notify/route';

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = 'DocMetrics <noreply@docmetrics.io>';

// ── EMAIL BUILDER ─────────────────────────────────────────────────────────────
function buildFileRequestEmailHtml({
  title,
  subtitle,
  stats,
  color = '#7c3aed',
}: {
  title: string;
  subtitle: string;
  stats: Array<{ label: string; value: string }>;
  color?: string;
}) {
  const statsHtml = stats
    .map(
      (s) => `
      <td style="padding:0 12px;text-align:center;border-right:1px solid #e2e8f0">
        <div style="font-size:22px;font-weight:900;color:#0f172a">${s.value}</div>
        <div style="font-size:11px;color:#94a3b8;margin-top:4px;text-transform:uppercase;letter-spacing:1px">${s.label}</div>
      </td>`
    )
    .join('');

  return `<!DOCTYPE html><html><body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
<div style="max-width:560px;margin:32px auto;background:#fff;border-radius:16px;overflow:hidden;border:1px solid #e2e8f0">
  <div style="height:5px;background:linear-gradient(90deg,${color},#3b82f6)"></div>
  <div style="padding:28px 32px 20px">
    <div style="display:inline-flex;align-items:center;gap:8px;background:${color}15;border-radius:999px;padding:6px 14px;margin-bottom:16px">
      <span style="font-size:13px;font-weight:700;color:${color}">File Request Update</span>
    </div>
    <h1 style="margin:0 0 6px;font-size:20px;font-weight:800;color:#0f172a">${title}</h1>
    <p style="margin:0;font-size:14px;color:#64748b">${subtitle}</p>
  </div>
  <div style="padding:0 32px 24px">
    <table style="width:100%;border-collapse:collapse;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden">
      <tr style="background:#f8fafc">${statsHtml}</tr>
    </table>
  </div>
  <div style="padding:16px 32px;background:#f8fafc;border-top:1px solid #e2e8f0">
    <p style="margin:0;font-size:11px;color:#94a3b8">DocMetrics · File Request Tracking</p>
  </div>
</div></body></html>`;
}

// ── HUBSPOT HELPER ────────────────────────────────────────────────────────────
async function syncToHubSpot(
  ownerId: string,
  visitorEmail: string,
  requestTitle: string,
  noteBody: string,
  extraProps: Record<string, string>
) {
  try {
    const token = await getValidHubSpotToken(ownerId);

    const searchRes = await fetch(`https://api.hubapi.com/crm/v3/objects/contacts/search`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        filterGroups: [{ filters: [{ propertyName: 'email', operator: 'EQ', value: visitorEmail }] }],
        properties: ['email', 'firstname', 'lastname'],
        limit: 1,
      }),
    });
    const searchData = await searchRes.json();
    const contact = searchData.results?.[0];
    if (!contact) return;

    const contactId = contact.id;

    await fetch(`https://api.hubapi.com/crm/v3/objects/contacts/${contactId}`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ properties: extraProps }),
    });

    const noteRes = await fetch(`https://api.hubapi.com/crm/v3/objects/notes`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        properties: {
          hs_note_body: noteBody,
          hs_timestamp: new Date().getTime().toString(),
        },
      }),
    });
    const noteData = await noteRes.json();

    if (noteData.id) {
      await fetch(
        `https://api.hubapi.com/crm/v3/objects/notes/${noteData.id}/associations/contacts/${contactId}/note_to_contact`,
        { method: 'PUT', headers: { Authorization: `Bearer ${token}` } }
      );
    }
  } catch (err) {
    console.error('HubSpot sync error:', err);
  }
}

// ── MAIN HANDLER ──────────────────────────────────────────────────────────────
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await context.params;

    let body: any = {};
    try {
      const text = await request.text();
      if (text?.trim()) body = JSON.parse(text);
    } catch { /* empty body */ }

    const { action, recipientEmail, fileName, fileCount } = body;

    const db = await dbPromise;

    const fileRequest = await db.collection('fileRequests').findOne({ shareToken: token });
    if (!fileRequest) {
      return NextResponse.json({ success: false }, { status: 404 });
    }

    const owner = await db.collection('users').findOne({
      _id: new ObjectId(fileRequest.userId.toString()),
    });
    const ownerEmail = owner?.email;
    const ownerId = owner?._id?.toString();

    const requestTitle = fileRequest.title || 'File Request';
    const fileRequestId = fileRequest._id.toString();
    const now = new Date();
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'Unknown';
    const visitorEmail = recipientEmail || 'Someone';

    console.log(`FILE REQUEST TRACK: action=${action} | title="${requestTitle}" | visitor=${visitorEmail}`);

    // ════════════════════════════════════════
    // ACTION: opened
    // ════════════════════════════════════════
    if (action === 'opened') {
      await db.collection('fileRequests').updateOne(
        { shareToken: token },
        {
          $inc: { openCount: 1 },
          $set: { lastOpenedAt: now },
          $push: {
            openHistory: {
              openedAt: now,
              email: visitorEmail,
              ip,
            } as any,
          },
        }
      );

      const openCount = (fileRequest.openCount || 0) + 1;

      // ── In-app notification ──
      if (ownerId) {
        createNotification({
          userId: ownerId,
          type: 'view',
          title: 'File Request Opened',
          message: `${visitorEmail} opened your file request "${requestTitle}"`,
          redirectUrl: `/dashboard?page=file-requests&openRequest=${fileRequestId}`,
          actorName: visitorEmail,
          actorEmail: recipientEmail || undefined,
          metadata: {
            fileRequestId,
            requestTitle,
            openCount,
            openedAt: now,
          },
        }).catch(() => {});
      }

      // ── Email to owner ──
      if (ownerEmail) {
        resend.emails.send({
          from: FROM,
          to: ownerEmail,
          subject: `Someone opened your file request "${requestTitle}"`,
          html: buildFileRequestEmailHtml({
            title: 'File Request Opened',
            subtitle: `${visitorEmail} just opened your file request link.`,
            stats: [
              { label: 'Visitor', value: visitorEmail === 'Someone' ? 'Unknown' : visitorEmail.split('@')[0] },
              { label: 'Open Number', value: String(openCount) },
              { label: 'Time', value: now.toLocaleTimeString() },
            ],
            color: '#0ea5e9',
          }),
        }).catch((err) => console.error('Email error:', err));
      }

      // ── Slack ──
      if (ownerId) {
        sendSlackNotification({
          userId: ownerId,
          message: `${visitorEmail} opened file request "${requestTitle}" (open #${openCount})`,
          blocks: [
            {
              type: 'section',
              text: {
                type: 'mrkdwn',
                text: `*File Request Opened*\n*${visitorEmail}* opened "${requestTitle}"\nOpen #${openCount} · ${now.toLocaleString()}`,
              },
            },
          ],
        }).catch(() => {});
      }

      // ── Microsoft Teams ──
      if (ownerId) {
        sendTeamsNotification({
          userId: ownerId,
          event: 'document_open',
          documentName: requestTitle,
          documentId: fileRequestId,
          viewerEmail: recipientEmail || undefined,
          viewerName: visitorEmail !== 'Someone' ? visitorEmail : undefined,
          extraInfo: `File request opened. Open count: ${openCount}`,
        }).catch(() => {});
      }

      // ── HubSpot ──
      if (ownerId && recipientEmail) {
        syncToHubSpot(
          ownerId,
          recipientEmail,
          requestTitle,
          `File Request Opened\n\nRequest: ${requestTitle}\nVisitor: ${visitorEmail}\nOpen number: ${openCount}\nTime: ${now.toLocaleString()}`,
          {
            docmetrics_last_document: requestTitle,
            docmetrics_last_viewed: now.toISOString(),
            docmetrics_view_count: String(openCount),
          }
        ).catch(() => {});
      }
    }

    // ════════════════════════════════════════
    // ACTION: uploaded
    // ════════════════════════════════════════
    else if (action === 'uploaded') {
      const uploadedCount = fileCount || 1;
      const uploadedName = fileName || 'a file';

      // ── In-app notification ──
      if (ownerId) {
        createNotification({
          userId: ownerId,
          type: 'upload',
          title: 'File Uploaded',
          message: `${visitorEmail} uploaded "${uploadedName}" to "${requestTitle}"`,
          redirectUrl: `/dashboard?page=file-requests&openRequest=${fileRequestId}`,
          actorName: visitorEmail,
          actorEmail: recipientEmail || undefined,
          metadata: {
            fileRequestId,
            requestTitle,
            fileName: uploadedName,
            fileCount: uploadedCount,
            uploadedAt: now,
          },
        }).catch(() => {});
      }

      // ── Email to owner ──
      if (ownerEmail) {
        resend.emails.send({
          from: FROM,
          to: ownerEmail,
          subject: `${visitorEmail} uploaded to your file request "${requestTitle}"`,
          html: buildFileRequestEmailHtml({
            title: 'File Uploaded',
            subtitle: `${visitorEmail} just uploaded to "${requestTitle}".`,
            stats: [
              { label: 'Uploader', value: visitorEmail === 'Someone' ? 'Unknown' : visitorEmail.split('@')[0] },
              { label: 'Files', value: String(uploadedCount) },
              { label: 'Time', value: now.toLocaleTimeString() },
            ],
            color: '#22c55e',
          }),
        }).catch((err) => console.error('Email error:', err));
      }

      // ── Slack ──
      if (ownerId) {
        sendSlackNotification({
          userId: ownerId,
          message: `${visitorEmail} uploaded ${uploadedCount} file(s) to "${requestTitle}"`,
          blocks: [
            {
              type: 'section',
              text: {
                type: 'mrkdwn',
                text: `*File Uploaded*\n*${visitorEmail}* uploaded *${uploadedCount} file(s)* to "${requestTitle}"\nFile: ${uploadedName}`,
              },
            },
            { type: 'divider' },
            {
              type: 'context',
              elements: [{ type: 'mrkdwn', text: `${now.toLocaleString()} · ${ip}` }],
            },
          ],
        }).catch(() => {});
      }

      // ── Microsoft Teams ──
      if (ownerId) {
        sendTeamsNotification({
          userId: ownerId,
          event: 'file_request_received',
          documentName: requestTitle,
          documentId: fileRequestId,
          viewerEmail: recipientEmail || undefined,
          viewerName: visitorEmail !== 'Someone' ? visitorEmail : undefined,
          extraInfo: `${uploadedCount} file(s) uploaded. File name: ${uploadedName}`,
        }).catch(() => {});
      }

      // ── HubSpot ──
      if (ownerId && recipientEmail) {
        syncToHubSpot(
          ownerId,
          recipientEmail,
          requestTitle,
          `File Uploaded\n\nRequest: ${requestTitle}\nUploader: ${visitorEmail}\nFile: ${uploadedName}\nCount: ${uploadedCount}\nTime: ${now.toLocaleString()}`,
          {
            docmetrics_last_document: requestTitle,
            docmetrics_completed_read: 'true',
            docmetrics_intent_level: 'HIGH',
          }
        ).catch(() => {});
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('File request track error:', error);
    return NextResponse.json({ success: true, warning: 'Track failed silently' });
  }
}