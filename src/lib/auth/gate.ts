import { AsyncLocalStorage } from 'node:async_hooks'
import type { Role } from '@/db/schema'

/**
 * Who may create an account. The public sign-up endpoint is disabled; the invite and setup server actions
 * check the invite link or the owner's password first, then create the account inside `signupGate.run(...)`.
 * The database hook in auth.ts accepts a password sign-up only when this context is present and the email
 * matches, so nothing else can create a password account.
 */
export type SignupPass = { email: string; role: Role }

/*
 * Kept on globalThis: Next bundles route handlers and server actions separately, so this module can be loaded
 * twice. The auth instance (also global) must see the same store the server actions write to.
 */
const g = globalThis as unknown as { __jobberSignupGate?: AsyncLocalStorage<SignupPass> }
export const signupGate = (g.__jobberSignupGate ??= new AsyncLocalStorage<SignupPass>())
