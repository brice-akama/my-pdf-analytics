// app/api/team/route.ts
import { NextRequest, NextResponse } from "next/server";
import { dbPromise } from "@/app/api/lib/mongodb";
import jwt from "jsonwebtoken";
import { sendTeamInviteEmail } from "@/lib/emails/teamEmails"; 
import { getValidGmailToken } from "@/lib/integrations/gmail";
import { checkAccess } from "@/lib/checkAccess";
  

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

async function verifyUser(request: NextRequest) {
  const token = request.cookies.get("auth-token")?.value || request.cookies.get("token")?.value;
  if (!token) return null;
  
  try {
    const decoded: any = jwt.verify(token, JWT_SECRET);
    return { id: decoded.userId || decoded.id, email: decoded.email };
  } catch {
    return null;
  }
}

// GET - Fetch team members
export async function GET(request: NextRequest) {
  try {
    const access = await checkAccess(request)
    if (!access.ok) return access.response

    const db = await dbPromise

    const profile = await db.collection("profiles").findOne({
      user_id: access.userId,
    })

    const organizationId = profile?.organization_id || access.userId

    const members = await db
      .collection("organization_members")
      .find({ organizationId })
      .sort({ joinedAt: -1 })
      .toArray()

    const ownerProfile = await db
      .collection("profiles")
      .findOne({ user_id: organizationId })

    const ownerMember = {
      id: "owner",
      userId: organizationId,
      email: ownerProfile?.email || "",
      name: ownerProfile?.full_name || "Owner",
      role: "owner",
      status: "active",
      joinedAt: ownerProfile?.created_at || new Date(),
      lastActiveAt: new Date(),
      avatarUrl: ownerProfile?.avatar_url || null,
    }

    const enrichedMembers = await Promise.all(
      members.map(async (member) => {
        const memberProfile = await db
          .collection("profiles")
          .findOne({ user_id: member.userId })
        return {
          id: member._id.toString(),
          userId: member.userId,
          email: memberProfile?.email || member.email,
          name: memberProfile?.full_name || member.email.split("@")[0],
          role: member.role,
          status: member.status,
          invitedAt: member.invitedAt,
          joinedAt: member.joinedAt,
          lastActiveAt: member.lastActiveAt,
          avatarUrl: memberProfile?.avatar_url || null,
        }
      })
    )

    const allMembers = [ownerMember, ...enrichedMembers]

    return NextResponse.json({
      success: true,
      members: allMembers,
      organization: {
        id: organizationId,
        name: ownerProfile?.company_name || "Team",
      },
      // expose to frontend so TeamDrawer knows if current user is owner
      currentUserIsOwner: organizationId === access.userId,
      seatLimit: access.limits.maxTeamMembers,   
    })
  } catch (error: any) {
    console.error("GET team error:", error)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}
 

// POST - Invite a new team member

export async function POST(request: NextRequest) {
  try {
    const access = await checkAccess(request)
    if (!access.ok) return access.response

    const db = await dbPromise

    const inviterProfile = await db.collection("profiles").findOne({
      user_id: access.userId,
    })
    const organizationId = inviterProfile?.organization_id || access.userId

    // ── Role guard: only owner or admin can invite ────────────────────────
    const isOwner = organizationId === access.userId
    const currentUserMember = await db
      .collection("organization_members")
      .findOne({ organizationId, userId: access.userId })
    const isAdmin = currentUserMember?.role === "admin"

    if (!isOwner && !isAdmin) {
      return NextResponse.json(
        { error: "Only the account owner or admins can invite team members." },
        { status: 403 }
      )
    }

    // ── Plan limit: maxTeamMembers ────────────────────────────────────────
    const { limits, plan } = access
    if (limits.maxTeamMembers !== -1) {
      // count owner (1) + all active/invited members
      const currentCount = await db
        .collection("organization_members")
        .countDocuments({ organizationId })
      // +1 for the owner who is not in organization_members
      const totalSeats = currentCount + 1

      if (totalSeats >= limits.maxTeamMembers) {
        return NextResponse.json(
          {
            error: "TEAM_LIMIT_REACHED",
            limit: limits.maxTeamMembers,
            plan,
          },
          { status: 403 }
        )
      }
    }

    const body = await request.json()
    const { email, role = "member" } = body

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Invalid email" }, { status: 400 })
    }

    const existing = await db.collection("organization_members").findOne({
      organizationId,
      email: email.toLowerCase(),
    })

    if (existing) {
      return NextResponse.json(
        {
          error:
            existing.status === "active"
              ? "User is already a team member"
              : "Invitation already sent",
        },
        { status: 409 }
      )
    }

    const inviteToken =
      Math.random().toString(36).substring(2) + Date.now().toString(36)
    const now = new Date()

    const memberDoc = {
      organizationId,
      email: email.toLowerCase(),
      role,
      status: "invited",
      invitedBy: access.userId,
      inviteToken,
      invitedAt: now,
      expiresAt: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
    }

    const result = await db
      .collection("organization_members")
      .insertOne(memberDoc)
    const inviteLink = `${process.env.NEXT_PUBLIC_APP_URL}/invite-team/${inviteToken}`

    const inviterName =
      inviterProfile?.full_name || access.user.email || "A team member"
    const companyName = inviterProfile?.company_name || "DocMetrics"

    let emailSent = false
    let emailMethod = "resend"

    try {
      const gmailToken = await getValidGmailToken(access.userId)
      const gmailIntegration = await db.collection("integrations").findOne({
        userId: access.userId,
        provider: "gmail",
        isActive: true,
      })

      const senderEmail = gmailIntegration?.metadata?.email || "me"
      const emailContent = buildInviteEmailContent({
        recipientEmail: email,
        inviterName,
        companyName,
        role,
        inviteLink,
      })
      const encodedEmail = buildGmailRaw({
        from: senderEmail,
        to: email,
        subject: `${inviterName} invited you to join ${companyName} on DocMetrics`,
        htmlBody: emailContent,
      })

      const gmailResponse = await fetch(
        "https://gmail.googleapis.com/gmail/v1/users/me/messages/send",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${gmailToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ raw: encodedEmail }),
        }
      )

      if (gmailResponse.ok) {
        emailSent = true
        emailMethod = "gmail"
      } else {
        throw new Error("Gmail send failed")
      }
    } catch {
      try {
        await sendTeamInviteEmail({
          recipientEmail: email,
          inviterName,
          companyName,
          role,
          inviteLink,
        })
        emailSent = true
        emailMethod = "resend"
      } catch (resendError) {
        console.error("Resend also failed:", resendError)
      }
    }

    return NextResponse.json({
      success: true,
      message: emailSent
        ? `Invitation sent via ${emailMethod}`
        : "Invitation created (email delivery failed)",
      inviteId: result.insertedId.toString(),
      inviteLink,
      emailSent,
      emailMethod,
    })
  } catch (error: any) {
    console.error("POST team error:", error)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}

