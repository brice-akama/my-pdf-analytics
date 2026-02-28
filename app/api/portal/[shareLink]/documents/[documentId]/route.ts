// app/api/portal/[shareLink]/documents/[documentId]/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { dbPromise } from '@/app/api/lib/mongodb'
import { PDFDocument, rgb, degrees, StandardFonts } from 'pdf-lib'
import { ObjectId } from 'mongodb'
import cloudinary from 'cloudinary'

// ── Configure Cloudinary (same as your other routes) ─────────────────────────
cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_SECRET_KEY,
})

// ── Extract public_id from any Cloudinary URL ─────────────────────────────────
// Handles both /image/upload/ and /raw/upload/, with or without version segment
function extractPublicId(url: string): string | null {
  // Match: /image/upload/v123456/path/to/file.pdf  OR  /raw/upload/path/to/file.pdf
  const match = url.match(/\/(?:image|raw|video)\/upload\/(?:v\d+\/)?(.+)$/)
  if (!match) return null
  // Return public_id WITH extension for PDFs (Cloudinary needs it for raw resources)
   return decodeURIComponent(match[1])
}

// ── Fetch raw PDF bytes using Cloudinary private_download_url ─────────────────
async function fetchPdfBytesFromCloudinary(originalUrl: string): Promise<Uint8Array> {
  const publicId = extractPublicId(originalUrl)

  console.log('🔑 Extracted public_id:', publicId)

  if (!publicId) {
    throw new Error(`Could not extract public_id from URL: ${originalUrl}`)
  }

  // Strip extension from public_id to pass separately
  const publicIdNoExt = publicId.replace(/\.[^/.]+$/, '')
  const ext = publicId.split('.').pop() || 'pdf'

  console.log('🔑 public_id (no ext):', publicIdNoExt, '| ext:', ext)

  // Try as image resource first (that's how your files are stored)
  let authenticatedUrl: string
  try {
    authenticatedUrl = cloudinary.v2.utils.private_download_url(
      publicIdNoExt,
      ext,
      {
        resource_type: 'image',
        type:          'upload',
        expires_at:    Math.floor(Date.now() / 1000) + 3600,
      }
    )
    console.log('📥 Trying image/upload signed URL...')
  } catch (e) {
    console.error('❌ Failed to generate signed URL:', e)
    throw new Error('Failed to generate Cloudinary signed URL')
  }

  let res = await fetch(authenticatedUrl)

  // If image resource type fails, try raw
  if (!res.ok) {
    console.warn(`⚠️  image/upload returned ${res.status}, trying raw/upload...`)
    authenticatedUrl = cloudinary.v2.utils.private_download_url(
      publicIdNoExt,
      ext,
      {
        resource_type: 'raw',
        type:          'upload',
        expires_at:    Math.floor(Date.now() / 1000) + 3600,
      }
    )
    res = await fetch(authenticatedUrl)
  }

  if (!res.ok) {
    console.error('❌ Both resource types failed. Status:', res.status)
    console.error('❌ public_id tried:', publicIdNoExt)
    throw new Error(`Failed to fetch PDF from Cloudinary: ${res.status}`)
  }

  const buffer = await res.arrayBuffer()
  console.log('✅ PDF fetched successfully. Bytes:', buffer.byteLength)
  return new Uint8Array(buffer)
}

// ── Stamp watermark on EVERY page in a 3×4 tile grid ─────────────────────────
async function stampWatermark(
  pdfBytes: Uint8Array,
  email: string,
  timestamp: string
): Promise<Uint8Array> {
  const pdfDoc  = await PDFDocument.load(pdfBytes, { ignoreEncryption: true })
  const font    = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
  const fontReg = await pdfDoc.embedFont(StandardFonts.Helvetica)

  for (const page of pdfDoc.getPages()) {
    const { width, height } = page.getSize()
    const cols    = 3
    const rows    = 4
    const colStep = width  / cols
    const rowStep = height / rows

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const cx = colStep * col + colStep / 2
        const cy = rowStep * row + rowStep / 2

        // ghost CONFIDENTIAL
        page.drawText('CONFIDENTIAL', {
          x: cx - 80, y: cy + 10, size: 22, font,
          color: rgb(0.6, 0.6, 0.6), opacity: 0.06, rotate: degrees(-35),
        })

        // email
        const eSize = Math.min(11, 200 / Math.max(email.length, 1))
        const eW    = font.widthOfTextAtSize(email, eSize)
        page.drawText(email, {
          x:       cx - (eW / 2) * Math.cos(Math.PI * 35 / 180),
          y:       cy + (eW / 2) * Math.sin(Math.PI * 35 / 180),
          size:    eSize, font,
          color:   rgb(0.15, 0.15, 0.15), opacity: 0.14, rotate: degrees(-35),
        })

        // timestamp
        const tW = fontReg.widthOfTextAtSize(timestamp, 8)
        page.drawText(timestamp, {
          x:       cx - (tW / 2) * Math.cos(Math.PI * 35 / 180),
          y:       cy + (tW / 2) * Math.sin(Math.PI * 35 / 180) - 14,
          size:    8, font: fontReg,
          color:   rgb(0.2, 0.2, 0.2), opacity: 0.12, rotate: degrees(-35),
        })
      }
    }
  }

  return pdfDoc.save()
}

