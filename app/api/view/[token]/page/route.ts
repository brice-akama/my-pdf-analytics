// app/api/view/[token]/page/route.ts
// FIXED: Caches extracted pages in Cloudinary — never downloads full PDF twice
import { NextRequest, NextResponse } from 'next/server';
import { dbPromise } from '@/app/api/lib/mongodb';
import { v2 as cloudinary } from 'cloudinary';
import { PDFDocument } from 'pdf-lib';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_SECRET_KEY,
});

export const maxDuration = 30;

// ── Shared in-memory page cache ──────────────────────────────────
const pageCache = new Map<string, { bytes: Buffer; cachedAt: number }>();
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await context.params;
    const pageNum = parseInt(new URL(request.url).searchParams.get('page') || '1');

    const db = await dbPromise;

    // ── 1. Resolve document from share token ─────────────────────
    const share = await db.collection('shares').findOne({
      shareToken: token,
      active: true,
    });
    if (!share) {
      return NextResponse.json({ error: 'Share not found' }, { status: 404 });
    }

    const document = await db.collection('documents').findOne({ _id: share.documentId });
    if (!document?.cloudinaryPdfUrl) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    const documentId = share.documentId.toString();

    // ── 2. Check in-memory cache ─────────────────────────────────
    const cacheKey = `${documentId}-${pageNum}`;
    const cached = pageCache.get(cacheKey);
    if (cached && Date.now() - cached.cachedAt < CACHE_TTL_MS) {
      console.log(`⚡ Memory cache HIT: ${cacheKey}`);
      return new NextResponse(cached.bytes.buffer as ArrayBuffer, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': 'inline',
          'Cache-Control': 'private, max-age=3600',
          'X-Cache': 'HIT',
        },
      });
    }

    // ── 3. Check Cloudinary page cache ───────────────────────────
    const cachedPagePublicId = `docmetrics/pages/${documentId}/page_${pageNum}`;

    try {
      const cachedUrl = cloudinary.url(cachedPagePublicId, {
        resource_type: 'raw',
        type: 'upload',
        sign_url: true,
        expires_at: Math.floor(Date.now() / 1000) + 3600,
      });

      const cachedResponse = await fetch(cachedUrl, {
        signal: AbortSignal.timeout(5000), // 5s fast check
      });

      if (cachedResponse.ok) {
        console.log(`☁️ Cloudinary cache HIT: page ${pageNum}`);
        const bytes = Buffer.from(await cachedResponse.arrayBuffer());
        pageCache.set(cacheKey, { bytes, cachedAt: Date.now() });

        return new NextResponse(bytes, {
          headers: {
            'Content-Type': 'application/pdf',
            'Content-Disposition': 'inline',
            'Cache-Control': 'private, max-age=3600',
            'X-Cache': 'CLOUDINARY',
          },
        });
      }
    } catch {
      console.log(`📄 Cache MISS — extracting page ${pageNum} from full PDF...`);
    }

    // ── 4. Extract page from full PDF ────────────────────────────
    const fileUrl = document.cloudinaryPdfUrl;
    const urlParts = fileUrl.split('/upload/');
    if (urlParts.length < 2) {
      return NextResponse.json({ error: 'Invalid PDF URL format' }, { status: 400 });
    }

    const pathParts = urlParts[1].split('/');
    pathParts.shift(); // remove version (v1234567890)
    const publicId = decodeURIComponent(pathParts.join('/').replace('.pdf', ''));

    const signedUrl = cloudinary.utils.private_download_url(publicId, 'pdf', {
      resource_type: 'image',
      type: 'upload',
      attachment: false,
      expires_at: Math.floor(Date.now() / 1000) + 3600,
    });

    // Fetch full PDF with hard 20s timeout
    const pdfResponse = await fetch(signedUrl, {
      signal: AbortSignal.timeout(20000),
    });

    if (!pdfResponse.ok) {
      return NextResponse.json({ error: 'Failed to fetch PDF from Cloudinary' }, { status: 500 });
    }

    const pdfBytes = await pdfResponse.arrayBuffer();

    // Extract single page
    const fullPdf = await PDFDocument.load(pdfBytes);
    const totalPages = fullPdf.getPageCount();
    const safePageNum = Math.max(1, Math.min(pageNum, totalPages));

    const singlePagePdf = await PDFDocument.create();
    const [copiedPage] = await singlePagePdf.copyPages(fullPdf, [safePageNum - 1]);
    singlePagePdf.addPage(copiedPage);

    const singlePageBytes = await singlePagePdf.save();
    const buffer = Buffer.from(singlePageBytes);

    // ── 5. Cache extracted page in Cloudinary (fire and forget) ──
    cloudinary.uploader.upload_stream(
      {
        public_id: cachedPagePublicId,
        resource_type: 'raw',
        overwrite: false,
      },
      (error) => {
        if (error) console.error('⚠️ Page cache upload failed:', error.message);
        else console.log(`✅ Cached page ${pageNum} → Cloudinary`);
      }
    ).end(buffer);

    // Store in memory cache
    pageCache.set(cacheKey, { bytes: buffer, cachedAt: Date.now() });

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'inline',
        'Cache-Control': 'private, max-age=3600',
        'X-Cache': 'MISS',
      },
    });

  } catch (error) {
    console.error('❌ Page extract error:', error);
    return NextResponse.json({
      error: 'Failed to extract page',
      details: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}