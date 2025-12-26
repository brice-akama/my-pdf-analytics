// app/api/envelope/[uniqueId]/file/route.ts
import { NextRequest, NextResponse } from "next/server";
import { dbPromise } from "@/app/api/lib/mongodb";
import cloudinary from 'cloudinary';

cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_SECRET_KEY,
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ uniqueId: string }> }
) {
  try {
    const { uniqueId } = await params; // ✅ This is the recipient's uniqueId
    const { searchParams } = new URL(request.url);
    const documentId = searchParams.get('documentId');

    console.log('🔍 Fetching file for recipient:', uniqueId, 'documentId:', documentId);

    const db = await dbPromise;

    // ✅ Query by recipient's uniqueId (not envelope uniqueId)
    const envelope = await db.collection("envelopes").findOne({
      "recipients.uniqueId": uniqueId,
    });

    if (!envelope) {
      console.error('❌ Envelope not found for recipient:', uniqueId);
      return NextResponse.json(
        { success: false, message: "Envelope not found" },
        { status: 404 }
      );
    }

    console.log('✅ Found envelope:', envelope.envelopeId);

    // Find the document in the envelope
    const document = envelope.documents.find((doc: any) => 
      doc.documentId.toString() === documentId
    );

    if (!document) {
      console.error('❌ Document not found:', documentId);
      return NextResponse.json(
        { success: false, message: "Document not found in envelope" },
        { status: 404 }
      );
    }

    // Get the full document details from documents collection
    const { ObjectId } = require('mongodb');
    const fullDocument = await db.collection("documents").findOne({
      _id: new ObjectId(documentId)
    });

    if (!fullDocument || !fullDocument.cloudinaryPdfUrl) {
      console.error('❌ PDF not available for document:', documentId);
      return NextResponse.json(
        { success: false, message: "PDF file not available" },
        { status: 404 }
      );
    }

    console.log('📄 Found document:', fullDocument.filename);

    // Extract public_id from Cloudinary URL
    const fileUrl = fullDocument.cloudinaryPdfUrl;
    const urlParts = fileUrl.split('/upload/');
    const afterUpload = urlParts[1];
    const pathParts = afterUpload.split('/');
    pathParts.shift(); // remove version
    let publicId = pathParts.join('/').replace('.pdf', '');
    publicId = decodeURIComponent(publicId);

    console.log('📝 Public ID:', publicId);

    // Generate authenticated download URL
    const downloadUrl = cloudinary.v2.utils.private_download_url(
      publicId,
      'pdf',
      {
        resource_type: 'image',
        type: 'upload',
        attachment: false,
        expires_at: Math.floor(Date.now() / 1000) + 3600,
      }
    );

    console.log('🔐 Generated private download URL');

    // Fetch from Cloudinary
    const cloudinaryResponse = await fetch(downloadUrl);

    console.log('📡 Cloudinary response status:', cloudinaryResponse.status);

    if (!cloudinaryResponse.ok) {
      console.error('❌ Cloudinary fetch failed');
      return NextResponse.json({
        error: 'Failed to fetch file from Cloudinary',
        status: cloudinaryResponse.status,
      }, { status: 500 });
    }

    const arrayBuffer = await cloudinaryResponse.arrayBuffer();
    console.log('✅ File fetched:', arrayBuffer.byteLength, 'bytes');

    // Log the view
    db.collection('envelope_views').insertOne({
      envelopeId: envelope.envelopeId,
      recipientUniqueId: uniqueId,
      documentId: documentId,
      timestamp: new Date(),
      userAgent: request.headers.get('user-agent'),
      ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
    }).catch(err => console.error('Failed to log view:', err));

    // Return PDF
    return new NextResponse(arrayBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="${fullDocument.filename}"`,
        'Content-Length': arrayBuffer.byteLength.toString(),
        'Cache-Control': 'private, max-age=3600',
        'Access-Control-Allow-Origin': '*',
      },
    });

  } catch (error) {
    console.error('❌ Error fetching file:', error);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}