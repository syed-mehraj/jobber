/**
 * Every source the search checks. Company boards were verified against each ATS's public API.
 * Edit here to add or remove companies; the app syncs this list into the database on start.
 */
export type CatalogEntry = { key: string; kind: string; name: string; config: Record<string, string> }

/** Aggregated lists that reach far beyond the company boards below. */
const aggregated: CatalogEntry[] = [
  {
    key: 'simplify:new-grad',
    kind: 'simplify',
    name: 'SimplifyJobs new-grad list',
    config: { repo: 'New-Grad-Positions', kind: 'new-grad' },
  },
  {
    key: 'simplify:internships',
    kind: 'simplify',
    name: 'SimplifyJobs internship list',
    config: { repo: 'Summer2027-Internships', kind: 'intern' },
  },
  {
    key: 'github:vanshb03-internships',
    kind: 'simplify',
    name: 'vanshb03 internship list',
    config: { owner: 'vanshb03', repo: 'Summer2027-Internships', kind: 'intern' },
  },
  { key: 'hn:who-is-hiring', kind: 'hackernews', name: 'Hacker News: Who is hiring', config: {} },
]

/** Company career boards (filled from the verified board list). */
const boards: CatalogEntry[] = []

export const catalog: CatalogEntry[] = [...aggregated, ...boards]
