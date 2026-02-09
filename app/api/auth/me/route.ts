// app/api/auth/me/route.ts
import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { dbPromise } from "@/app/api/lib/mongodb"; // ✅ Fixed import path

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production";

export async function GET(req: NextRequest) {
  try {
    console.log("📍 /api/auth/me called");

    // ✅ FIXED: Check both possible cookie names
    const token = req.cookies.get("auth-token")?.value || req.cookies.get("token")?.value;

    if (!token) {
      console.error("❌ No token in cookies");
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized: No token provided",
          authenticated: false,
        },
        { status: 401 }
      );
    }

    console.log("🔑 Token found in cookie");

    // ✅ Verify JWT
    let decoded: any;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
      console.log("✅ Token verified for user:", decoded.email);
    } catch (jwtError) {
      console.error("❌ JWT verification failed:", jwtError);
      return NextResponse.json(
        {
          success: false,
          error: "Invalid or expired token",
          authenticated: false,
        },
        { status: 401 }
      );
    }

    // ✅ FIXED: Handle both userId formats (string ID vs ObjectId)
    const userId = decoded.userId || decoded.id;
    
    if (!userId) {
      console.error("❌ Token payload missing userId");
      return NextResponse.json(
        {
          success: false,
          error: "Invalid token payload",
          authenticated: false,
        },
        { status: 401 }
      );
    }

    // ✅ Connect to DB
    const db = await dbPromise;
    console.log("📦 DB connected");

    // ✅ FIXED: Try both query methods (ObjectId and string)
    let user;
    try {
      // Try with ObjectId first
      const { ObjectId } = await import("mongodb");
      user = await db.collection("users").findOne(
        { _id: new ObjectId(userId) },
        { projection: { passwordHash: 0, password: 0 } }
      );
    } catch (error) {
      // If ObjectId fails, try with string ID
      console.log("Trying string ID lookup...");
      user = await db.collection("users").findOne(
        { id: userId },
        { projection: { passwordHash: 0, password: 0 } }
      );
    }

    if (!user) {
      console.error("❌ User not found in DB:", userId);
      return NextResponse.json(
        {
          success: false,
          error: "User not found",
          authenticated: false,
        },
        { status: 404 }
      );
    }

    console.log("✅ User found:", user.email);

    // ✅ Get user statistics
    const userIdForQuery = user.id || user._id?.toString();
    
    const [documentCount, signatureCount, shareCount] = await Promise.all([
      db.collection("documents").countDocuments({ userId: userIdForQuery }),
      db.collection("signature_requests").countDocuments({ userId: userIdForQuery }),
      db.collection("shares").countDocuments({ userId: userIdForQuery, active: true }),
    ]).catch(err => {
      console.error("Error fetching stats:", err);
      return [0, 0, 0];
    });

    // ✅ Get storage usage
    const documents = await db.collection("documents")
      .find({ userId: userIdForQuery })
      .project({ size: 1 })
      .toArray()
      .catch(() => []);
    
    const storageUsed = documents.reduce((sum, doc) => sum + (doc.size || 0), 0);

    // ✅ Fetch profile
    const profile = await db.collection("profiles")
      .findOne({ user_id: userIdForQuery })
      .catch(() => null);
    
    console.log("📝 Profile found:", profile ? "Yes" : "No");

    // ✅ Determine user plan
    const userPlan = user.plan || profile?.plan || "free";

    // ✅ Calculate plan limits
    const planLimits = {
      free: {
        documents: 10,
        signatures: 5,
        shares: 10,
        storage: 1 * 1024 * 1024 * 1024, // 1GB
      },
      premium: {
        documents: -1, // unlimited
        signatures: 50,
        shares: 100,
        storage: 10 * 1024 * 1024 * 1024, // 10GB
      },
    };

    const currentPlan = planLimits[userPlan as keyof typeof planLimits] || planLimits.free;
    const storageLimit = currentPlan.storage;

    // ✅ GET ORGANIZATION INFO
const organizationId = profile?.organization_id || userIdForQuery;
const isOwner = organizationId === userIdForQuery;

let organizationName = profile?.company_name || "My CompanyName";
let organizationRole = profile?.role || "owner";

if (!isOwner) {
  // ✅ FETCH OWNER'S COMPANY NAME
  const ownerProfile = await db.collection("profiles").findOne({ 
    user_id: organizationId 
  });
  
  if (ownerProfile) {
    organizationName = ownerProfile.company_name || "Team";
  }
}

