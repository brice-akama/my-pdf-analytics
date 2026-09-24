// FILE: lib/uploadConstants.ts
//
// Shared between /api/upload/signature and /api/upload/complete so the two
// routes can never drift out of sync on which mime types are accepted

export const SUPPORTED_FORMATS = {
  'application/pdf': 'pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
  'application/msword': 'doc',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
  'application/vnd.ms-excel': 'xls',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'pptx',
  'application/vnd.ms-powerpoint': 'ppt',
  'text/plain': 'txt',
  'text/html': 'html',
  'text/markdown': 'md',
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/gif': 'gif',
  'image/webp': 'webp',
} as const

export type SupportedMimeType = keyof typeof SUPPORTED_FORMATS


// Per-file limit of the CURRENT Cloudinary plan (free plan = 10,485,760 bytes).
// Change this ONE number when you move to bigger storage.
export const MAX_STORAGE_FILE_BYTES = 10 * 1024 * 1024

export function tooLargeForStorage(bytes: number) {
  const mb = (bytes / (1024 * 1024)).toFixed(1)
  return {
    error: `This file is ${mb} MB. Files over 10 MB aren't supported yet. Please compress it and try again.`,
    code: 'FILE_TOO_LARGE',
    limitBytes: MAX_STORAGE_FILE_BYTES,
  }
}