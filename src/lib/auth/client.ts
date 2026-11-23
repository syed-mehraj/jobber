'use client'

import { createAuthClient } from 'better-auth/react'

/** Browser side of Better Auth. Calls /api/auth on the same site, so sign-in is rate-limited there. */
export const authClient = createAuthClient()
