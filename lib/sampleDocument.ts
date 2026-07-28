// lib/sampleDocument.ts
//
// Creates a personal, isolated copy of YOUR sample document for a given
// user — same pattern as the client-copy/use-template flow: one source
// document, many independent copies, each with its own real (not fake)
// analytics. Option A from our earlier discussion: no pre-seeded fake
// activity — the user has to actually create a link and open it to see
// real numbers, same as any other document.
//
// Idempotent — calling this twice for the same user never creates a
// second sample. Never throws — every caller can fire-and-forget this
// safely (used at signup) or call it directly and check the return
// value (used by the on-demand API route).

import { ObjectId } from 'mongodb'

// Set once, after you upload your sample PDF as yourself — grab the id
// from the URL after upload (redirects to /documents/<id>) and put it
// in Vercel env vars as SAMPLE_DOCUMENT_ID (all three environments).
const SAMPLE_DOCUMENT_ID = process.env.SAMPLE_DOCUMENT_ID || null

export async function createSampleDocumentForUser(
  db: any,
  {
    userId,
    plan,
    organizationId,
  }: { userId: string; plan: string; organizationId: string | null }
): Promise<string | null> {
  try {
    if (!SAMPLE_DOCUMENT_ID) {
      console.warn('⚠️ SAMPLE_DOCUMENT_ID not set — skipping sample document creation')
      return null
    }

    // Idempotent check — never create a second sample for the same user
    const existing = await db.collection('documents').findOne({
      userId,
      isSample: true,
    })
    if (existing) return existing._id.toString()

    const source = await db.collection('documents').findOne({
      _id: new ObjectId(SAMPLE_DOCUMENT_ID),
    })
    if (!source) {
      console.error('❌ SAMPLE_DOCUMENT_ID does not match any document in the database')
      return null
    }

    const sampleDoc = {
      userId,
      plan,
      organizationId: organizationId || null,
      version: 1,
      originalFilename: 'Sample Proposal (try it out)',
      originalFormat: source.originalFormat,
      visibility: 'personal',
      mimeType: source.mimeType,
      size: source.size,
      pdfSize: source.pdfSize,
      cloudinaryOriginalUrl: source.cloudinaryOriginalUrl,
      cloudinaryPdfUrl: source.cloudinaryPdfUrl,
      extractedText: source.extractedText || '',
      numPages: source.numPages,
      wordCount: source.wordCount,
      charCount: source.charCount,
      summary: source.summary || null,
      scannedPdf: source.scannedPdf || false,
      analytics: {
        views: 0,
        uniqueVisitors: [],
        downloads: 0,
        shares: 0,
        averageViewTime: 0,
        lastViewed: null,
      },
      tracking: {
        views: 0,
        uniqueVisitors: [],
        downloads: 0,
        shares: 0,
        averageViewTime: 0,
        viewsByPage: Array(source.numPages || 1).fill(0),
        lastViewed: null,
      },
      isPublic: false,
      sharedWith: [],
      shareLinks: [],
      tags: [],
      folder: null,
      starred: false,
      archived: false,
      isTemplate: false,
      // Marks this as demo content — exclude from admin metrics later,
      // and the document page can show a "this is a sample" banner.
      isSample: true,
      sourceDocumentId: SAMPLE_DOCUMENT_ID,
      dealOutcome: null,
      dealOutcomeSetAt: null,
      dealOutcomeSetBy: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastAnalyzedAt: null,
    }

    const result = await db.collection('documents').insertOne(sampleDoc)
    return result.insertedId.toString()
  } catch (err) {
    console.error('[SampleDocument] creation failed:', err)
    return null
  }
}