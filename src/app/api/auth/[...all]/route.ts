import { getAuth } from '@/lib/auth/auth'

/** Better Auth's endpoints: sign in, sign out, Google callback, session… (see src/lib/auth/auth.ts). */
async function handle(request: Request): Promise<Response> {
  return (await getAuth()).handler(request)
}

export const GET = handle
export const POST = handle
