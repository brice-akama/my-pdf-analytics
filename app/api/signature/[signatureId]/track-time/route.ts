import { NextRequest, NextResponse } from "next/server";
import { dbPromise } from "../../../lib/mongodb";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ signatureId: string }> }
) {
  try {
    const { signatureId } = await params;
    const { page, timeSpent } = await request.json();
    
    const db = await dbPromise;
    
    await db.collection("signature_time_tracking").insertOne({
      signatureId,
      page,
      timeSpent,
      timestamp: new Date(),
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false }, { status: 500 });
  }
}