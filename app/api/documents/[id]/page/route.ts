// app/api/documents/[id]/page/route.ts
// FIXED: Caches extracted pages in Cloudinary — never downloads full PDF twice
import { NextRequest, NextResponse } from 'next/server';
import { dbPromise } from '@/app/api/lib/mongodb';
import { ObjectId } from 'mongodb';
import { v2 as cloudinary } from 'cloudinary';
import { PDFDocument } from 'pdf-lib';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_SECRET_KEY,
});

// Next.js route timeout — 30s max, fail fast
export const maxDuration = 30;

// ── In-memory cache for extracted page bytes (per process) ───────
// Keyed by `documentId-pageNum`. Survives across requests in same
// server instance. Falls back to Cloudinary cache on new instances.
const pageCache = new Map<string, { bytes: Buffer; cachedAt: number }>();
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const pageNum = parseInt(request.nextUrl.searchParams.get('page') || '1');

    // ── 1. Check in-memory cache first ──────────────────────────
    const cacheKey = `${id}-${pageNum}`;
    const cached = pageCache.get(cacheKey);
    if (cached && Date.now() - cached.cachedAt < CACHE_TTL_MS) {
      console.log(`⚡ Cache HIT: ${cacheKey}`);
      return new NextResponse(cached.bytes.buffer as ArrayBuffer, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': 'inline',
          'Cache-Control': 'private, max-age=3600',
          'X-Cache': 'HIT',
        },
      });
    }

    // ── 2. Load document ─────────────────────────────────────────
    const db = await dbPromise;
    let document = await db.collection('documents').findOne({ id });
    if (!document && ObjectId.isValid(id)) {
      document = await db.collection('documents').findOne({ _id: new ObjectId(id) });
    }
    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    // ── 3. Check if we already cached this page in Cloudinary ────
    // We store extracted pages as: docmetrics/pages/{documentId}/page_{N}
    const cachedPagePublicId = `docmetrics/pages/${id}/page_${pageNum}`;
    
    try {
      // Try to fetch the already-extracted cached page from Cloudinary
      const cachedUrl = cloudinary.url(cachedPagePublicId, {
        resource_type: 'raw',
        type: 'upload',
        sign_url: true,
        expires_at: Math.floor(Date.now() / 1000) + 3600,
      });

      const cachedResponse = await fetch(cachedUrl, {
        signal: AbortSignal.timeout(5000), // fast check — 5s only
      });

      if (cachedResponse.ok) {
        console.log(`☁️ Cloudinary page cache HIT: ${cachedPagePublicId}`);
        const bytes = Buffer.from(await cachedResponse.arrayBuffer());
        
        // Store in memory cache too
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
      // Cloudinary cache miss or timeout — proceed to extract
      console.log(`📄 Cache MISS, extracting page ${pageNum} from full PDF...`);
    }

    // ── 4. Extract page from full PDF ────────────────────────────
    const cloudinaryPdfUrl = document.cloudinaryPdfUrl || document.url || document.pdfUrl;
    if (!cloudinaryPdfUrl) {
      return NextResponse.json({ error: 'PDF not available' }, { status: 404 });
    }

    // Build signed download URL
    const urlParts = cloudinaryPdfUrl.split('/upload/');
    if (urlParts.length < 2) {
      return NextResponse.json({ error: 'Invalid PDF URL' }, { status: 400 });
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

    // Fetch full PDF with a hard 20s timeout
    const pdfResponse = await fetch(signedUrl, {
      signal: AbortSignal.timeout(20000),
    });

    if (!pdfResponse.ok) {
      return NextResponse.json({ error: 'Failed to fetch PDF' }, { status: 500 });
    }

    const pdfArrayBuffer = await pdfResponse.arrayBuffer();

    // Extract single page
    const fullPdf = await PDFDocument.load(pdfArrayBuffer);
    const totalPages = fullPdf.getPageCount();
    const safePageNum = Math.max(1, Math.min(pageNum, totalPages));

    const singlePagePdf = await PDFDocument.create();
    const [copiedPage] = await singlePagePdf.copyPages(fullPdf, [safePageNum - 1]);
    singlePagePdf.addPage(copiedPage);
    const singlePageBytes = await singlePagePdf.save();
    const buffer = Buffer.from(singlePageBytes);

    // ── 5. Store extracted page in Cloudinary for future requests ─
    // Fire and forget — don't await, don't block the response
    cloudinary.uploader.upload_stream(
      {
        public_id: cachedPagePublicId,
        resource_type: 'raw',
        overwrite: false, // never re-upload if already there
        folder: `docmetrics/pages/${id}`,
      },
      (error) => {
        if (error) console.error('⚠️ Page cache upload failed (non-critical):', error.message);
        else console.log(`✅ Cached page ${pageNum} to Cloudinary`);
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