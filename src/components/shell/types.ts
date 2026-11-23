export type User = { firstName: string; initials: string; isAdmin?: boolean }

/** What the header and menu show from the database. Null while it loads. */
export type ShellData = {
  counts: { resumes: number; newMatches: number; applied: number } | null
  search: { label: string; detail: string; healthy: boolean; running: boolean } | null
}

export type ShellActions = {
  runSearchNow: () => Promise<{ ok: boolean; message: string }>
  signOut: () => Promise<void>
}
