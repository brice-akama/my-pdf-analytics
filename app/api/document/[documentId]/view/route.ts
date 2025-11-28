import { NextRequest, NextResponse } from "next/server";
import { dbPromise } from "@/app/api/lib/mongodb";
import { ObjectId } from "mongodb";
import { verifyUserFromRequest } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ documentId: string }> }
) {
  try {
    const user = await verifyUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { documentId } = await params;
    const db = await dbPromise;

    const document = await db.collection("documents").findOne({
      _id: new ObjectId(documentId),
      userId: user.id,
    });

    if (!document) {
      return NextResponse.json(
        { success: false, message: "Document not found" },
        { status: 404 }
      );
    }

    // ALWAYS use signed PDF if available
    const pdfUrl = document.signedPdfUrl || document.cloudinaryPdfUrl;

    if (!pdfUrl) {
      return NextResponse.json(
        { success: false, message: "PDF not available" },
        { status: 404 }
      );
    }

    console.log('👤 Owner viewing:', document.signedPdfUrl ? 'SIGNED PDF' : 'ORIGINAL PDF');

    const pdfResponse = await fetch(pdfUrl);

    if (!pdfResponse.ok) {
      return NextResponse.json(
        { success: false, message: "Failed to fetch PDF" },
        { status: 500 }
      );
    }

    const pdfBuffer = await pdfResponse.arrayBuffer();

    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="${document.originalFilename}"`,
        'Content-Length': pdfBuffer.byteLength.toString(),
      },
    });
  } catch (error) {
    console.error("❌ Error:", error);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}