// ─── helpers (add at bottom of the file) ──────────────────────────────────────

function buildInviteEmailContent({
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
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; background: #f5f5f5; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 40px auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center; color: white; }
        .content { padding: 40px 30px; }
        .role-badge { display: inline-block; background: #ede9fe; color: #7c3aed; padding: 4px 12px; border-radius: 20px; font-size: 13px; font-weight: 600; margin: 10px 0; }
        .cta-button { display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 16px 40px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; margin: 20px 0; }
        .info-box { background: #f0f9ff; border-left: 4px solid #3b82f6; padding: 15px 20px; border-radius: 4px; margin: 20px 0; }
        .footer { background: #f8f9fa; padding: 25px; text-align: center; font-size: 13px; color: #6c757d; border-top: 1px solid #e9ecef; }
        .expiry-note { font-size: 13px; color: #6b7280; margin-top: 15px; }
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
          <p class="expiry-note">⏰ This invitation expires in <strong>7 days</strong>. If you didn't expect this, you can safely ignore this email.</p>
          <p style="margin-top:30px; font-size:13px; color:#6b7280;">
            Or copy and paste this link:<br/>
            <a href="${inviteLink}" style="color:#667eea; word-break:break-all;">${inviteLink}</a>
          </p>
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
  from,
  to,
  subject,
  htmlBody,
}: {
  from: string;
  to: string;
  subject: string;
  htmlBody: string;
}) {
  const emailContent = `From: ${from}
To: ${to}
Subject: ${subject}
Content-Type: text/html; charset=utf-8

${htmlBody}`;

  return Buffer.from(emailContent)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}