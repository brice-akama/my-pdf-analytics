// app/api/team/route.ts
import { NextRequest, NextResponse } from "next/server";
import { dbPromise } from "@/app/api/lib/mongodb";
import jwt from "jsonwebtoken";
  

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
    const user = await verifyUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = await dbPromise;
    
    // ✅ GET USER'S ORGANIZATION
    const profile = await db.collection("profiles").findOne({ 
      user_id: user.id 
    });
    
    const organizationId = profile?.organization_id || user.id;

    console.log("👥 Fetching team for organization:", organizationId);

    // ✅ GET ALL MEMBERS INCLUDING OWNER
    const members = await db.collection("organization_members")
      .find({ organizationId })
      .sort({ joinedAt: -1 })
      .toArray();

    // ✅ ADD THE OWNER AS A MEMBER (if not already listed)
    const ownerProfile = await db.collection("profiles").findOne({ 
      user_id: organizationId 
    });

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
    };

    // Enrich with user profiles
    const enrichedMembers = await Promise.all(
      members.map(async (member) => {
        const memberProfile = await db.collection("profiles").findOne({ 
          user_id: member.userId 
        });
        
        return {
          id: member._id.toString(),
          userId: member.userId,
           email: memberProfile?.email || member.email, 
          name: memberProfile?.full_name || member.email.split('@')[0],
          role: member.role,
          status: member.status,
          invitedAt: member.invitedAt,
          joinedAt: member.joinedAt,
          lastActiveAt: member.lastActiveAt,
          avatarUrl: memberProfile?.avatar_url || null,
        };
      })
    );

    // ✅ COMBINE OWNER + MEMBERS
    const allMembers = [ownerMember, ...enrichedMembers];

    console.log(`✅ Found ${allMembers.length} team members`);

    return NextResponse.json({
      success: true,
      members: allMembers,
      organization: {
        id: organizationId,
        name: ownerProfile?.company_name || "Team",
      },
    });
  } catch (error: any) {
    console.error("GET team error:", error);
    return NextResponse.json({ 
      error: "Server error", 
      details: error.message 
    }, { status: 500 });
  }
}

// POST - Invite team member
export async function POST(request: NextRequest) {
  try {
    const user = await verifyUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { email, role = "member" } = body;

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Invalid email" }, { status: 400 });
    }

    const db = await dbPromise;
    
    // Get inviter's profile
    const inviterProfile = await db.collection("profiles").findOne({ 
      user_id: user.id 
    });
    const organizationId = inviterProfile?.organization_id || user.id;

    // Check if already exists
    const existing = await db.collection("organization_members").findOne({
      organizationId,
      email: email.toLowerCase(),
    });

    if (existing) {
      return NextResponse.json({ 
        error: existing.status === "active" 
          ? "User is already a team member" 
          : "Invitation already sent" 
      }, { status: 409 });
    }

    // Create invitation
    const inviteToken = Math.random().toString(36).substring(2) + Date.now().toString(36);
    const now = new Date();
    
    const memberDoc = {
      organizationId,
      email: email.toLowerCase(),
      role,
      status: "invited",
      invitedBy: user.id,
      inviteToken,
      invitedAt: now,
      expiresAt: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000), // 7 days
    };

    const result = await db.collection("organization_members").insertOne(memberDoc);

    // Create invite link
    const inviteLink = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/invite-team/${inviteToken}`;

    // Send email (you'll implement this)
    // await sendInviteEmail(email, inviteLink, inviterProfile?.full_name);

    return NextResponse.json({
      success: true,
      message: "Invitation sent",
      inviteId: result.insertedId.toString(),
      inviteLink, // Return for manual sharing
    });
  } catch (error: any) {
    console.error("POST team error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}