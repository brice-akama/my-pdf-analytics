// FILE: lib/pdfCompress.ts
//
// Shrinks a PDF by finding its embedded photos and re-encoding them at a
// lower quality/resolution, using packages that already run fine inside a
// normal Vercel function (pdf-lib is already a dependency; sharp is what
// Next.js itself uses for image optimization, so Vercel already supports it
// with no extra setup).
//
// HANDLES TWO IMAGE STORAGE FORMATS, which covers the vast majority of
// real-world PDFs:
//   1. JPEG-encoded images (filter "DCTDecode") — the common case for
//      photos from cameras/phones and most "export to PDF" tools.
//   2. Raw / Flate-compressed pixel data (filter "FlateDecode" or no
//      filter) — common in PDFs built by "Print to PDF", some scanners,
//      and certain document generators that don't pre-compress images.
//
// Both DeviceRGB and DeviceGray color spaces are handled. DeviceCMYK is
// skipped — converting CMYK to RGB risks a visible color shift, and CMYK
// images are rare in the kind of PDFs this feature targets (listing
// photos, scanned signature pages).
//
// Text and vector content (the actual words on the page) is never
// touched — this only ever touches embedded raster images. A PDF with no
// large embedded images (mostly text/vector) will shrink little or not
// at all — there's nothing to compress.

import { PDFDocument, PDFName, PDFRawStream, PDFNumber, PDFArray } from 'pdf-lib'
import sharp from 'sharp'
import { inflateSync } from 'zlib'

interface CompressResult {
  buffer: Buffer
  originalBytes: number
  compressedBytes: number
  imagesProcessed: number
}

function lastFilterName(filterEntry: any): string | null {
  if (!filterEntry) return null
  // Filter can be a single name (/FlateDecode) or an array ([/ASCII85Decode /DCTDecode])
  if (filterEntry instanceof PDFArray) {
    const arr = filterEntry.asArray()
    if (arr.length === 0) return null
    return arr[arr.length - 1].toString()
  }
  return filterEntry.toString()
}

function channelsForColorSpace(colorSpaceName: string | null): number | null {
  if (!colorSpaceName) return null
  if (colorSpaceName.includes('DeviceRGB')) return 3
  if (colorSpaceName.includes('DeviceGray') || colorSpaceName.includes('CalGray')) return 1
  return null // DeviceCMYK and anything else: not handled, skip
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

    const filterEntry = dict.get(PDFName.of('Filter'))
    const filter = lastFilterName(filterEntry)

    const colorSpaceEntry = dict.get(PDFName.of('ColorSpace'))
    const colorSpaceName = colorSpaceEntry ? colorSpaceEntry.toString() : null
    const channels = channelsForColorSpace(colorSpaceName)

    const widthEntry = dict.get(PDFName.of('Width'))
    const heightEntry = dict.get(PDFName.of('Height'))
    const width = widthEntry ? Number(widthEntry.toString()) : 0
    const height = heightEntry ? Number(heightEntry.toString()) : 0

    try {
      let recompressed: Buffer | null = null

      if (filter === '/DCTDecode' && channels === 3) {
        // Case 1: already a JPEG — just re-encode it smaller
        const originalBytes = Buffer.from(obj.getContents())
        const candidate = await sharp(originalBytes).jpeg({ quality, mozjpeg: true }).toBuffer()
        if (candidate.length < originalBytes.length) recompressed = candidate
      } else if ((filter === '/FlateDecode' || !filter) && channels && width > 0 && height > 0) {
        // Case 2: raw or Flate-compressed pixel data — decode, then encode as JPEG
        const rawContents = Buffer.from(obj.getContents())
        // obj.getContents() already applies known filters via pdf-lib in most
        // versions; if it's still compressed, inflate it ourselves as a fallback.
        let pixels: Buffer
        try {
          pixels = filter === '/FlateDecode' ? inflateSync(rawContents) : rawContents
        } catch {
          pixels = rawContents // already decoded by pdf-lib
        }
        const expectedBytes = width * height * channels
        if (pixels.length >= expectedBytes) {
          const candidate = await sharp(pixels.subarray(0, expectedBytes), {
            raw: { width, height, channels: channels as 1 | 3 },
          })
            .jpeg({ quality, mozjpeg: true })
            .toBuffer()
          // Raw case: compare against the ORIGINAL FILE bytes for this object,
          // not the decoded size, since the encoded JPEG replaces raw pixels.
          if (candidate.length < rawContents.length) recompressed = candidate
        }
      }

      if (!recompressed) continue

      // Update the image dict to describe a plain JPEG now
      dict.set(PDFName.of('Filter'), PDFName.of('DCTDecode'))
      dict.delete(PDFName.of('DecodeParms'))
      dict.delete(PDFName.of('Decode'))
      dict.set(PDFName.of('ColorSpace'), PDFName.of('DeviceRGB'))
      dict.set(PDFName.of('BitsPerComponent'), PDFNumber.of(8))
      const meta = await sharp(recompressed).metadata()
      dict.set(PDFName.of('Width'), PDFNumber.of(meta.width || width))
      dict.set(PDFName.of('Height'), PDFNumber.of(meta.height || height))
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