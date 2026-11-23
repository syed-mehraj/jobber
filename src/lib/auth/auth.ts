import 'server-only'
import { betterAuth, type BetterAuthOptions } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { nextCookies } from 'better-auth/next-js'
import { eq } from 'drizzle-orm'
import { getDb, type DB } from '@/db'
import { accounts, rateLimits, sessions, users, verifications, type Role } from '@/db/schema'
import { signupGate } from './gate'
import { findInviteByEmail, normalizeEmail } from './invites'
import { onAccountCreated } from './onboard'

/*
 * Sign-in (Better Auth): email + password, and "Continue with Google" when GOOGLE_CLIENT_ID and
 * GOOGLE_CLIENT_SECRET are set. Sessions live in the database. Invite-only:
 * - password accounts are created only by the /signup (invite link) and /setup (owner claim) server actions;
 * - Google creates an account only for an email with an open invite;
 * - everything else is refused by the user.create.before hook below.
 */

export const PASSWORD_MIN = 10
export const googleEnabled = () => Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET)

function baseURL(): BetterAuthOptions['baseURL'] {
  if (process.env.BETTER_AUTH_URL) return process.env.BETTER_AUTH_URL
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  // Local development on whichever port `next dev` uses.
  return { allowedHosts: ['localhost:*', '127.0.0.1:*'], fallback: 'http://localhost:3000', protocol: 'http' }
}

function options(db: DB) {
  return {
    appName: 'Jobber',
    baseURL: baseURL(),
    // The session secret from `npm run set-password` signs Better Auth's cookies too.
    secret: process.env.BETTER_AUTH_SECRET ?? process.env.SESSION_SECRET,
    database: drizzleAdapter(db, {
      provider: 'pg',
      schema: { user: users, session: sessions, account: accounts, verification: verifications, rateLimit: rateLimits },
    }),
    user: {
      additionalFields: {
        // Never settable from a request; set by the hook below.
        role: { type: 'string', defaultValue: 'user', input: false },
      },
    },
    emailAndPassword: { enabled: true, minPasswordLength: PASSWORD_MIN, maxPasswordLength: 128, autoSignIn: true },
    socialProviders: googleEnabled()
      ? {
          google: {
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
            prompt: 'select_account' as const,
          },
        }
      : {},
    account: {
      // Signing in with Google using the email of an existing account adds Google to that account.
      accountLinking: { enabled: true, trustedProviders: ['google'] },
      // Google's access/refresh tokens aren't used, but encrypt them at rest anyway.
      encryptOAuthTokens: true,
    },
    session: { expiresIn: 60 * 60 * 24 * 30, updateAge: 60 * 60 * 24 },
    // Sign-up happens only through the invite and setup server actions.
    disabledPaths: ['/sign-up/email'],
    rateLimit: {
      enabled: true,
      storage: 'database' as const,
      window: 60,
      max: 100,
      customRules: {
        '/sign-in/email': { window: 300, max: 10 },
        '/sign-in/social': { window: 60, max: 10 },
      },
    },
    advanced: { ipAddress: { ipAddressHeaders: ['x-forwarded-for', 'x-real-ip'] } },
    databaseHooks: {
      user: {
        create: {
          before: async (user: { email: string; emailVerified?: boolean } & Record<string, unknown>) => {
            const email = normalizeEmail(user.email)
            const pass = signupGate.getStore()
            let role: Role
            if (pass) {
              // Created by the invite or setup action, which already checked the link or the owner's password.
              if (pass.email !== email) return false
              if (pass.role === 'admin') {
                const [admin] = await db.select({ id: users.id }).from(users).where(eq(users.role, 'admin')).limit(1)
                if (admin) return false
              }
              role = pass.role
            } else {
              // Google: only an invited email, and only one Google says is verified.
              if (user.emailVerified !== true) return false
              if (!(await findInviteByEmail(db, email))) return false
              role = 'user'
            }
            return { data: { ...user, email, role, emailVerified: true } }
          },
          after: async (user: { id: string; email: string } & Record<string, unknown>) => {
            await onAccountCreated(db, { id: user.id, email: user.email, role: user.role as Role })
          },
        },
      },
    },
    plugins: [nextCookies()],
  } satisfies BetterAuthOptions
}

/** Exported for tests; the app uses getAuth(). */
export function createAuth(db: DB) {
  return betterAuth(options(db))
}

export type Auth = ReturnType<typeof createAuth>

const globalForAuth = globalThis as unknown as { __jobberAuth?: { db: DB; auth: Auth } }

/** The Better Auth instance, built once per database connection. */
export async function getAuth(): Promise<Auth> {
  const db = await getDb()
  const cached = globalForAuth.__jobberAuth
  if (cached && cached.db === db) return cached.auth
  const auth = createAuth(db)
  globalForAuth.__jobberAuth = { db, auth }
  return auth
}
