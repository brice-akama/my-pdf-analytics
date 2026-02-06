// app/api/documents/[id]/download/route.ts
import { NextRequest, NextResponse } from "next/server";
import { dbPromise } from "../../../lib/mongodb";
import { verifyUserFromRequest } from "@/lib/auth";
import { notifyDocumentDownload } from "@/lib/notifications";
import { ObjectId } from "mongodb";
import cloudinary from 'cloudinary';

cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_SECRET_KEY,
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await verifyUserFromRequest(request);

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = await dbPromise;

    // Get the document
    const document = await db.collection("documents").findOne({
      _id: new ObjectId(id),
    });

    if (!document) {
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 }
      );
    }

    // Check permissions (owner, shared with user, or team member)
    const hasAccess = 
      document.userId === user.id ||
      document.sharedWith?.some((s: any) => s.email === user.email) ||
      document.organizationId === user.id; // Team access

    if (!hasAccess) {
      return NextResponse.json(
        { error: "Access denied" },
        { status: 403 }
      );
    }

    // Get PDF URL (use signed PDF if available, otherwise original)
    const pdfUrl = document.signedPdfUrl || document.cloudinaryPdfUrl;

    if (!pdfUrl) {
      return NextResponse.json(
        { error: "PDF not available" },
        { status: 404 }
      );
    }

    console.log('📥 Downloading document:', document.originalFilename);

    // Extract public_id from URL
    const urlMatch = pdfUrl.match(/\/upload\/(.+?)\.pdf/);
    if (!urlMatch) {
      return NextResponse.json(
        { error: "Invalid PDF URL" },
        { status: 500 }
      );
    }

    const publicId = urlMatch[1];

    // Generate authenticated download URL
    const authenticatedUrl = cloudinary.v2.utils.private_download_url(
      publicId,
      'pdf',
      {
        resource_type: 'image',
        type: 'upload',
        expires_at: Math.floor(Date.now() / 1000) + 3600,
      }
    );

    // Fetch the PDF
    const pdfResponse = await fetch(authenticatedUrl);

    if (!pdfResponse.ok) {
      return NextResponse.json(
        { error: "Failed to retrieve document" },
        { status: 500 }
      );
    }

    const pdfBuffer = await pdfResponse.arrayBuffer();

    // ✅✅✅ SEND DOWNLOAD NOTIFICATION (only if not the owner)
    if (document.userId !== user.id) {
      const profile = await db.collection('profiles').findOne({
        user_id: user.id
      });

      const downloaderName = profile 
        ? `${profile.firstName} ${profile.lastName}`.trim()
        : user.email.split('@')[0];

      await notifyDocumentDownload(
        document.userId,
        document.originalFilename,
        id,
        downloaderName,
        user.email
      );
      console.log('✅ Download notification sent to owner');
    }

    // ✅ Track download
    await db.collection('documents').updateOne(
      { _id: new ObjectId(id) },
      {
        $inc: { 'tracking.downloads': 1 },
        $set: { 'tracking.lastDownloaded': new Date() },
        $push: {
          'tracking.downloadHistory': {
            downloadedBy: user.email,
            downloadedAt: new Date()
          }
        }
      } as any
    );

    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${document.originalFilename}"`,
        'Content-Length': pdfBuffer.byteLength.toString(),
      },
    });

  } catch (error) {
    console.error('❌ Download error:', error);
    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}