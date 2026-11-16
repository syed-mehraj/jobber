import { timingSafeEqual } from 'node:crypto'
import { getDb } from '@/db'
import { runSearch } from '@/jobs/run'

/**
 * Scheduled search. Vercel Cron calls this with "Authorization: Bearer $CRON_SECRET" (see vercel.json).
 * It sits outside the sign-in (the proxy lets /api/cron through), so the secret is the only key.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET
  const given = request.headers.get('authorization') ?? ''
  const expected = `Bearer ${secret}`
  const ok =
    Boolean(secret) && given.length === expected.length && timingSafeEqual(Buffer.from(given), Buffer.from(expected))
  if (!ok) return Response.json({ error: 'Not allowed' }, { status: 401 })

  const summary = await runSearch(await getDb(), 'cron')
  return Response.json(summary ?? { skipped: 'A search is already running.' })
}
