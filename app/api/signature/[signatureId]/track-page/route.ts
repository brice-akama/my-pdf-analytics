// app/api/signature/[signatureId]/track-page/route.ts

import { NextRequest, NextResponse } from "next/server";
import { dbPromise } from "@/app/api/lib/mongodb";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ signatureId: string }> }
) {
  try {
    const { signatureId } = await params;
    const { page, action, timestamp } = await request.json();
    
    const db = await dbPromise;

    // Log page tracking event
    await db.collection("signature_page_tracking").insertOne({
      signatureId,
      page: parseInt(page),
      action, // 'view', 'scroll', 'exit'
      timestamp: new Date(timestamp),
      userAgent: request.headers.get('user-agent'),
      ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
      createdAt: new Date(),
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("❌ Error tracking page:", error);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}