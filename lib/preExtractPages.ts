// lib/preExtractPages.ts
// Call this right after a document is uploaded to Cloudinary.
// It extracts every page and caches them so the first viewer never waits.

import { v2 as cloudinary } from 'cloudinary';
import { PDFDocument } from 'pdf-lib';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_SECRET_KEY,
});

export async function preExtractAllPages(
  cloudinaryPdfUrl: string,
  documentId: string
): Promise<void> {
  console.log(`🚀 Pre-extracting pages for document: ${documentId}`);

  try {
    // ── 1. Build signed URL to fetch the full PDF ─────────────────
    const urlParts = cloudinaryPdfUrl.split('/upload/');
    if (urlParts.length < 2) {
      console.error('❌ Invalid Cloudinary PDF URL:', cloudinaryPdfUrl);
      return;
    }

    const pathParts = urlParts[1].split('/');
    pathParts.shift(); // remove version
    const publicId = decodeURIComponent(pathParts.join('/').replace('.pdf', ''));

    const signedUrl = cloudinary.utils.private_download_url(publicId, 'pdf', {
      resource_type: 'image',
      type: 'upload',
      attachment: false,
      expires_at: Math.floor(Date.now() / 1000) + 3600,
    });

    // ── 2. Download the full PDF ──────────────────────────────────
    console.log(`📥 Downloading full PDF for pre-extraction...`);
    const pdfResponse = await fetch(signedUrl, {
      signal: AbortSignal.timeout(30000),
    });

    if (!pdfResponse.ok) {
      console.error('❌ Failed to fetch PDF for pre-extraction:', pdfResponse.status);
      return;
    }

    const pdfBytes = await pdfResponse.arrayBuffer();
    const fullPdf = await PDFDocument.load(pdfBytes);
    const totalPages = fullPdf.getPageCount();

    console.log(`📄 PDF has ${totalPages} pages — extracting all...`);

    // ── 3. Extract and cache each page ───────────────────────────
    // Process in batches of 3 to avoid overwhelming Cloudinary
    const BATCH_SIZE = 3;

    for (let batchStart = 1; batchStart <= totalPages; batchStart += BATCH_SIZE) {
      const batchEnd = Math.min(batchStart + BATCH_SIZE - 1, totalPages);
      const batch = Array.from(
        { length: batchEnd - batchStart + 1 },
        (_, i) => batchStart + i
      );

      await Promise.all(
        batch.map(async (pageNum) => {
          const cachedPagePublicId = `docmetrics/pages/${documentId}/page_${pageNum}`;

          try {
            // Check if already cached
            await cloudinary.api.resource(cachedPagePublicId, {
              resource_type: 'raw',
            });
            console.log(`⏭️ Page ${pageNum} already cached — skipping`);
            return;
          } catch {
            // Not cached yet — extract and upload
          }

          try {
            // Extract single page
            const singlePagePdf = await PDFDocument.create();
            const [copiedPage] = await singlePagePdf.copyPages(fullPdf, [pageNum - 1]);
            singlePagePdf.addPage(copiedPage);
            const singlePageBytes = await singlePagePdf.save();
            const buffer = Buffer.from(singlePageBytes);

            // Upload to Cloudinary
            await new Promise<void>((resolve, reject) => {
              cloudinary.uploader.upload_stream(
                {
                  public_id: cachedPagePublicId,
                  resource_type: 'raw',
                  overwrite: false,
                },
                (error) => {
                  if (error) {
                    console.error(`⚠️ Failed to cache page ${pageNum}:`, error.message);
                    reject(error);
                  } else {
                    console.log(`✅ Page ${pageNum}/${totalPages} cached`);
                    resolve();
                  }
                }
              ).end(buffer);
            });
          } catch (err) {
            console.error(`❌ Error extracting page ${pageNum}:`, err);
          }
        })
      );
    }

    console.log(`🎉 Pre-extraction complete for document: ${documentId}`);

  } catch (error) {
    // Never throw — pre-extraction is background work, don't fail the upload
    console.error('❌ Pre-extraction failed:', error);
  }
}