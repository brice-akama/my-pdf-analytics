// app/api/spaces/[id]/branding/logo/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { dbPromise } from '@/app/api/lib/mongodb'
import { verifyUserFromRequest } from '@/lib/auth'
import { ObjectId } from 'mongodb'
import cloudinary from 'cloudinary'
import streamifier from 'streamifier'

cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_SECRET_KEY,
})

async function uploadToCloudinary(buffer: Buffer, filename: string, folder: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.v2.uploader.upload_stream(
      {
        folder,
        public_id:   filename.replace(/\.[^/.]+$/, ''),
        resource_type: 'image',
        type:          'upload',
        access_mode:   'public',
        overwrite:     true,
      },
      (error, result) => {
        if (error) return reject(error)
        resolve(result?.secure_url || '')
      }
    )
    streamifier.createReadStream(buffer).pipe(stream)
  })
}

export async function POST(
  request: NextRequest,
  context: { params: { id: string } | Promise<{ id: string }> }
) {
  try {
    const params  = context.params instanceof Promise ? await context.params : context.params
    const spaceId = params.id

    const user = await verifyUserFromRequest(request)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const db    = await dbPromise
    const space = await db.collection('spaces').findOne({ _id: new ObjectId(spaceId) })
    if (!space) return NextResponse.json({ error: 'Space not found' }, { status: 404 })

    const isOwner  = space.userId === user.id || space.createdBy === user.id
    const isMember = space.members?.some(
      (m: any) => m.email === user.email && ['owner', 'admin', 'editor'].includes(m.role)
    )
    if (!isOwner && !isMember) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const formData = await request.formData()
    const file     = formData.get('file') as File | null
    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })

    const allowed = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml', 'image/webp']
    if (!allowed.includes(file.type)) {
      return NextResponse.json({ error: 'Only PNG, JPG, SVG, or WEBP images allowed' }, { status: 400 })
    }

    const bytes  = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    const folder  = `spaces/${spaceId}/branding`
    const logoUrl = await uploadToCloudinary(buffer, `logo_${spaceId}`, folder)

    console.log('✅ Logo uploaded:', logoUrl)

    return NextResponse.json({ success: true, url: logoUrl })

  } catch (err) {
    console.error('❌ Logo upload error:', err)
    return NextResponse.json({ error: 'Failed to upload logo' }, { status: 500 })
  }
}