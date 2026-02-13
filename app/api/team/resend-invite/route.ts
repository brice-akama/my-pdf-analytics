// app/api/team/resend-invite/route.ts
import { NextRequest, NextResponse } from "next/server";
import { dbPromise } from "@/app/api/lib/mongodb";
import jwt from "jsonwebtoken";
import { ObjectId } from "mongodb";
import { sendTeamInviteEmail } from "@/lib/emails/teamEmails";
import { getValidGmailToken } from "@/lib/integrations/gmail";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get("auth-token")?.value || request.cookies.get("token")?.value;
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded: any = jwt.verify(token, JWT_SECRET);
    const userId = decoded.userId || decoded.id;

    const body = await request.json();
    const { memberId } = body;

    const db = await dbPromise;

    const member = await db.collection("organization_members").findOne({
      _id: new ObjectId(memberId),
    });

    if (!member || member.status !== "invited") {
      return NextResponse.json({ error: "Invalid member" }, { status: 404 });
    }

    // Refresh expiry
    await db.collection("organization_members").updateOne(
      { _id: new ObjectId(memberId) },
      {
        $set: {
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          invitedAt: new Date(),
        },
      }
    );

    const inviteLink = `${process.env.NEXT_PUBLIC_APP_URL}/invite-team/${member.inviteToken}`;

    // Get inviter info
    const inviterProfile = await db.collection("profiles").findOne({ user_id: userId });
    const inviterName = inviterProfile?.full_name || "A team member";
    const companyName = inviterProfile?.company_name || "DocMetrics";
    const role = member.role || "member";

    // ✅ SAME GMAIL → RESEND FALLBACK LOGIC
    let emailSent = false;
    let emailMethod = "resend";

    try {
      const gmailToken = await getValidGmailToken(userId);
      const gmailIntegration = await db.collection("integrations").findOne({
        userId,
        provider: "gmail",
        isActive: true,
      });

      const senderEmail = gmailIntegration?.metadata?.email || "me";

      const htmlBody = buildResendInviteHtml({ inviterName, companyName, role, inviteLink });
      const raw = buildGmailRaw({
        from: senderEmail,
        to: member.email,
        subject: `Reminder: ${inviterName} invited you to join ${companyName} on DocMetrics`,
        htmlBody,
      });

      const gmailResponse = await fetch(
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

      if (gmailResponse.ok) {
        emailSent = true;
        emailMethod = "gmail";
      } else {
        throw new Error("Gmail send failed");
      }
    } catch {
      try {
        await sendTeamInviteEmail({
          recipientEmail: member.email,
          inviterName,
          companyName,
          role,
          inviteLink,
        });
        emailSent = true;
        emailMethod = "resend";
      } catch (err) {
        console.error("❌ Both Gmail and Resend failed on resend-invite:", err);
      }
    }

    return NextResponse.json({
      success: true,
      message: emailSent ? `Invitation resent via ${emailMethod}` : "Invite refreshed (email failed)",
      inviteLink,
      emailSent,
      emailMethod,
    });
  } catch (error: any) {
    console.error("Resend invite error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// ─── same helpers ─────────────────────────────────────────────────────────────

function buildResendInviteHtml({
  inviterName,
  companyName,
  role,
  inviteLink,
}: {
  inviterName: string;
  companyName: string;
  role: string;
  inviteLink: string;
}) {
  return `
    <!DOCTYPE html><html><body style="font-family:sans-serif; color:#333;">
      <div style="max-width:600px; margin:40px auto; background:white; border-radius:12px; overflow:hidden; box-shadow:0 4px 6px rgba(0,0,0,.1);">
        <div style="background:linear-gradient(135deg,#667eea,#764ba2); padding:40px 30px; text-align:center; color:white;">
          <h1 style="margin:0;">⏰ Reminder: You're Invited!</h1>
        </div>
        <div style="padding:40px 30px;">
          <p><strong>${inviterName}</strong> is still waiting for you to join <strong>${companyName}</strong> on DocMetrics as <strong>${role}</strong>.</p>
          <div style="text-align:center; margin:30px 0;">
            <a href="${inviteLink}" style="background:linear-gradient(135deg,#667eea,#764ba2); color:white; padding:16px 40px; text-decoration:none; border-radius:8px; font-weight:600; font-size:16px;">
              Accept Invitation
            </a>
          </div>
          <p style="font-size:13px; color:#6b7280;">⏰ This invitation expires in <strong>7 days</strong>.</p>
          <p style="font-size:13px; color:#6b7280;">Link: <a href="${inviteLink}" style="color:#667eea;">${inviteLink}</a></p>
        </div>
        <div style="background:#f8f9fa; padding:20px; text-align:center; font-size:13px; color:#6c757d; border-top:1px solid #e9ecef;">
          © ${new Date().getFullYear()} DocMetrics. All rights reserved.
        </div>
      </div>
    </body></html>
  `;
}

function buildGmailRaw({
  from, to, subject, htmlBody,
}: { from: string; to: string; subject: string; htmlBody: string }) {
  const raw = `From: ${from}\nTo: ${to}\nSubject: ${subject}\nContent-Type: text/html; charset=utf-8\n\n${htmlBody}`;
  return Buffer.from(raw).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}