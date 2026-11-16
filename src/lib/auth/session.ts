import 'server-only'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { createSessionToken, SESSION_COOKIE, SESSION_DAYS, verifySessionToken } from './session-token'

/** True when the request carries a valid session cookie. */
export async function hasSession(): Promise<boolean> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value
  return verifySessionToken(token, process.env.SESSION_SECRET)
}

/**
 * The data-access check. The proxy already redirects signed-out visits, but every data read and
 * server action calls this too, so nothing depends on the proxy alone.
 */
export async function requireSession(): Promise<void> {
  if (!(await hasSession())) redirect('/login')
}

export async function startSession(): Promise<void> {
  const secret = process.env.SESSION_SECRET
  if (!secret) throw new Error('SESSION_SECRET is not set')
  ;(await cookies()).set(SESSION_COOKIE, await createSessionToken(secret), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_DAYS * 24 * 60 * 60,
  })
}

export async function endSession(): Promise<void> {
  ;(await cookies()).delete(SESSION_COOKIE)
}
