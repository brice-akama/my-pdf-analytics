// lib/emails/teamEmails.ts
import { Resend } from "resend";
import { dbPromise } from "@/app/api/lib/mongodb";
import { getValidGmailToken } from "@/lib/integrations/gmail";
import { ObjectId } from "mongodb";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendTeamInviteEmail({
  recipientEmail,
  inviterName,
  companyName,
  role,
  inviteLink,
}: {
  recipientEmail: string;
  inviterName: string;
  companyName: string;
  role: string;
  inviteLink: string;
}) {
  const { data, error } = await resend.emails.send({
    from: "DocMetrics <noreply@docmetrics.io>",
    to: [recipientEmail],
    subject: `${inviterName} invited you to join ${companyName} on DocMetrics`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; background: #f5f5f5; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 40px auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center; color: white; }
          .content { padding: 40px 30px; }
          .role-badge { display: inline-block; background: #ede9fe; color: #7c3aed; padding: 4px 12px; border-radius: 20px; font-size: 13px; font-weight: 600; }
          .cta-button { display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 16px 40px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; margin: 20px 0; }
          .info-box { background: #f0f9ff; border-left: 4px solid #3b82f6; padding: 15px 20px; border-radius: 4px; margin: 20px 0; }
          .footer { background: #f8f9fa; padding: 25px; text-align: center; font-size: 13px; color: #6c757d; border-top: 1px solid #e9ecef; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin:0; font-size:28px;">🎉 You're Invited!</h1>
            <p style="margin:10px 0 0; opacity:0.9;">Join your team on DocMetrics</p>
          </div>
          <div class="content">
            <p style="font-size:17px;">Hi there,</p>
            <p><strong>${inviterName}</strong> has invited you to join <strong>${companyName}</strong> on DocMetrics as a:</p>
            <div style="text-align:center; margin: 20px 0;">
              <span class="role-badge">✨ ${role.charAt(0).toUpperCase() + role.slice(1)}</span>
            </div>
            <div class="info-box">
              <strong>What you can do on DocMetrics:</strong>
              <ul style="margin: 10px 0; padding-left: 20px;">
                <li>Share and track documents securely</li>
                <li>Request and collect e-signatures</li>
                <li>Collaborate with your team in one place</li>
                <li>Get real-time analytics on document engagement</li>
              </ul>
            </div>
            <div style="text-align:center;">
              <a href="${inviteLink}" class="cta-button">Accept Invitation</a>
            </div>
            <p style="font-size:13px; color:#6b7280; margin-top:15px;">
              ⏰ This invitation expires in <strong>7 days</strong>.
            </p>
            <p style="font-size:13px; color:#6b7280;">
              Or copy this link:<br/>
              <a href="${inviteLink}" style="color:#667eea; word-break:break-all;">${inviteLink}</a>
            </p>
          </div>
          <div class="footer">
            <p>If you didn't expect this invitation, you can safely ignore this email.</p>
            <p>© ${new Date().getFullYear()} DocMetrics. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `,
  });

  if (error) throw error;
  return { success: true, data };
}

// ─── Notify inviter when invitee accepts ─────────────────────────────────────────────


export async function sendInviteAcceptedNotification({
  inviterEmail,
  inviterName,
  newMemberName,
  newMemberEmail,
  role,
  organizationName,
  teamPageUrl,
}: {
  inviterEmail: string;
  inviterName: string;
  newMemberName: string;
  newMemberEmail: string;
  role: string;
  organizationName: string;
  teamPageUrl: string;
}) {
  const { data, error } = await resend.emails.send({
    from: "DocMetrics <noreply@docmetrics.io>",
    to: [inviterEmail],
    subject: `🎉 ${newMemberName} accepted your invitation to ${organizationName}`,
    html: `
      <!DOCTYPE html>
      <html>
      <body style="font-family:sans-serif; background:#f5f5f5; margin:0; padding:0;">
        <div style="max-width:600px; margin:40px auto; background:white; border-radius:12px; overflow:hidden; box-shadow:0 4px 6px rgba(0,0,0,.1);">
          <div style="background:linear-gradient(135deg,#10b981,#059669); padding:40px 30px; text-align:center; color:white;">
            <div style="font-size:48px;">🎉</div>
            <h1 style="margin:0; font-size:26px;">Invitation Accepted!</h1>
          </div>
          <div style="padding:40px 30px;">
            <p>Hi <strong>${inviterName}</strong>,</p>
            <p><strong>${newMemberName}</strong> (${newMemberEmail}) has joined <strong>${organizationName}</strong> as <strong>${role}</strong>.</p>
            <div style="background:#f0fdf4; border:1px solid #bbf7d0; border-radius:10px; padding:20px; margin:20px 0; text-align:center;">
              <div style="font-size:36px;">👤</div>
              <div style="font-weight:700; font-size:18px; margin-top:8px;">${newMemberName}</div>
              <div style="color:#6b7280;">${newMemberEmail}</div>
              <div style="margin-top:8px; display:inline-block; background:#ede9fe; color:#7c3aed; padding:3px 12px; border-radius:20px; font-size:13px; font-weight:600;">${role}</div>
            </div>
            <div style="text-align:center; margin-top:30px;">
              <a href="${teamPageUrl}" style="background:linear-gradient(135deg,#10b981,#059669); color:white; padding:14px 36px; text-decoration:none; border-radius:8px; font-weight:600;">View Team</a>
            </div>
          </div>
          <div style="background:#f8f9fa; padding:20px; text-align:center; font-size:13px; color:#6c757d; border-top:1px solid #e9ecef;">
            © ${new Date().getFullYear()} DocMetrics. All rights reserved.
          </div>
        </div>
      </body>
      </html>
    `,
  });

  if (error) throw error;
  return { success: true, data };
}


 // ─── Main function to notify inviter when invitee accepts ─────────────────────────────────────────────



export async function notifyInviterOfAcceptance({
  invitedByUserId,       // invitation.invitedBy
  newMemberName,
  newMemberEmail,
  role,
  organizationName,
}: {
  invitedByUserId: string;
  newMemberName: string;
  newMemberEmail: string;
  role: string;
  organizationName: string;
}) {
  const db = await dbPromise;

  // ✅ STEP 1 — get inviter email (check profiles AND users)
  const inviterProfile = await db.collection("profiles").findOne({
    user_id: invitedByUserId,
  });

  let inviterEmail = inviterProfile?.email;
  let inviterName  = inviterProfile?.full_name || "Team Owner";

  if (!inviterEmail) {
    // profiles doesn't always store email — fall back to users collection
    let inviterUser: any = null;
    try {
      inviterUser = await db.collection("users").findOne({
        _id: new ObjectId(invitedByUserId),
      });
    } catch {
      inviterUser = await db.collection("users").findOne({
        id: invitedByUserId,
      });
    }
    inviterEmail = inviterUser?.email;
    if (!inviterName || inviterName === "Team Owner") {
      inviterName =
        inviterUser?.profile?.fullName ||
        inviterUser?.profile?.firstName ||
        "Team Owner";
    }
  }

  if (!inviterEmail) {
    console.error("❌ notifyInviterOfAcceptance: could not resolve inviter email for userId:", invitedByUserId);
    return; // Can't send — don't throw, just log
  }

  const teamPageUrl = `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?tab=team`;
  const html = buildAcceptedEmailHtml({
    inviterName,
    newMemberName,
    newMemberEmail,
    role,
    organizationName,
    teamPageUrl,
  });
  const subject = `🎉 ${newMemberName} accepted your invitation to ${organizationName}`;

  // ✅ STEP 2 — try Gmail first, fall back to Resend
  try {
    const gmailToken = await getValidGmailToken(invitedByUserId);

    const gmailIntegration = await db.collection("integrations").findOne({
      userId: invitedByUserId,
      provider: "gmail",
      isActive: true,
    });
    const senderEmail = gmailIntegration?.metadata?.email || "me";

    const raw = buildGmailRaw({ from: senderEmail, to: inviterEmail, subject, htmlBody: html });

    const gmailRes = await fetch(
      "https://gmail.googleapis.com/gmail/v1/users/me/messages/send",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${gmailToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ raw }),
      }
    );

    if (!gmailRes.ok) throw new Error("Gmail send failed");
    console.log("✅ Acceptance notification sent via Gmail to:", inviterEmail);

  } catch {
    // Fall back to Resend
    try {
      await sendInviteAcceptedNotification({
        inviterEmail,
        inviterName,
        newMemberName,
        newMemberEmail,
        role,
        organizationName,
        teamPageUrl,
      });
      console.log("✅ Acceptance notification sent via Resend to:", inviterEmail);
    } catch (err) {
      console.error("❌ Both Gmail and Resend failed for acceptance notification:", err);
    }
  }
}

// ─── HTML builders (shared) ───────────────────────────────────────────────────

function buildAcceptedEmailHtml({
  inviterName, newMemberName, newMemberEmail, role, organizationName, teamPageUrl,
}: {
  inviterName: string; newMemberName: string; newMemberEmail: string;
  role: string; organizationName: string; teamPageUrl: string;
}) {
  return `
    <!DOCTYPE html><html>
    <body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f5f5f5;margin:0;padding:0;color:#333;">
      <div style="max-width:600px;margin:40px auto;background:white;border-radius:12px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,.1);">
        <div style="background:linear-gradient(135deg,#10b981,#059669);padding:40px 30px;text-align:center;color:white;">
          <div style="font-size:48px;margin-bottom:10px;">🎉</div>
          <h1 style="margin:0;font-size:26px;">Invitation Accepted!</h1>
          <p style="margin:8px 0 0;opacity:.9;">Your team is growing</p>
        </div>
        <div style="padding:40px 30px;">
          <p style="font-size:17px;">Hi <strong>${inviterName}</strong>,</p>
          <p><strong>${newMemberName}</strong> has accepted your invitation and joined <strong>${organizationName}</strong>.</p>
          <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;padding:20px;margin:20px 0;text-align:center;">
            <div style="width:52px;height:52px;border-radius:50%;background:linear-gradient(135deg,#667eea,#764ba2);display:inline-flex;align-items:center;justify-content:center;color:white;font-size:22px;font-weight:700;margin-bottom:10px;">
              ${newMemberName.charAt(0).toUpperCase()}
            </div>
            <div style="font-weight:700;font-size:18px;">${newMemberName}</div>
            <div style="color:#6b7280;font-size:14px;margin-top:2px;">${newMemberEmail}</div>
            <div style="margin-top:8px;">
              <span style="background:#ede9fe;color:#7c3aed;padding:3px 12px;border-radius:20px;font-size:13px;font-weight:600;">
                ✨ ${role.charAt(0).toUpperCase() + role.slice(1)}
              </span>
            </div>
          </div>
          <div style="text-align:center;margin-top:28px;">
            <a href="${teamPageUrl}" style="background:linear-gradient(135deg,#10b981,#059669);color:white;padding:14px 36px;text-decoration:none;border-radius:8px;font-weight:600;font-size:15px;">
              View Team
            </a>
          </div>
        </div>
        <div style="background:#f8f9fa;padding:20px;text-align:center;font-size:13px;color:#6c757d;border-top:1px solid #e9ecef;">
          © ${new Date().getFullYear()} DocMetrics. All rights reserved.
        </div>
      </div>
    </body></html>
  `;
}

function buildGmailRaw({ from, to, subject, htmlBody }:
  { from: string; to: string; subject: string; htmlBody: string }) {
  const raw = `From: ${from}\nTo: ${to}\nSubject: ${subject}\nContent-Type: text/html; charset=utf-8\n\n${htmlBody}`;
  return Buffer.from(raw).toString("base64")
    .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}