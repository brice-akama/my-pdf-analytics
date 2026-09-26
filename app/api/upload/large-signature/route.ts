// FILE: app/api/upload/large-signature/route.ts
//
// Step 1 of the LARGE FILE path (files over 10MB). Gives the browser a
// short-lived signed URL to upload the original PDF straight into the R2
// scratch bucket. This never touches Cloudinary and never touches a Vercel
// function body — R2 has no small per-file cap like Cloudinary's free plan.
//
// Files under 10MB never come through this route — they keep using the
// existing Cloudinary-direct path untouched.

import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { checkAccess } from '@/lib/checkAccess'
import { getR2UploadUrl } from '@/lib/r2Client'
import { isStorageAvailable } from '@/lib/planLimits'

export async function POST(request: NextRequest) {
  const access = await checkAccess(request)
  if (!access.ok) return access.response
  const { user, plan, limits } = access

  const { filename, mimeType, fileSize } = await request.json().catch(() => ({}))
  if (!filename || !mimeType || typeof fileSize !== 'number') {
    return NextResponse.json({ error: 'filename, mimeType and fileSize are required' }, { status: 400 })
  }
  if (mimeType !== 'application/pdf') {
    return NextResponse.json({ error: 'Only PDF files can use large-file upload' }, { status: 400 })
  }

  // Plan storage cap still applies — a Pro user's 500MB cap, a trial's, etc.
  // (The 10MB CLOUDINARY cap is a storage-provider limit, not a plan limit —
  // this whole large-file path exists specifically to get around that one.)
  const storageUsedBytes: number = user.totalStorageUsedBytes ?? 0
  if (!isStorageAvailable(plan, storageUsedBytes, fileSize)) {
    const usedMB = Math.round(storageUsedBytes / (1024 * 1024))
    const limitMB = Math.round(limits.storageLimitBytes / (1024 * 1024))
    return NextResponse.json(
      {
        error: `Storage full. You are using ${usedMB}MB of your ${limitMB}MB limit. Delete some files or upgrade your plan.`,
        code: 'STORAGE_LIMIT_REACHED',
      },
      { status: 403 }
    )
  }

  // Scoped to this user's own folder, same pattern as your Cloudinary keys
  const r2Key = `scratch/${user._id.toString()}/${crypto.randomUUID()}.pdf`
  const uploadUrl = await getR2UploadUrl(r2Key, mimeType)

  return NextResponse.json({ uploadUrl, r2Key })
}