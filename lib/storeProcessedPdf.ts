// lib/storeProcessedPdf.ts
// Shared "where does this PDF end up" logic for Google Drive and OneDrive
// imports (and, later, any other import source). Mirrors the large-file
// path in app/api/upload/large-complete/route.ts: compress if over 10MB,
// store in R2 if still over 10MB after that, otherwise use Cloudinary.

import crypto from 'crypto'
import streamifier from 'streamifier'
import cloudinary from 'cloudinary'
import { r2 } from '@/lib/r2Client'
import { compressPdfImages } from '@/lib/pdfCompress'

const CLOUDINARY_MAX_BYTES = 10 * 1024 * 1024

function uploadToCloudinary(buffer: Buffer, publicId: string, folder: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.v2.uploader.upload_stream(
      { folder, public_id: publicId, resource_type: 'auto', type: 'upload', access_mode: 'public' },
      (err, result) => (err ? reject(err) : resolve(result?.secure_url || ''))
    )
    streamifier.createReadStream(buffer).pipe(stream)
  })
}

export async function storeProcessedPdf(
  pdfBuffer: Buffer,
  userId: string,
  filename: string,
  cloudinaryFolder: string
): Promise<{
  finalBuffer: Buffer
  storedUrl: string
  storedInR2: boolean
  r2Key: string | null
}> {
  let finalBuffer = pdfBuffer

  if (pdfBuffer.length > CLOUDINARY_MAX_BYTES) {
    const result = await compressPdfImages(pdfBuffer, 50)
    finalBuffer = result.buffer
  }

  if (finalBuffer.length > CLOUDINARY_MAX_BYTES) {
    const { PutObjectCommand } = await import('@aws-sdk/client-s3')
    const r2Key = `documents/${userId}/${crypto.randomUUID()}.pdf`
    await r2.send(
      new PutObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME,
        Key: r2Key,
        Body: finalBuffer,
        ContentType: 'application/pdf',
      })
    )
    return {
      finalBuffer,
      storedUrl: `${process.env.R2_PUBLIC_URL}/${r2Key}`,
      storedInR2: true,
      r2Key,
    }
  }

  const publicId = filename.replace(/\.[^/.]+$/, '') + '_' + crypto.randomBytes(8).toString('hex')
  const storedUrl = await uploadToCloudinary(finalBuffer, publicId, cloudinaryFolder)
  return { finalBuffer, storedUrl, storedInR2: false, r2Key: null }
}