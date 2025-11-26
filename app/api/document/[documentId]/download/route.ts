import { NextRequest, NextResponse } from "next/server";
import { dbPromise } from "../../../lib/mongodb";
import { ObjectId } from "mongodb";
import cloudinary from 'cloudinary';

cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_SECRET_KEY,
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ documentId: string }> }
) {
  try {
    const { documentId } = await params;
    
    console.log('📥 Uploader download request for document:', documentId);
    
    const db = await dbPromise;

    const document = await db.collection("documents").findOne({
      _id: new ObjectId(documentId),
    });

    if (!document) {
      return NextResponse.json(
        { success: false, message: "Document not found" },
        { status: 404 }
      );
    }

    if (!document.signedPdfUrl) {
      return NextResponse.json(
        { 
          success: false, 
          message: "Signed document not yet available." 
        },
        { status: 400 }
      );
    }

    // Clean URL
    const cleanUrl = document.signedPdfUrl.replace(/\s+/g, '');
    console.log('✅ Fetching signed PDF from:', cleanUrl);

    const pdfResponse = await fetch(cleanUrl);

    if (!pdfResponse.ok) {
      console.error('❌ Failed:', pdfResponse.status);
      return NextResponse.json(
        { success: false, message: "Failed to retrieve signed document" },
        { status: 500 }
      );
    }

    const pdfBuffer = await pdfResponse.arrayBuffer();
    console.log('✅ Downloaded:', pdfBuffer.byteLength, 'bytes');

    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="signed_${document.filename}"`,
        'Content-Length': pdfBuffer.byteLength.toString(),
      },
    });
  } catch (error) {
    console.error('❌ Error:', error);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}