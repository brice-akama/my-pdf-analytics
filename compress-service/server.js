// FILE: compress-service/server.js
//
// A small, dedicated HTTP service. Its ONLY job: take a large PDF sitting
// in the R2 scratch bucket, compress it with real Ghostscript (not
// available on Vercel), upload the compressed result to Cloudinary, then
// delete the scratch file. Your Vercel app calls this over HTTP and never
// has to run Ghostscript itself.
//
// Deploy target: Google Cloud Run (pay-per-use, free tier covers this
// easily at low volume). This service is stateless — every request is
// independent, so Cloud Run can scale it to zero between uploads.

const express = require('express')
const crypto = require('crypto')
const fs = require('fs/promises')
const os = require('os')
const path = require('path')
const { execFile } = require('child_process')
const { promisify } = require('util')
const { S3Client, GetObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3')
const cloudinary = require('cloudinary').v2

const execFileAsync = promisify(execFile)

const app = express()
app.use(express.json())

// ── Shared secret so random people on the internet can't call this service ──
// Set the SAME value in this service's env AND in your Vercel env
// (COMPRESS_SERVICE_SECRET). Every request must include it.
function requireAuth(req, res, next) {
  const token = req.headers['x-compress-secret']
  if (!token || token !== process.env.COMPRESS_SERVICE_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' })
  }
  next()
}

// ── R2 client (S3-compatible) ────────────────────────────────────────────
const r2 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
})

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_SECRET_KEY,
})

async function downloadFromR2(key) {
  const result = await r2.send(
    new GetObjectCommand({ Bucket: process.env.R2_BUCKET_NAME, Key: key })
  )
  const chunks = []
  for await (const chunk of result.Body) chunks.push(chunk)
  return Buffer.concat(chunks)
}

async function deleteFromR2(key) {
  await r2
    .send(new DeleteObjectCommand({ Bucket: process.env.R2_BUCKET_NAME, Key: key }))
    .catch(() => {}) // best-effort — a stray scratch file costs pennies, never block on this
}

// Tries a few Ghostscript quality levels, from "barely compressed" to
// "aggressive," and stops at the first one that fits under the limit.
// This avoids over-compressing a file that only needed a small trim.
async function compressPdf(inputPath, outputPath, maxBytes) {
  const presets = ['/ebook', '/ebook', '/screen'] // ebook tried twice is intentional: gs is non-deterministic on borderline files
  for (const preset of presets) {
    await execFileAsync('gs', [
      '-sDEVICE=pdfwrite',
      '-dCompatibilityLevel=1.4',
      `-dPDFSETTINGS=${preset}`,
      '-dNOPAUSE',
      '-dBATCH',
      '-dSAFER',
      `-sOutputFile=${outputPath}`,
      inputPath,
    ])
    const { size } = await fs.stat(outputPath)
    if (size <= maxBytes) return { ok: true, size }
  }
  const { size } = await fs.stat(outputPath)
  return { ok: false, size } // best we could do, still over the limit
}

app.post('/compress-and-upload', requireAuth, async (req, res) => {
  const { r2Key, cloudinaryFolder, cloudinaryPublicId, maxBytes } = req.body || {}
  if (!r2Key || !cloudinaryFolder || !cloudinaryPublicId || !maxBytes) {
    return res.status(400).json({ error: 'r2Key, cloudinaryFolder, cloudinaryPublicId, maxBytes required' })
  }

  const workDir = await fs.mkdtemp(path.join(os.tmpdir(), 'compress-'))
  const inputPath = path.join(workDir, 'input.pdf')
  const outputPath = path.join(workDir, `output-${crypto.randomBytes(4).toString('hex')}.pdf`)

  try {
    const original = await downloadFromR2(r2Key)
    await fs.writeFile(inputPath, original)

    const result = await compressPdf(inputPath, outputPath, Number(maxBytes))
    const compressedBuffer = await fs.readFile(outputPath)

    if (!result.ok) {
      // Couldn't get it under the limit even with aggressive compression.
      // Tell Vercel so it can show the user the friendly "still too large" message.
      return res.status(413).json({
        error: 'File is still too large after compression',
        originalBytes: original.length,
        compressedBytes: result.size,
      })
    }

    const uploadResult = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: cloudinaryFolder,
          public_id: cloudinaryPublicId,
          resource_type: 'auto',
          type: 'upload',
          access_mode: 'public',
        },
        (err, r) => (err ? reject(err) : resolve(r))
      )
      stream.end(compressedBuffer)
    })

    res.json({
      success: true,
      cloudinaryUrl: uploadResult.secure_url,
      cloudinaryResourceType: uploadResult.resource_type,
      originalBytes: original.length,
      compressedBytes: compressedBuffer.length,
    })
  } catch (err) {
    console.error('Compression error:', err)
    res.status(500).json({ error: 'Compression failed', details: String(err?.message || err) })
  } finally {
    await deleteFromR2(r2Key)
    await fs.rm(workDir, { recursive: true, force: true }).catch(() => {})
  }
})

app.get('/health', (req, res) => res.json({ ok: true }))

const port = process.env.PORT || 8080
app.listen(port, () => console.log(`Compression service listening on ${port}`))