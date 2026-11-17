import 'server-only'

/*
 * Resume upload, step 1: turn a PDF, Word (.docx) or text file into plain text with one resume line per text line.
 * The text is then parsed by parse.ts (or the AI parser). Nothing here reads or stores anything beyond the bytes it is given.
 */

export class UnsupportedFileError extends Error {
  constructor(message = 'Upload a PDF, Word (.docx) or text file.') {
    super(message)
    this.name = 'UnsupportedFileError'
  }
}

export const MAX_TEXT_CHARS = 60_000

const DOCX_TYPE = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'

/** The part of a pdf.js text item we need (unpdf's `extractTextItems` returns these). */
export type PdfTextItem = { str: string; x: number; y: number; width: number; fontSize: number }

/**
 * Rebuilds text lines from positioned pdf.js items of one page. Items that share a baseline (within half a font size)
 * form one line, read left to right; a larger vertical gap than usual leaves a blank line (a paragraph break).
 * Items stay in the order the PDF draws them, so two columns are read one after the other rather than interleaved.
 */
export function itemsToLines(items: PdfTextItem[]): string[] {
  type Line = { y: number; size: number; parts: PdfTextItem[] }
  const lines: Line[] = []
  for (const it of items) {
    if (!it.str) continue
    const last = lines.at(-1)
    const size = it.fontSize || 10
    if (last && Math.abs(it.y - last.y) <= Math.max(2, Math.min(size, last.size) * 0.5)) last.parts.push(it)
    else lines.push({ y: it.y, size, parts: [it] })
  }

  const out: string[] = []
  let prev: Line | undefined
  for (const line of lines) {
    const parts = [...line.parts].sort((a, b) => a.x - b.x)
    let text = ''
    let end = Number.NEGATIVE_INFINITY
    for (const p of parts) {
      const gap = p.x - end
      const needsSpace =
        text !== '' && !/\s$/.test(text) && !/^\s/.test(p.str) && gap > Math.max(1, (p.fontSize || line.size) * 0.15)
      text += (needsSpace ? ' ' : '') + p.str
      end = p.x + p.width
    }
    if (prev && prev.y - line.y > prev.size * 2.2) out.push('')
    out.push(text)
    prev = line
  }
  return out
}

/** pdf.js 5 uses `Iterator.prototype.join`; Node 20 has no global `Iterator`, so give it a minimal one. */
function ensureIterator() {
  const g = globalThis as { Iterator?: unknown }
  if (typeof g.Iterator !== 'undefined') return
  const proto = Object.getPrototypeOf(Object.getPrototypeOf([][Symbol.iterator]()))
  function Iterator() {}
  Iterator.prototype = proto
  g.Iterator = Iterator
}

async function extractPdf(bytes: Uint8Array): Promise<string> {
  ensureIterator()
  const { extractTextItems } = await import('unpdf')
  // pdf.js takes ownership of the buffer it is given, so hand it a copy.
  const { items } = await extractTextItems(new Uint8Array(bytes))
  return items.map((page) => itemsToLines(page).join('\n')).join('\n\n')
}

async function extractDocx(bytes: Uint8Array): Promise<string> {
  const mammoth = (await import('mammoth')).default
  const { value } = await mammoth.extractRawText({ buffer: Buffer.from(bytes) })
  return value
}

/** Line endings, runs of spaces, trailing spaces and runs of blank lines; capped at MAX_TEXT_CHARS. */
export function normaliseText(raw: string): string {
  const lines = raw
    .replace(/\r\n?/g, '\n')
    .replace(/\u0000/g, '')
    .replace(/[   \t\f\v]/g, ' ')
    .split('\n')
    .map((l) => l.replace(/ {2,}/g, ' ').trim())
  const out: string[] = []
  for (const l of lines) {
    if (l === '' && (out.length === 0 || out.at(-1) === '')) continue
    out.push(l)
  }
  while (out.at(-1) === '') out.pop()
  return out.join('\n').slice(0, MAX_TEXT_CHARS)
}

export async function extractText(file: { name: string; type: string; bytes: Uint8Array }): Promise<string> {
  const name = file.name.toLowerCase()
  const type = file.type.toLowerCase()
  let raw: string
  try {
    if (type === 'application/pdf' || name.endsWith('.pdf')) raw = await extractPdf(file.bytes)
    else if (type === DOCX_TYPE || name.endsWith('.docx')) raw = await extractDocx(file.bytes)
    else if (type === 'text/plain' || name.endsWith('.txt')) raw = new TextDecoder('utf-8').decode(file.bytes)
    else throw new UnsupportedFileError()
  } catch (e) {
    if (e instanceof UnsupportedFileError) throw e
    throw new UnsupportedFileError('That file could not be read. Try exporting it again as a PDF or .docx.')
  }
  return normaliseText(raw)
}
