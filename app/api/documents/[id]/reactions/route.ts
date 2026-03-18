import { NextRequest, NextResponse } from 'next/server'
import { verifyUserFromRequest } from '@/lib/auth'
import { dbPromise } from '@/app/api/lib/mongodb'
import { ObjectId } from 'mongodb'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await verifyUserFromRequest(request)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params
    const db = await dbPromise

    // Verify ownership
    const document = await db.collection('documents').findOne({
      _id: new ObjectId(id),
      userId: user.id,
    })
    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }

    const reactions = await db.collection('document_reactions')
      .find({ documentId: id })
      .sort({ createdAt: -1 })
      .toArray()

    // Group by type
    const pageClarity = reactions.filter(
      (r: any) => r.type === 'page_clarity' || !r.type
    )
    const dealIntent = reactions.filter(
      (r: any) => r.type === 'deal_intent'
    )

    // Summary per page
    const pageSummary: Record<number, {
      page: number
      clear: number
      confused: number
      viewers: string[]
    }> = {}

    pageClarity.forEach((r: any) => {
      const p = r.page
      if (!pageSummary[p]) {
        pageSummary[p] = { page: p, clear: 0, confused: 0, viewers: [] }
      }
      if (r.reaction === 'clear') pageSummary[p].clear++
      if (r.reaction === 'confused') pageSummary[p].confused++
      if (r.email && !pageSummary[p].viewers.includes(r.email)) {
        pageSummary[p].viewers.push(r.email)
      }
    })

    // Deal intent summary
    const intentSummary: Record<string, number> = {}
    dealIntent.forEach((r: any) => {
      intentSummary[r.reaction] = (intentSummary[r.reaction] || 0) + 1
    })

    return NextResponse.json({
      success: true,
      reactions: reactions.map((r: any) => ({
        ...r,
        _id: r._id.toString(),
      })),
      pageSummary: Object.values(pageSummary).sort((a, b) => a.page - b.page),
      intentSummary,
      totalPageReactions: pageClarity.length,
      totalIntentResponses: dealIntent.length,
    })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch reactions' }, { status: 500 })
  }
}