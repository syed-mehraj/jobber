import { getSessionCookie } from 'better-auth/cookies'
import { NextResponse, type NextRequest } from 'next/server'

/**
 * Paths reachable without signing in. The cron endpoint checks its own secret; /api/auth is Better Auth.
 * This only checks that a session cookie is present, to redirect quickly. The real check (the session
 * in the database) happens in every data read and server action (src/lib/auth/session.ts).
 */
const PUBLIC = ['/login', '/signup', '/api/auth', '/api/cron']

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  if (PUBLIC.some((p) => pathname === p || pathname.startsWith(`${p}/`))) return NextResponse.next()

  if (getSessionCookie(request)) return NextResponse.next()

  if (pathname.startsWith('/api/')) {
    return NextResponse.json({ error: 'Sign in first' }, { status: 401 })
  }
  return NextResponse.redirect(new URL('/login', request.url))
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|robots.txt).*)'],
}
