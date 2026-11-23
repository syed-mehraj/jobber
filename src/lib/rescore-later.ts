import 'server-only'
import { after } from 'next/server'
import { getDb } from '@/db'
import { rescore } from '@/jobs/matches'

/** Re-scores one person's matches after the response is sent (they changed their master resume or About you). */
export function rescoreLater(userId: string): void {
  after(async () => {
    try {
      await rescore(await getDb(), { userIds: [userId] })
    } catch (e) {
      console.error('[matches] rescore failed:', e instanceof Error ? e.message : e)
    }
  })
}
