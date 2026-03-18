import { NextRequest, NextResponse } from 'next/server'
import { dbPromise } from '@/app/api/lib/mongodb'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params
    const body = await request.json()
    const { page, reaction, type, email, sessionId } = body

    const db = await dbPromise

    const share = await db.collection('shares').findOne({ shareToken: token })
    if (!share) return NextResponse.json({ success: false }, { status: 404 })

    await db.collection('document_reactions').insertOne({
      documentId: share.documentId.toString(),
      shareToken: token,
      userId: share.userId,
      page,
      reaction,
      type: type || 'page_clarity',  // 'page_clarity' or 'deal_intent'
      email: email || null,
      sessionId,
      createdAt: new Date(),
    })

    // If deal intent answer — this is critical sales data
    // Notify the owner immediately
    if (type === 'deal_intent') {
      const intentLabels: Record<string, string> = {
        ready_to_move_forward: 'Ready to move forward',
        need_more_info: 'Needs more information',
        discuss_with_team: 'Discussing with my team',
        not_interested: 'Not the right fit',
      }

      // Create in-app notification for owner
      const { createNotification } = await import('@/lib/notifications')
      await createNotification({
        userId: share.userId,
        type: 'signature',
        title: 'Deal Intent Signal',
        message: `${email || 'A viewer'} responded: "${intentLabels[reaction] || reaction}"`,
        documentId: share.documentId.toString(),
        metadata: { reaction, email, sessionId, shareToken: token },
      }).catch(() => {})
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ success: false }, { status: 500 })
  }
}