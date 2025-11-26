import { NextRequest, NextResponse } from "next/server";
import { dbPromise } from "../../../lib/mongodb";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ signatureId: string }> }
) {
  try {
    const { signatureId } = await params;
    const { page, timestamp, userAgent } = await request.json();
    
    const db = await dbPromise;
    
    await db.collection("signature_views").insertOne({
      signatureId,
      page,
      timestamp: new Date(timestamp),
      userAgent,
      ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
    });
    
    // Update viewed status
    await db.collection("signature_requests").updateOne(
      { uniqueId: signatureId, status: 'pending' },
      { $set: { status: 'viewed', viewedAt: new Date() } }
    );
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Track view error:', error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}