// lib/documentSource.ts
// Tells Cloudinary-hosted PDFs apart from R2-hosted ones, and reads R2 files
// directly through the S3 API (bucket: R2_BUCKET_NAME).

export function isR2Url(url?: string | null): boolean {
  const base = process.env.R2_PUBLIC_URL?.replace(/\/$/, '')
  return !!url && !!base && url.startsWith(base + '/')
}

function r2KeyFromUrl(url: string): string {
  const base = process.env.R2_PUBLIC_URL!.replace(/\/$/, '')
  return decodeURIComponent(url.slice(base.length + 1))
}

export async function fetchR2Bytes(url: string): Promise<ArrayBuffer> {
  // Loaded lazily: a problem with the R2 setup can never break routes
  // that only serve Cloudinary files.
  const [{ GetObjectCommand }, { r2 }] = await Promise.all([
    import('@aws-sdk/client-s3'),
    import('@/lib/r2Client'),
  ])

  const result = await r2.send(
    new GetObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: r2KeyFromUrl(url),
    })
  )
  const chunks: Uint8Array[] = []
  // @ts-ignore - Body is a readable stream at runtime
  for await (const chunk of result.Body) chunks.push(chunk)
  const buf = Buffer.concat(chunks)
  return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) as ArrayBuffer
}