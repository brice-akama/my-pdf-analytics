import { NextRequest, NextResponse } from "next/server";
import { dbPromise } from "../../lib/mongodb";
import { ObjectId } from "mongodb";
import { cookies } from "next/headers";

export async function GET(request: NextRequest) {
  try {
    // Get user session
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('session')?.value;
    
    if (!sessionToken) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const db = await dbPromise;

    // Get current user
    const session = await db.collection('sessions').findOne({ token: sessionToken });
    if (!session) {
      return NextResponse.json(
        { success: false, message: "Invalid session" },
        { status: 401 }
      );
    }

    const userId = session.userId;

    // Get all signature requests where user is the owner
    const requests = await db.collection("signature_requests")
      .find({ ownerId: userId })
      .sort({ createdAt: -1 })
      .toArray();

    // Group by document
    const groupedByDocument: { [key: string]: any } = {};

    for (const request of requests) {
      const docId = request.documentId;
      
      if (!groupedByDocument[docId]) {
        // Get document details
        const document = await db.collection("documents").findOne({
          _id: new ObjectId(docId),
        });

        groupedByDocument[docId] = {
          documentId: docId,
          documentName: document?.filename || 'Unknown Document',
          status: document?.status || 'pending',
          createdAt: request.createdAt,
          recipients: [],
        };
      }

      groupedByDocument[docId].recipients.push({
        name: request.recipient.name,
        email: request.recipient.email,
        status: request.status,
        signedAt: request.signedAt,
        uniqueId: request.uniqueId,
      });
    }

    // Convert to array
    const signatureRequests = Object.values(groupedByDocument);

    return NextResponse.json({
      success: true,
      signatureRequests,
      total: signatureRequests.length,
    });
  } catch (error) {
    console.error("❌ Error fetching signature requests:", error);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}