// ── GET handler ───────────────────────────────────────────────────────────────
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ shareLink: string; documentId: string }> }
) {
  try {
    const { shareLink, documentId } = await params
    const isDownload = request.nextUrl.searchParams.get('download') === 'true'

    console.log('🔵 Document request:', { shareLink, documentId, isDownload })

    const db = await dbPromise

    // 1. Find space
    const space = await db.collection('spaces').findOne({
      'publicAccess.shareLink': shareLink,
    })
    console.log('🏠 Space:', space ? `${space._id} | ${space.name}` : 'NOT FOUND')
    if (!space) return NextResponse.json({ error: 'Space not found' }, { status: 404 })

    // 2. Parse documentId
    let objId: ObjectId
    try {
      objId = new ObjectId(documentId)
    } catch {
      console.error('❌ Invalid ObjectId:', documentId)
      return NextResponse.json({ error: 'Invalid document ID' }, { status: 400 })
    }

    // 3. Find document — handle both ObjectId and string spaceId
    const doc = await db.collection('documents').findOne({
      _id: objId,
      $or: [
        { spaceId: space._id },
        { spaceId: space._id.toString() },
      ],
      archived: { $ne: true },
    })

    console.log('📃 Doc:', doc ? doc._id.toString() : 'NOT FOUND')

    if (!doc) {
      const anyDoc = await db.collection('documents').findOne({ _id: objId })
      if (anyDoc) {
        console.log('🔍 Doc exists but spaceId mismatch!')
        console.log('   DB spaceId:', anyDoc.spaceId, '| type:', typeof anyDoc.spaceId)
        console.log('   Space _id:', space._id, '| toString:', space._id.toString())
      } else {
        console.log('🔍 Doc ID not found in DB at all')
      }
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }

    const pdfUrl = doc.cloudinaryPdfUrl || doc.fileUrl
    console.log('🔗 Raw Cloudinary URL:', pdfUrl)
    if (!pdfUrl) return NextResponse.json({ error: 'No PDF URL for this document' }, { status: 404 })

    // 4. Fetch bytes using Cloudinary signed URL
    const rawBytes = await fetchPdfBytesFromCloudinary(pdfUrl)

    // 5. Download: bake watermark into every page
    if (isDownload) {
      const visitorEmail =
        request.nextUrl.searchParams.get('email') ||
        request.cookies.get('visitor_email')?.value ||
        'confidential'

      const timestamp = new Date().toLocaleString('en-US', {
        month: 'short', day: 'numeric', year: 'numeric',
        hour: '2-digit', minute: '2-digit', timeZoneName: 'short',
      })

      console.log('💧 Stamping watermark for:', visitorEmail)
      const stamped = await stampWatermark(rawBytes, visitorEmail, timestamp)
      console.log('✅ Watermark stamped:', stamped.length, 'bytes')

      return new NextResponse(Buffer.from(stamped), {
        status: 200,
        headers: {
          'Content-Type':        'application/pdf',
          'Content-Disposition': `attachment; filename="${encodeURIComponent(doc.name || 'document')}.pdf"`,
          'Content-Length':      String(stamped.length),
          'Cache-Control':       'no-store',
        },
      })
    }

    // 6. Preview: return raw bytes (CSS watermark overlay in browser)
    console.log('👁️ Returning raw PDF for preview')
    return new NextResponse(Buffer.from(rawBytes), {
      status: 200,
      headers: {
        'Content-Type':  'application/pdf',
        'Cache-Control': 'private, max-age=300',
      },
    })

  } catch (err) {
    console.error('❌ Unhandled error in document route:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}