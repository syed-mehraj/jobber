import { desc, eq } from 'drizzle-orm'
import { getDb } from '@/db'
import { resumeFiles } from '@/db/schema'
import { hasSession } from '@/lib/auth/session'

/** Downloads the original file uploaded for a resume. */
export async function GET(_request: Request, ctx: RouteContext<'/resumes/[id]/file'>) {
  if (!(await hasSession())) return new Response('Sign in first', { status: 401 })
  const id = Number((await ctx.params).id)
  if (!Number.isInteger(id)) return new Response('Not found', { status: 404 })
  const db = await getDb()
  const [file] = await db
    .select()
    .from(resumeFiles)
    .where(eq(resumeFiles.resumeId, id))
    .orderBy(desc(resumeFiles.createdAt))
    .limit(1)
  if (!file) return new Response('Not found', { status: 404 })
  const safeName = file.name.replace(/[^\w.\- ]+/g, '_')
  return new Response(Buffer.from(file.data), {
    headers: {
      'content-type': file.mime,
      'content-length': String(file.size),
      'content-disposition': `attachment; filename="${safeName}"`,
      'cache-control': 'private, no-store',
      'x-content-type-options': 'nosniff',
    },
  })
}
