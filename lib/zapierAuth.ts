import { clientPromise } from '@/app/api/lib/mongodb'
import { NextRequest } from 'next/server'
 

export async function verifyZapierApiKey(req: NextRequest) {
  try {
    // Zapier sends: Authorization: Bearer zap_xxxxx
    const authHeader = req.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) return null

    const apiKey = authHeader.replace('Bearer ', '').trim()
    if (!apiKey) return null

    const client = await clientPromise
    const db = client.db()

    const keyDoc = await db.collection('zapier_api_keys').findOne({
      apiKey,
      isActive: true
    })

    if (!keyDoc) return null

    return {
      userId: keyDoc.userId,
      email: keyDoc.userEmail
    }
  } catch (error) {
    console.error('Zapier auth error:', error)
    return null
  }
}