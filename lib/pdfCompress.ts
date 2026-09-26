// FILE: lib/pdfCompress.ts
//
// Shrinks a PDF by finding its embedded JPEG photos and re-encoding them at
// a lower quality/resolution, using packages that already run fine inside a
// normal Vercel function (pdf-lib is already a dependency; sharp is what
// Next.js itself uses for image optimization, so Vercel already supports it
// with no extra setup).
//
// SCOPE / HONEST LIMITS:
//   - Only re-compresses images stored as JPEG (filter "DCTDecode") in
//     DeviceRGB color space — that covers the vast majority of scanned
//     photos and listing images in a typical real-estate/business PDF.
//   - Skips CMYK and Grayscale images rather than risk corrupting them,
//     since re-encoding those needs extra color-space handling.
//   - Text and vector content (the actual words on the page) is untouched —
//     this only ever touches embedded raster images.
//   - A PDF with no large embedded photos (mostly text/vector) will shrink
//     little or not at all. That's expected: there's nothing to compress.

import { PDFDocument, PDFName, PDFRawStream, PDFNumber } from 'pdf-lib'
import sharp from 'sharp'

interface CompressResult {
  buffer: Buffer
  originalBytes: number
  compressedBytes: number
  imagesProcessed: number
}

export async function compressPdfImages(
  inputBuffer: Buffer,
  quality: number = 50
): Promise<CompressResult> {
  const pdfDoc = await PDFDocument.load(inputBuffer, { updateMetadata: false })
  const context = pdfDoc.context
  let imagesProcessed = 0

  for (const [ref, obj] of context.enumerateIndirectObjects()) {
    if (!(obj instanceof PDFRawStream)) continue

    const dict = obj.dict
    const subtype = dict.get(PDFName.of('Subtype'))
    if (!subtype || subtype.toString() !== '/Image') continue

    const filter = dict.get(PDFName.of('Filter'))
    const filterName = filter ? filter.toString() : ''
    if (!filterName.includes('DCTDecode')) continue // only handle JPEG-encoded images

    const colorSpace = dict.get(PDFName.of('ColorSpace'))
    const colorSpaceName = colorSpace ? colorSpace.toString() : ''
    if (!colorSpaceName.includes('DeviceRGB')) continue // skip CMYK/Gray to avoid channel mismatches

    try {
      const originalBytes = obj.getContents()
      const recompressed = await sharp(Buffer.from(originalBytes))
        .jpeg({ quality, mozjpeg: true })
        .toBuffer()

      // Only replace it if we actually made it smaller
      if (recompressed.length >= originalBytes.length) continue

      const meta = await sharp(recompressed).metadata()

      dict.set(PDFName.of('Width'), PDFNumber.of(meta.width || 0))
      dict.set(PDFName.of('Height'), PDFNumber.of(meta.height || 0))
      dict.set(PDFName.of('Length'), PDFNumber.of(recompressed.length))

      const newStream = PDFRawStream.of(dict, recompressed)
      context.assign(ref, newStream)
      imagesProcessed++
    } catch {
      // If any single image fails to process, leave it as-is and move on —
      // one bad image should never break the whole upload.
      continue
    }
  }

  const savedBytes = await pdfDoc.save()
  const buffer = Buffer.from(savedBytes)

  return {
    buffer,
    originalBytes: inputBuffer.length,
    compressedBytes: buffer.length,
    imagesProcessed,
  }
}