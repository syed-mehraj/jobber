import { and, desc, eq } from 'drizzle-orm'
import { getDb } from '@/db'
import { resumeFiles } from '@/db/schema'
import { getUser } from '@/lib/auth/session'

/** Downloads the original file uploaded for a resume. */
export async function GET(_request: Request, ctx: RouteContext<'/resumes/[id]/file'>) {
  const user = await getUser()
  if (!user) return new Response('Sign in first', { status: 401 })
  const id = Number((await ctx.params).id)
  if (!Number.isInteger(id)) return new Response('Not found', { status: 404 })
  const db = await getDb()
  const [file] = await db
    .select()
    .from(resumeFiles)
    // Only the owner's own files; anyone else gets the same "Not found".
    .where(and(eq(resumeFiles.resumeId, id), eq(resumeFiles.userId, user.id)))
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
