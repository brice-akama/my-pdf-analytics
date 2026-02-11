import { NextRequest, NextResponse } from "next/server";
import { verifyUserFromRequest } from "@/lib/auth";
import { dbPromise } from "../../../lib/mongodb";
import { ObjectId } from "mongodb";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await verifyUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { provider } = await request.json(); // 'google-drive', 'dropbox', etc.

    const db = await dbPromise;
    
    // Get document
    const document = await db.collection("documents").findOne({
      _id: new ObjectId(params.id),
      userId: user.id,
    });

    if (!document) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    // Get integration
    const integration = await db.collection("integrations").findOne({
      userId: user.id,
      provider: provider,
      isActive: true,
    });

    if (!integration) {
      return NextResponse.json({ error: `${provider} not connected` }, { status: 404 });
    }

    // Download file from Cloudinary
    const fileResponse = await fetch(document.cloudinaryPdfUrl);
    const buffer = Buffer.from(await fileResponse.arrayBuffer());

    // Upload to Google Drive
    if (provider === "google-drive") {
      const metadata = {
        name: document.originalFilename,
        mimeType: "application/pdf",
      };

      const form = new FormData();
      form.append("metadata", new Blob([JSON.stringify(metadata)], { type: "application/json" }));
      form.append("file", new Blob([buffer], { type: "application/pdf" }));

      const uploadResponse = await fetch(
        "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${integration.accessToken}`,
          },
          body: form,
        }
      );

      if (!uploadResponse.ok) {
        return NextResponse.json({ error: "Failed to export to Drive" }, { status: 500 });
      }

      const uploadData = await uploadResponse.json();

      return NextResponse.json({
        success: true,
        fileId: uploadData.id,
        message: "Exported to Google Drive successfully",
      });
    }

    // Add other providers (Dropbox, OneDrive, etc.) here

    return NextResponse.json({ error: "Provider not supported yet" }, { status: 400 });
  } catch (error) {
    console.error("Export error:", error);
    return NextResponse.json({ error: "Failed to export" }, { status: 500 });
  }
}