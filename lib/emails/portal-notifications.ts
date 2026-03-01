import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = 'DocMetrics <noreply@docmetrics.io>';

function formatTime(seconds: number): string {
  if (!seconds || seconds < 60) return `${seconds || 0}s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return s > 0 ? `${m}m ${s}s` : `${m}m`;
}

function getEventEmoji(event: string): string {
  const map: Record<string, string> = {
    portal_enter: '👁️',
    revisit:      '🔄',
    document_view:'📄',
    download:     '⬇️',
  };
  return map[event] || '📊';
}

function getEventLabel(event: string): string {
  const map: Record<string, string> = {
    portal_enter:  'opened your space',
    revisit:       'revisited your space',
    document_view: 'viewed a document',
    download:      'downloaded a document',
  };
  return map[event] || event;
}

// ─── Main notification sender ─────────────────────────────────────────────────
export async function sendPortalNotification({
  ownerEmail,
  spaceName,
  visitorEmail,
  event,
  documentName,
  totalSecondsOnDoc,
  shareLabel,
  spaceId,
  appUrl,
}: {
  ownerEmail: string;
  spaceName: string;
  visitorEmail: string;
  event: 'portal_enter' | 'revisit' | 'document_view' | 'download';
  documentName?: string;
  totalSecondsOnDoc?: number;
  shareLabel?: string;
  spaceId?: string;
  appUrl?: string;
}) {
  const emoji       = getEventEmoji(event);
  const label       = getEventLabel(event);
  const visitorName = visitorEmail.split('@')[0];
  const analyticsUrl = appUrl && spaceId
  ? `${appUrl}/spaces/${spaceId}`
  : null;

  const subject = `${emoji} ${visitorEmail} ${label} — ${spaceName}`;

  const timeRow = totalSecondsOnDoc && event === 'document_view'
    ? `<tr>
        <td style="padding:6px 0;color:#6b7280;font-size:14px;">Time spent</td>
        <td style="padding:6px 0;font-size:14px;font-weight:600;color:#111827;">${formatTime(totalSecondsOnDoc)}</td>
       </tr>`
    : '';

  const docRow = documentName
    ? `<tr>
        <td style="padding:6px 0;color:#6b7280;font-size:14px;">Document</td>
        <td style="padding:6px 0;font-size:14px;font-weight:600;color:#111827;">📄 ${documentName}</td>
       </tr>`
    : '';

  const linkRow = shareLabel
    ? `<tr>
        <td style="padding:6px 0;color:#6b7280;font-size:14px;">Via link</td>
        <td style="padding:6px 0;font-size:14px;color:#111827;">${shareLabel}</td>
       </tr>`
    : '';

  const analyticsBtn = analyticsUrl
    ? `<div style="text-align:center;margin-top:28px;">
        <a href="${analyticsUrl}"
         style="display:inline-block;background:#111827;color:#ffffff;padding:12px 28px;
       border-radius:8px;font-size:14px;font-weight:600;text-decoration:none;">
  View Space →
</a>
       </div>`
    : '';

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8"/>
      <meta name="viewport" content="width=device-width,initial-scale=1"/>
    </head>
    <body style="margin:0;padding:0;background:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:40px 16px;">
        <tr><td align="center">
          <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,0.08);">

            <!-- Header -->
            <tr>
              <td style="background:#111827;padding:28px 32px;">
                <p style="margin:0;font-size:13px;color:#9ca3af;letter-spacing:0.05em;text-transform:uppercase;">DocMetrics</p>
                <h1 style="margin:6px 0 0;font-size:22px;color:#ffffff;font-weight:700;">
                  ${emoji} Activity Alert
                </h1>
              </td>
            </tr>

            <!-- Body -->
            <tr>
              <td style="padding:32px;">

                <!-- Headline -->
                <p style="margin:0 0 24px;font-size:16px;color:#111827;line-height:1.6;">
                  <strong style="color:#111827;">${visitorEmail}</strong>
                  &nbsp;${label} in your space
                  <strong style="color:#111827;">${spaceName}</strong>.
                </p>

                <!-- Details table -->
                <table width="100%" cellpadding="0" cellspacing="0"
                  style="background:#f9fafb;border-radius:10px;padding:16px 20px;border:1px solid #e5e7eb;">
                  <tr>
                    <td style="padding:6px 0;color:#6b7280;font-size:14px;width:40%;">Visitor</td>
                    <td style="padding:6px 0;font-size:14px;font-weight:600;color:#111827;">${visitorEmail}</td>
                  </tr>
                  <tr>
                    <td style="padding:6px 0;color:#6b7280;font-size:14px;">Event</td>
                    <td style="padding:6px 0;font-size:14px;font-weight:600;color:#111827;">${emoji} ${label}</td>
                  </tr>
                  <tr>
                    <td style="padding:6px 0;color:#6b7280;font-size:14px;">Space</td>
                    <td style="padding:6px 0;font-size:14px;color:#111827;">${spaceName}</td>
                  </tr>
                  ${docRow}
                  ${timeRow}
                  ${linkRow}
                  <tr>
                    <td style="padding:6px 0;color:#6b7280;font-size:14px;">Time</td>
                    <td style="padding:6px 0;font-size:14px;color:#111827;">${new Date().toLocaleString('en-US', { month:'short', day:'numeric', year:'numeric', hour:'2-digit', minute:'2-digit' })}</td>
                  </tr>
                </table>

                ${analyticsBtn}

              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td style="background:#f9fafb;padding:20px 32px;border-top:1px solid #e5e7eb;">
                <p style="margin:0;font-size:12px;color:#9ca3af;text-align:center;">
                  You're receiving this because you own the space <strong>${spaceName}</strong>.<br/>
                  © ${new Date().getFullYear()} DocMetrics
                </p>
              </td>
            </tr>

          </table>
        </td></tr>
      </table>
    </body>
    </html>
  `;

  await resend.emails.send({ from: FROM, to: [ownerEmail], subject, html });
}