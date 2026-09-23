// FILE: lib/uploadDirect.ts
//
// Client-side (browser) helper for the 3-step direct upload flow:
//   1. POST /api/upload/signature   → get signed Cloudinary params
//   2. XHR POST straight to Cloudinary → upload the real file bytes.
//      This step never touches our Vercel functions, so file size is only
//      limited by Cloudinary's own ceiling, not Vercel's ~4.5MB body cap.
//   3. POST /api/upload/complete    → hand off the resulting URL so the
//      server can download, convert, extract and save it.
//
// Usage (in a 'use client' component):
//
//   import { uploadDocument, UploadError } from '@/lib/uploadDirect'
//
//   try {
//     const result = await uploadDocument(file, (pct) => setProgress(pct))
//   } catch (err) {
//     if (err instanceof UploadError && err.code === 'FILE_TOO_LARGE') { ... }
//   }

export interface UploadProgressCallback {
  (percent: number): void
}

export interface UploadResult {
  success: boolean
  documentId: string
  filename: string
  format: string
  numPages: number
  wordCount: number
  size: number
  cloudinaryOriginalUrl: string
  cloudinaryPdfUrl: string
  [key: string]: any
}

export class UploadError extends Error {
  code?: string
  status?: number
  constructor(message: string, code?: string, status?: number) {
    super(message)
    this.name = 'UploadError'
    this.code = code
    this.status = status
  }
}

interface SignaturePayload {
  signature: string
  timestamp: number
  apiKey: string
  folder: string
  publicId: string
  uploadUrl: string
  fileType: string
}

async function getSignature(file: File): Promise<SignaturePayload> {
  const res = await fetch('/api/upload/signature', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      filename: file.name,
      mimeType: file.type,
      fileSize: file.size,
    }),
  })

  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new UploadError(data.error || 'Could not start upload', data.code, res.status)
  }
  return data as SignaturePayload
}

// Uploads directly to Cloudinary using XHR (not fetch) so we get real
// upload progress events — fetch has no progress API for request bodies.
function uploadToCloudinaryDirect(
  file: File,
  sig: SignaturePayload,
  onProgress?: UploadProgressCallback
): Promise<{ secure_url: string; public_id: string; resource_type: string }> {
  return new Promise((resolve, reject) => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('api_key', sig.apiKey)
    formData.append('timestamp', String(sig.timestamp))
    formData.append('signature', sig.signature)
    formData.append('folder', sig.folder)
    formData.append('public_id', sig.publicId)

    const xhr = new XMLHttpRequest()
    xhr.open('POST', sig.uploadUrl)

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && onProgress) {
        onProgress(Math.round((event.loaded / event.total) * 100))
      }
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const result = JSON.parse(xhr.responseText)
          resolve({
  secure_url: result.secure_url,
  public_id: result.public_id,
  resource_type: result.resource_type,
})
        } catch {
          reject(new UploadError('Cloudinary returned an unreadable response'))
        }
      } else {
                let msg = `Upload to storage failed (${xhr.status})`
        try {
          msg = JSON.parse(xhr.responseText)?.error?.message || msg
        } catch {}
        console.error('Cloudinary upload error:', xhr.status, xhr.responseText)
        reject(new UploadError(msg))
      }
    }

    xhr.onerror = () => reject(new UploadError('Network error during upload'))
    xhr.send(formData)
  })
}

async function completeUpload(
  file: File,
  cloudinaryResult: { secure_url: string; public_id: string; resource_type: string }
): Promise<UploadResult> {
  const res = await fetch('/api/upload/complete', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      originalUrl: cloudinaryResult.secure_url,
      publicId: cloudinaryResult.public_id,
      filename: file.name,
      mimeType: file.type,
       resourceType: cloudinaryResult.resource_type,
    }),
  })

  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new UploadError(data.error || 'Could not finish processing the document', data.code, res.status)
  }
  return data as UploadResult
}

export async function uploadDocument(
  file: File,
  onProgress?: UploadProgressCallback
): Promise<UploadResult> {
  const sig = await getSignature(file)
  const cloudinaryResult = await uploadToCloudinaryDirect(file, sig, onProgress)
  return completeUpload(file, cloudinaryResult)
}