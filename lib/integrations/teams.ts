// lib/integrations/teams.ts
import { dbPromise } from '@/app/api/lib/mongodb'

export async function isTeamsConnected(userId: string): Promise<boolean> {
  try {
    const db          = await dbPromise
    const integration = await db.collection('integrations').findOne({
      userId,
      provider:  'teams',
      isActive:  true,
      teamId:    { $exists: true },
      channelId: { $exists: true },
    })
    return !!integration
  } catch {
    return false
  }
}