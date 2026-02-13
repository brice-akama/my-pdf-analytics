// app/api/invite/complete/route.ts
import { NextRequest, NextResponse } from "next/server";
import { dbPromise } from "@/app/api/lib/mongodb";
import { ObjectId } from "mongodb";
import { sendInviteAcceptedNotification } from "@/lib/emails/teamEmails";
import { getValidGmailToken } from "@/lib/integrations/gmail";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token: inviteToken, userId } = body;

    if (!inviteToken || !userId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const db = await dbPromise;

    const invitation = await db.collection("organization_members").findOne({
      inviteToken,
      status: "invited",
    });

    if (!invitation) {
      return NextResponse.json({ error: "Invalid invitation" }, { status: 404 });
    }

    if (new Date() > new Date(invitation.expiresAt)) {
      return NextResponse.json({ error: "Invitation expired" }, { status: 410 });
    }

    let user;
    try {
      user = await db.collection("users").findOne({ _id: new ObjectId(userId) });
    } catch {
      user = await db.collection("users").findOne({ id: userId });
    }

    if (!user || user.email.toLowerCase() !== invitation.email.toLowerCase()) {
      return NextResponse.json({ error: "Email mismatch" }, { status: 403 });
    }

    const inviter = await db.collection("profiles").findOne({
      user_id: invitation.invitedBy,
    });

    const organizationId = invitation.organizationId;
    const organizationName = inviter?.company_name || "Team";
    const newMemberName = user.profile?.fullName || user.email.split("@")[0];
    const newMemberEmail = user.email;
    const role = invitation.role || "member";

    // Update invitation to active
    await db.collection("organization_members").updateOne(
      { _id: invitation._id },
      {
        $set: {
          userId,
          status: "active",
          joinedAt: new Date(),
          lastActiveAt: new Date(),
        },
        $unset: { inviteToken: "", expiresAt: "" },
      }
    );

    // Update new member's profile
    await db.collection("profiles").updateOne(
      { user_id: userId },
      {
        $set: {
          organization_id: organizationId,
          company_name: organizationName,
          updated_at: new Date(),
        },
      },
      { upsert: true }
    );

    // Update user document
    try {
      await db.collection("users").updateOne(
        { _id: new ObjectId(userId) },
        { $set: { "profile.companyName": organizationName, updated_at: new Date() } }
      );
    } catch {
      await db.collection("users").updateOne(
        { id: userId },
        { $set: { "profile.companyName": organizationName, updated_at: new Date() } }
      );
    }

    // ✅ NOTIFY INVITER - Gmail first, Resend fallback
    if (inviter?.email || inviter?.user_id) {
      let inviterEmail = inviter.email;
      const inviterUser = await db.collection("users").findOne({ user_id: inviter.user_id });
        const inviterEmailFromUser = inviterUser?.email;
        if (inviterEmailFromUser) {
          inviterEmail = inviterEmailFromUser;
          
        }
      const inviterName = inviter.full_name || "Team Owner";
      const teamPageUrl = `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?tab=team`;

      try {
        // Try Gmail first (inviter's connected Gmail)
        const gmailToken = await getValidGmailToken(invitation.invitedBy);
        const gmailIntegration = await db.collection("integrations").findOne({
          userId: invitation.invitedBy,
          provider: "gmail",
          isActive: true,
        });

        const senderEmail = gmailIntegration?.metadata?.email || "me";
        const html = buildAcceptedEmailHtml({
          inviterName,
          newMemberName,
          newMemberEmail,
          role,
          organizationName,
          teamPageUrl,
        });

        const raw = buildGmailRaw({
          from: senderEmail,
          to: inviterEmail,
          subject: `🎉 ${newMemberName} accepted your invitation to ${organizationName}`,
          htmlBody: html,
        });

        await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${gmailToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ raw }),
        });

        console.log("✅ Acceptance notification sent via Gmail to inviter");
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
          console.log("✅ Acceptance notification sent via Resend to inviter");
        } catch (err) {
          // Don't block — member already joined successfully
          console.error("❌ Failed to notify inviter:", err);
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: "Successfully joined team",
      organization: {
        id: organizationId,
        name: organizationName,
      },
    });
  } catch (error: any) {
    console.error("Complete invite error:", error);
    return NextResponse.json({ error: "Server error", details: error.message }, { status: 500 });
  }
}

// ─── helpers ──────────────────────────────────────────────────────────────────

function buildAcceptedEmailHtml({
  inviterName,
  newMemberName,
  newMemberEmail,
  role,
  organizationName,
  teamPageUrl,
}: {
  inviterName: string;
  newMemberName: string;
  newMemberEmail: string;
  role: string;
  organizationName: string;
  teamPageUrl: string;
}) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background:#f5f5f5; margin:0; padding:0; color:#333; }
        .container { max-width:600px; margin:40px auto; background:white; border-radius:12px; overflow:hidden; box-shadow:0 4px 6px rgba(0,0,0,.1); }
        .header { background:linear-gradient(135deg,#10b981,#059669); padding:40px 30px; text-align:center; color:white; }
        .content { padding:40px 30px; }
        .member-card { background:#f0fdf4; border:1px solid #bbf7d0; border-radius:10px; padding:20px; margin:20px 0; display:flex; align-items:center; gap:15px; }
        .avatar { width:48px; height:48px; border-radius:50%; background:linear-gradient(135deg,#667eea,#764ba2); display:flex; align-items:center; justify-content:center; color:white; font-size:20px; font-weight:700; flex-shrink:0; }
        .role-badge { display:inline-block; background:#ede9fe; color:#7c3aed; padding:3px 10px; border-radius:20px; font-size:12px; font-weight:600; }
        .cta-button { display:inline-block; background:linear-gradient(135deg,#10b981,#059669); color:white; padding:14px 36px; text-decoration:none; border-radius:8px; font-weight:600; font-size:15px; margin:20px 0; }
        .footer { background:#f8f9fa; padding:20px; text-align:center; font-size:13px; color:#6c757d; border-top:1px solid #e9ecef; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div style="font-size:48px; margin-bottom:10px;">🎉</div>
          <h1 style="margin:0; font-size:26px;">Invitation Accepted!</h1>
          <p style="margin:8px 0 0; opacity:.9;">Your team is growing</p>
        </div>
        <div class="content">
          <p style="font-size:17px;">Hi <strong>${inviterName}</strong>,</p>
          <p>Great news! <strong>${newMemberName}</strong> has accepted your invitation and joined <strong>${organizationName}</strong>.</p>

          <div class="member-card">
            <div class="avatar">${newMemberName.charAt(0).toUpperCase()}</div>
            <div>
              <div style="font-weight:600; font-size:16px;">${newMemberName}</div>
              <div style="color:#6b7280; font-size:14px;">${newMemberEmail}</div>
              <div style="margin-top:5px;"><span class="role-badge">✨ ${role.charAt(0).toUpperCase() + role.slice(1)}</span></div>
            </div>
          </div>

          <p>They now have access to <strong>${organizationName}</strong>'s workspace on DocMetrics. Head to your team page to manage their permissions anytime.</p>

          <div style="text-align:center;">
            <a href="${teamPageUrl}" class="cta-button">View Team</a>
          </div>
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} DocMetrics. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

function buildGmailRaw({
  from, to, subject, htmlBody,
}: { from: string; to: string; subject: string; htmlBody: string }) {
  const raw = `From: ${from}\nTo: ${to}\nSubject: ${subject}\nContent-Type: text/html; charset=utf-8\n\n${htmlBody}`;
  return Buffer.from(raw).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}