// ✅ Format user data
const userData = {
  id: userIdForQuery,
  email: user.email,
  name: user.name || profile?.full_name || profile?.first_name || user.email.split("@")[0],
  plan: userPlan,
  
  // Profile info
  profile: {
    firstName: profile?.first_name || user.profile?.firstName || "",
    lastName: profile?.last_name || user.profile?.lastName || "",
    fullName: profile?.full_name || user.profile?.fullName || 
      `${profile?.first_name || ""} ${profile?.last_name || ""}`.trim() ||
      user.name || user.email.split("@")[0],
    companyName: organizationName, // ✅ OWNER'S COMPANY NAME
    avatarUrl: profile?.avatarUrl || profile?.avatar_url || user.profile?.avatarUrl || "",
  },
  
  // ✅ ADD ORGANIZATION INFO
  organization: {
    id: organizationId,
    name: organizationName,
    role: organizationRole,
    isOwner: isOwner,
  },

      // Statistics
      stats: {
        documents: documentCount,
        signatures: signatureCount,
        shares: shareCount,
        storageUsed: formatBytes(storageUsed),
        storageUsedBytes: storageUsed,
      },

      // Usage limits
      usage: {
        documents: {
          used: documentCount,
          limit: currentPlan.documents,
          percentage: currentPlan.documents === -1 ? 0 : Math.round((documentCount / currentPlan.documents) * 100),
          unlimited: currentPlan.documents === -1,
        },
        signatures: {
          used: signatureCount,
          limit: currentPlan.signatures,
          percentage: Math.round((signatureCount / currentPlan.signatures) * 100),
        },
        shares: {
          used: shareCount,
          limit: currentPlan.shares,
          percentage: Math.round((shareCount / currentPlan.shares) * 100),
        },
        storage: {
          used: storageUsed,
          limit: storageLimit,
          percentage: Math.round((storageUsed / storageLimit) * 100),
          usedFormatted: formatBytes(storageUsed),
          limitFormatted: formatBytes(storageLimit),
        },
      },

      // Features based on plan
      features: {
        aiSuggestions: userPlan === "premium",
        advancedAnalytics: userPlan === "premium",
        customBranding: userPlan === "premium",
        prioritySupport: userPlan === "premium",
        passwordProtection: userPlan === "premium",
        emailWhitelist: userPlan === "premium",
      },

      // Account status
      provider: user.provider || "local",
      emailVerified: user.email_verified || user.emailVerified || false,
      createdAt: user.created_at || user.createdAt || profile?.created_at,
      lastLogin: user.lastLogin || new Date(),
    };

    console.log("✅ Returning user data");
    return NextResponse.json({ 
      success: true, 
      authenticated: true,
      user: userData 
    }, { status: 200 });

  } catch (error: any) {
    console.error("❌ Error in /api/auth/me:", error);
    return NextResponse.json(
      {
        success: false,
        authenticated: false,
        error: "Internal server error",
        details: process.env.NODE_ENV === "development" ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}

// ✅ PATCH - Update user profile
export async function PATCH(req: NextRequest) {
  try {
    const token = req.cookies.get("auth-token")?.value || req.cookies.get("token")?.value;
    
    if (!token) {
      return NextResponse.json({ 
        error: "Unauthorized" 
      }, { status: 401 });
    }

    const decoded: any = jwt.verify(token, JWT_SECRET);
    const userId = decoded.userId || decoded.id;

    const body = await req.json();
    const { name, profile } = body;

    const db = await dbPromise;

    const updateFields: any = {
      updatedAt: new Date(),
    };

    if (name !== undefined) updateFields.name = name;
    if (profile !== undefined) updateFields.profile = profile;

    // Try both ID formats
    let result;
    try {
      const { ObjectId } = await import("mongodb");
      result = await db.collection("users").updateOne(
        { _id: new ObjectId(userId) },
        { $set: updateFields }
      );
    } catch {
      result = await db.collection("users").updateOne(
        { id: userId },
        { $set: updateFields }
      );
    }

    if (result.matchedCount === 0) {
      return NextResponse.json({ 
        error: "User not found" 
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: "Profile updated successfully",
    });

  } catch (error: any) {
    console.error("❌ Update user error:", error);
    return NextResponse.json({
      error: "Failed to update profile",
      details: error.message,
    }, { status: 500 });
  }
}

// Helper function
function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
}