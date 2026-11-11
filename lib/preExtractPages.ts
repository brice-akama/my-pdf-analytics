// lib/preExtractPages.ts
//
// Prepares every page of a document in the background, right after upload,
// so a prospect's FIRST open only has to serve ready-made pages.
//
// Safe by design:
//  - Never throws. Every failure is caught and logged.
//  - Records progress on the document (pagesStatus / pagesReady / pagesTotal).
//    A failed status write is logged and ignored.
//  - If this fails or gets cut off, /api/view/[token]/page still builds the
//    page on demand exactly like before. Worst case = today's behaviour.
//
// Same two exports as before (preExtractAllPages, preExtractAllPagesFromBuffer)
// plus an OPTIONAL third argument "version". Old call sites keep compiling.

import { v2 as cloudinary } from 'cloudinary'
import { PDFDocument } from 'pdf-lib'
import { ObjectId } from 'mongodb'
import { dbPromise } from '@/app/api/lib/mongodb'
import { pageCachePublicId } from '@/lib/pageCachePath'

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_SECRET_KEY,
})

const CONCURRENCY = 3 // pages processed at the same time
const UPLOAD_ATTEMPTS = 2 // try each page upload twice before giving up on it

// ── Status helper: a failed write here must NEVER break anything ─────────────
async function setPagesStatus(documentId: string, fields: Record<string, unknown>) {
  try {
    const db = await dbPromise
    await db
      .collection('documents')
      .updateOne({ _id: new ObjectId(documentId) }, { $set: fields })
  } catch (err) {
    console.error('⚠️ Could not update pagesStatus (non-fatal):', err)
  }
}

// ── Upload one single-page PDF to Cloudinary as a raw file ───────────────────
function uploadPage(buffer: Buffer, publicId: string): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { public_id: publicId, resource_type: 'raw', overwrite: false },
      (error) => (error ? reject(error) : resolve())
    )
    stream.end(buffer)
  })
}

// ── Core: split an already-loaded PDF into pages and store each one ──────────
async function extractAndCachePages(
  fullPdf: PDFDocument,
  documentId: string,
  version: number
): Promise<void> {
  const totalPages = fullPdf.getPageCount()
  console.log(`📄 [pages] ${documentId} v${version}: preparing ${totalPages} pages`)

  await setPagesStatus(documentId, {
    pagesStatus: 'processing',
    pagesVersion: version,
    pagesTotal: totalPages,
    pagesReady: 0,
  })

  let ready = 0
  let failed = 0

  for (let start = 1; start <= totalPages; start += CONCURRENCY) {
    const count = Math.min(CONCURRENCY, totalPages - start + 1)
    const batch = Array.from({ length: count }, (_, i) => start + i)

    await Promise.all(
      batch.map(async (pageNum) => {
        try {
          const single = await PDFDocument.create()
          const [copied] = await single.copyPages(fullPdf, [pageNum - 1])
          single.addPage(copied)
          const buffer = Buffer.from(await single.save())
          const publicId = pageCachePublicId(documentId, version, pageNum)

          let lastErr: unknown
          for (let attempt = 1; attempt <= UPLOAD_ATTEMPTS; attempt++) {
            try {
              await uploadPage(buffer, publicId)
              ready++
              return
            } catch (err) {
              lastErr = err
            }
          }
          throw lastErr
        } catch (err) {
          failed++
          console.error(
            `❌ [pages] page ${pageNum} failed:`,
            err instanceof Error ? err.message : err
          )
        }
      })
    )

    // Progress after every batch (cheap, and lets a UI show "12 of 40")
    await setPagesStatus(documentId, { pagesReady: ready })
  }

  await setPagesStatus(documentId, {
    pagesStatus: failed === 0 ? 'ready' : 'failed',
    pagesReady: ready,
    pagesPreparedAt: new Date(),
  })

  console.log(
    `🎉 [pages] ${documentId} v${version}: ${ready}/${totalPages} ready` +
      (failed ? `, ${failed} failed (viewer will build those on demand)` : '')
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// PREFERRED: use this when the PDF bytes are already in memory (all upload
// routes have them). No re-download from Cloudinary/R2 needed.
// ─────────────────────────────────────────────────────────────────────────────
export async function preExtractAllPagesFromBuffer(
  pdfBuffer: Buffer,
  documentId: string,
  version: number = 1
): Promise<void> {
  try {
    const fullPdf = await PDFDocument.load(pdfBuffer)
    await extractAndCachePages(fullPdf, documentId, version)
  } catch (error) {
    console.error('❌ Pre-extraction (buffer) failed:', error)
    await setPagesStatus(documentId, { pagesStatus: 'failed' })
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// KEPT for compatibility: downloads the PDF from Cloudinary first.
// New code should prefer preExtractAllPagesFromBuffer.
// ─────────────────────────────────────────────────────────────────────────────
export async function preExtractAllPages(
  cloudinaryPdfUrl: string,
  documentId: string,
  version: number = 1
): Promise<void> {
  try {
    const urlParts = cloudinaryPdfUrl.split('/upload/')
    if (urlParts.length < 2) {
      console.error('❌ Invalid Cloudinary PDF URL:', cloudinaryPdfUrl)
      await setPagesStatus(documentId, { pagesStatus: 'failed' })
      return
    }

    const pathParts = urlParts[1].split('/')
    pathParts.shift() // remove version segment (v1234567890)
    const publicId = decodeURIComponent(pathParts.join('/').replace('.pdf', ''))

    const signedUrl = cloudinary.utils.private_download_url(publicId, 'pdf', {
      resource_type: 'image',
      type: 'upload',
      attachment: false,
      expires_at: Math.floor(Date.now() / 1000) + 3600,
    })

    const res = await fetch(signedUrl, { signal: AbortSignal.timeout(30000) })
    if (!res.ok) {
      console.error('❌ Failed to fetch PDF for pre-extraction:', res.status)
      await setPagesStatus(documentId, { pagesStatus: 'failed' })
      return
    }

    const fullPdf = await PDFDocument.load(await res.arrayBuffer())
    await extractAndCachePages(fullPdf, documentId, version)
  } catch (error) {
    console.error('❌ Pre-extraction failed:', error)
    await setPagesStatus(documentId, { pagesStatus: 'failed' })
  }
}