 // app/api/portal/[shareLink]/nda-certificate/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { dbPromise } from '@/app/api/lib/mongodb'
import { ObjectId } from 'mongodb'
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'
import crypto from 'crypto'

export async function GET(
  request: NextRequest,
  context: { params: { shareLink: string } | Promise<{ shareLink: string }> }
) {
  try {
    const params    = context.params instanceof Promise ? await context.params : context.params
    const shareLink = params.shareLink
    const id        = request.nextUrl.searchParams.get('id')
    const email     = request.nextUrl.searchParams.get('email')

    if (!id || !email) {
      return NextResponse.json({ error: 'Missing id or email' }, { status: 400 })
    }

    const db = await dbPromise

    let sig: any = null
    try {
      sig = await db.collection('ndaSignatures').findOne({ _id: new ObjectId(id) })
    } catch {
      return NextResponse.json({ error: 'Invalid signature ID' }, { status: 400 })
    }

    if (!sig) return NextResponse.json({ error: 'Signature not found' }, { status: 404 })
    if (sig.email.toLowerCase() !== email.toLowerCase()) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const space = await db.collection('spaces').findOne({
      'publicAccess.shareLink': shareLink,
    })
    const spaceName = space?.name || 'Document Space'

    const documentHash = crypto
      .createHash('sha256')
      .update(sig.ndaDocumentUrl || '')
      .digest('hex')

    // ── PDF setup ─────────────────────────────────────────────────────────────
    const pdfDoc   = await PDFDocument.create()
    const page     = pdfDoc.addPage([595, 842]) // A4
    const W = 595
    const H = 842
    const M = 48  // margin

    const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
    const reg  = await pdfDoc.embedFont(StandardFonts.Helvetica)

    const BLACK  = rgb(0.07, 0.07, 0.07)
    const GRAY   = rgb(0.45, 0.45, 0.45)
    const LGRAY  = rgb(0.82, 0.82, 0.82)
    const WHITE  = rgb(1, 1, 1)
    const GREEN  = rgb(0.13, 0.72, 0.38)
    const DARK   = rgb(0.07, 0.07, 0.07)
    const BG     = rgb(0.97, 0.97, 0.97)

    // ── Page background ───────────────────────────────────────────────────────
    page.drawRectangle({ x: 0, y: 0, width: W, height: H, color: BG })

    // ── Banner (top 110px) ────────────────────────────────────────────────────
    page.drawRectangle({ x: 0, y: H - 110, width: W, height: 110, color: DARK })

    // pdf-lib y is from BOTTOM. Banner top = H, banner bottom = H-110
    // Text baseline inside banner:
    page.drawText('NDA SIGNATURE CERTIFICATE', {
      x: M, y: H - 52,          // 52px down from top
      size: 17, font: bold, color: WHITE,
    })
    page.drawText('Official Record of Consent  |  Powered by DocMetrics', {
      x: M, y: H - 74,
      size: 9,  font: reg,  color: rgb(0.6, 0.6, 0.6),
    })

    // SIGNED badge
    page.drawRectangle({ x: W - 102, y: H - 82, width: 66, height: 22, color: GREEN })
    page.drawText('SIGNED', { x: W - 90, y: H - 74, size: 9, font: bold, color: WHITE })

    // ── Drawing helpers ───────────────────────────────────────────────────────
    // y here = absolute y from BOTTOM of page (pdf-lib native)

    const sectionHeader = (title: string, y: number) => {
      page.drawText(title, { x: M, y: y + 10, size: 8, font: bold, color: GRAY })
      page.drawLine({
        start: { x: M, y }, end: { x: W - M, y },
        thickness: 1, color: LGRAY,
      })
    }

    const field = (label: string, value: string, y: number) => {
      // label sits above value
      page.drawText(label.toUpperCase(), { x: M, y: y + 22, size: 7.5, font: bold, color: GRAY })
      const display = value.length > 75 ? value.substring(0, 75) + '...' : value
      page.drawText(display, { x: M, y: y + 8, size: 10.5, font: reg, color: BLACK })
      page.drawLine({
        start: { x: M, y }, end: { x: W - M, y },
        thickness: 0.4, color: LGRAY,
      })
    }

    // ── Layout — work DOWN from below banner ──────────────────────────────────
    // Banner bottom = H - 110 = 732 (in pdf-lib coords from bottom)
    // We'll use a cursor that tracks absolute y from bottom, moving downward

    let y = 732 - 30   // start 30px below banner bottom = 702

    // ── SECTION 1: AGREEMENT DETAILS ─────────────────────────────────────────
    sectionHeader('AGREEMENT DETAILS', y)
    y -= 40
    field('Document Name', sig.ndaDocumentName || 'Non-Disclosure Agreement', y)
    y -= 50
    field('Space / Project', spaceName, y)
    y -= 50
    field('Share Link', shareLink, y)
    y -= 60

    // ── SECTION 2: SIGNATORY ─────────────────────────────────────────────────
    sectionHeader('SIGNATORY', y)
    y -= 40
    field('Email Address', sig.email, y)
    y -= 50
    field('IP Address', sig.ipAddress || 'unknown', y)
    y -= 50
    field('Browser / User Agent', (sig.userAgent || 'unknown').substring(0, 75), y)
    y -= 60

    // ── SECTION 3: TIMESTAMP & VERIFICATION ──────────────────────────────────
    sectionHeader('TIMESTAMP & VERIFICATION', y)
    y -= 40
    field('Signed At (UTC)', new Date(sig.signedAt).toUTCString(), y)
    y -= 50
    field('Signature ID', sig._id.toString(), y)
    y -= 50
    field('Document Hash (SHA-256)', documentHash.substring(0, 64), y)
    y -= 60

    // ── SECTION 4: NDA DOCUMENT REFERENCE ────────────────────────────────────
    if (y > 120) {
      sectionHeader('NDA DOCUMENT REFERENCE', y)
      y -= 40
      if (sig.ndaDocumentUrl) {
        field('Document URL', sig.ndaDocumentUrl.substring(0, 75), y)
        y -= 50
      }
    }

    // ── Legal consent note ────────────────────────────────────────────────────
    if (y > 100) {
      page.drawRectangle({ x: M, y: y - 34, width: W - M * 2, height: 42, color: rgb(0.91, 0.97, 0.91) })
      page.drawText('The signatory above has read and agreed to the full terms of the NDA document referenced above.', {
        x: M + 10, y: y - 8, size: 8.5, font: bold, color: rgb(0.1, 0.45, 0.2),
      })
      page.drawText('This certificate constitutes a legally binding electronic record of consent.', {
        x: M + 10, y: y - 22, size: 8.5, font: reg, color: rgb(0.15, 0.4, 0.2),
      })
    }

    // ── Footer ────────────────────────────────────────────────────────────────
    page.drawRectangle({ x: 0, y: 0, width: W, height: 52, color: rgb(0.91, 0.91, 0.91) })
    page.drawLine({ start: { x: 0, y: 52 }, end: { x: W, y: 52 }, thickness: 0.5, color: LGRAY })
    page.drawText('This certificate was automatically generated by DocMetrics — official electronic record of consent.', {
      x: M, y: 34, size: 7.5, font: reg, color: GRAY,
    })
    page.drawText(`Generated: ${new Date().toUTCString()}`, {
      x: M, y: 18, size: 7.5, font: reg, color: GRAY,
    })
    page.drawText('docmetrics.io', { x: W - 90, y: 24, size: 9, font: bold, color: GRAY })

    const pdfBytes = await pdfDoc.save()
    const filename = `NDA_Certificate_${sig._id.toString().substring(0, 8)}.pdf`

    return new NextResponse(Buffer.from(pdfBytes), {
      status: 200,
      headers: {
        'Content-Type':        'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length':      String(pdfBytes.length),
        'Cache-Control':       'no-store',
      },
    })

  } catch (err) {
    console.error('❌ Certificate error:', err)
    return NextResponse.json({ error: 'Failed to generate certificate' }, { status: 500 })
  }
}