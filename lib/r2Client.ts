// FILE: lib/r2Client.ts
//
// R2 is S3-compatible, so we use AWS's official S3 client against
// Cloudflare's R2 endpoint. This bucket is SCRATCH SPACE ONLY — files land
// here briefly during upload, get compressed by the Cloud Run service, then
// get deleted. Nothing is meant to live here long-term.
//
// Requires these Vercel env vars (same pattern as your Cloudinary ones):
//   R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_ACCOUNT_ID, R2_BUCKET_NAME

import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

export const r2 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID as string,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY as string,
  },
})

export async function getR2UploadUrl(key: string, contentType: string) {
  const command = new PutObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME,
    Key: key,
    ContentType: contentType,
  })
  // Expires quickly — this URL is used once, immediately, by the browser
  return getSignedUrl(r2, command, { expiresIn: 300 })
}

export async function deleteR2Object(key: string) {
  await r2
    .send(new DeleteObjectCommand({ Bucket: process.env.R2_BUCKET_NAME, Key: key }))
    .catch(() => {})
}