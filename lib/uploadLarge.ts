// FILE: lib/uploadLarge.ts
//
// For PDFs over 10MB (Cloudinary's per-file cap). Uploads the original
// straight to R2 scratch storage (no size limit that matters here), then
// asks the server to compress it and finish the normal document pipeline.
//
// Files under 10MB should keep using lib/uploadDirect.ts unchanged — this
// file is ONLY for the large-file path.

import { UploadError, UploadResult } from './uploadDirect'

export async function uploadLargeDocument(
  file: File,
  onProgress?: (pct: number) => void,
  extraBody?: Record<string, any>
): Promise<UploadResult> {
  // Step 1: get a signed R2 upload URL
  const sigRes = await fetch('/api/upload/large-signature', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ filename: file.name, mimeType: file.type, fileSize: file.size }),
  })
  const sig = await sigRes.json().catch(() => ({}))
  if (!sigRes.ok) throw new UploadError(sig.error || 'Could not start upload', sig.code, sigRes.status)

  // Step 2: PUT the original file straight to R2 (XHR for progress events)
  await new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open('PUT', sig.uploadUrl)
    xhr.setRequestHeader('Content-Type', file.type)
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) {
        // Reserve the last 30% of the bar for server-side compression time
        onProgress(Math.round((e.loaded / e.total) * 70))
      }
    }
    xhr.onload = () => (xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new UploadError(`Upload failed (${xhr.status})`)))
    xhr.onerror = () => reject(new UploadError('Network error during upload'))
    xhr.send(file)
  })

  onProgress?.(75)

  // Step 3: server compresses + finishes processing (can take a while — no progress events here)
    const completeRes = await fetch('/api/upload/large-complete', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ r2Key: sig.r2Key, filename: file.name, ...(extraBody || {}) }),
  })
  const data = await completeRes.json().catch(() => ({}))
  if (!completeRes.ok) {
    throw new UploadError(data.error || 'Could not process the document', data.code, completeRes.status)
  }

  onProgress?.(100)
  return data as UploadResult
}