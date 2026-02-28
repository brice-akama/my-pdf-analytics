// app/api/portal/[shareLink]/nda-proxy/route.ts
// Proxies the NDA PDF from Cloudinary so the iframe can display it without auth issues

import { NextRequest, NextResponse } from 'next/server'
import cloudinary from 'cloudinary'

cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_SECRET_KEY,
})

function extractPublicId(url: string): { publicId: string; ext: string } | null {
  const match = url.match(/\/(?:image|raw|video)\/upload\/(?:v\d+\/)?(.+)$/)
  if (!match) return null
  const full = decodeURIComponent(match[1])
  const ext  = full.split('.').pop() || 'pdf'
  const publicId = full.replace(/\.[^/.]+$/, '')
  return { publicId, ext }
}

export async function GET(
  request: NextRequest,
  context: { params: { shareLink: string } | Promise<{ shareLink: string }> }
) {
  try {
    const rawUrl = request.nextUrl.searchParams.get('url')
    if (!rawUrl) {
      return NextResponse.json({ error: 'No URL provided' }, { status: 400 })
    }

    const parsed = extractPublicId(rawUrl)
    if (!parsed) {
      return NextResponse.json({ error: 'Invalid Cloudinary URL' }, { status: 400 })
    }

    const { publicId, ext } = parsed
    console.log('📄 NDA proxy — public_id:', publicId)

    // Try image resource type first (how your files are stored), then raw
    let pdfRes: Response | null = null

    for (const resourceType of ['image', 'raw'] as const) {
      const signedUrl = cloudinary.v2.utils.private_download_url(
        publicId, ext,
        {
          resource_type: resourceType,
          type:          'upload',
          expires_at:    Math.floor(Date.now() / 1000) + 3600,
        }
      )
      const res = await fetch(signedUrl)
      if (res.ok) { pdfRes = res; break }
      console.warn(`⚠️  ${resourceType}/upload returned ${res.status}`)
    }

    if (!pdfRes) {
      return NextResponse.json({ error: 'Failed to fetch NDA from Cloudinary' }, { status: 502 })
    }

    const buffer = await pdfRes.arrayBuffer()

    return new NextResponse(Buffer.from(buffer), {
      status: 200,
      headers: {
        'Content-Type':  'application/pdf',
        'Cache-Control': 'private, max-age=300',
      },
    })

  } catch (err) {
    console.error('❌ NDA proxy error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}