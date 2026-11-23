import 'server-only'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { cache } from 'react'
import type { Role } from '@/db/schema'
import { getAuth } from './auth'
import { isOwnerEmail } from './owner'

export type CurrentUser = { id: string; name: string; email: string; role: Role; image: string | null }

/** The signed-in person, read from the session in the database (once per request), or null. */
export const getUser = cache(async (): Promise<CurrentUser | null> => {
  const auth = await getAuth()
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) return null
  const u = session.user
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    // Admin only for the owner set in the environment (OWNER_EMAIL), whatever the database says.
    role: (u as { role?: string }).role === 'admin' && isOwnerEmail(u.email) ? 'admin' : 'user',
    image: u.image ?? null,
  }
})

/**
 * The data-access check. The proxy already redirects signed-out visits, but every data read and
 * server action calls this too, so nothing depends on the proxy alone.
 */
export async function requireUser(): Promise<CurrentUser> {
  const user = await getUser()
  if (!user) redirect('/login')
  return user
}

export async function requireAdmin(): Promise<CurrentUser> {
  const user = await requireUser()
  if (user.role !== 'admin') redirect('/')
  return user
}

export const isAdmin = (user: Pick<CurrentUser, 'role'>) => user.role === 'admin'
