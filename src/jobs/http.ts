/** Fetch helpers for job sources: timeouts, a plain user agent, and JSON parsing with clear errors. */

const USER_AGENT = 'Mozilla/5.0 (compatible; JobberPersonalSearch/0.1)'

export async function fetchJson<T>(url: string, init: RequestInit & { timeoutMs?: number } = {}): Promise<T> {
  const { timeoutMs = 20000, headers, ...rest } = init
  const res = await fetch(url, {
    ...rest,
    headers: { 'user-agent': USER_AGENT, accept: 'application/json', ...headers },
    signal: AbortSignal.timeout(timeoutMs),
    cache: 'no-store',
  })
  if (!res.ok) throw new Error(`HTTP ${res.status} from ${new URL(url).host}`)
  return (await res.json()) as T
}

const ENTITIES: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: ' ',
  '#39': "'",
  '#x27': "'",
  '#x2F': '/',
}

/** HTML (possibly entity-escaped, as Greenhouse sends it) to trimmed plain text. */
export function htmlToText(html: string | undefined | null, max = 4000): string | undefined {
  if (!html) return undefined
  const decode = (s: string) =>
    s.replace(/&(#\d+|#x[0-9a-f]+|[a-z]+);/gi, (m, code: string) => {
      if (code[0] === '#') {
        const n = code[1] === 'x' || code[1] === 'X' ? parseInt(code.slice(2), 16) : parseInt(code.slice(1), 10)
        return Number.isFinite(n) ? String.fromCodePoint(n) : m
      }
      return ENTITIES[code.toLowerCase()] ?? m
    })
  const text = decode(
    decode(html)
      .replace(/<(br|\/p|\/li|\/h\d|\/div)[^>]*>/gi, '\n')
      .replace(/<[^>]+>/g, ' '),
  )
    .replace(/[ \t\f\v]+/g, ' ')
    .replace(/\s*\n\s*/g, '\n')
    .trim()
  return text.length > max ? `${text.slice(0, max)}…` : text
}

export function toDate(value: unknown): Date | undefined {
  if (value === null || value === undefined || value === '') return undefined
  const d = typeof value === 'number' ? new Date(value < 1e12 ? value * 1000 : value) : new Date(String(value))
  return Number.isNaN(d.getTime()) ? undefined : d
}
