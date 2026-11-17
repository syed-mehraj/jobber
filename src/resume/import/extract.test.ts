import { describe, expect, it, vi } from 'vitest'

vi.mock('server-only', () => ({}))

import { extractText, itemsToLines, normaliseText, UnsupportedFileError, type PdfTextItem } from './extract'

const enc = (s: string) => new TextEncoder().encode(s)

/** A one-page PDF drawn by hand, one Helvetica line per entry. */
function makePdf(lines: string[]): Uint8Array {
  const content = `BT /F1 12 Tf 14 TL 72 720 Td ${lines.map((l) => `(${l}) Tj T*`).join(' ')} ET`
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>',
    `<< /Length ${content.length} >>\nstream\n${content}\nendstream`,
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
  ]
  let out = '%PDF-1.4\n'
  const offsets: number[] = []
  objects.forEach((o, i) => {
    offsets.push(out.length)
    out += `${i + 1} 0 obj\n${o}\nendobj\n`
  })
  const xref = out.length
  out += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`
  out += offsets.map((o) => `${String(o).padStart(10, '0')} 00000 n \n`).join('')
  out += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`
  return enc(out)
}

describe('extractText', () => {
  it('decodes plain text and normalises it', async () => {
    const text = await extractText({
      name: 'resume.txt',
      type: 'text/plain',
      bytes: enc('  Jane   Doe \r\n\r\n\r\n\r\nSoftware\t Engineer  \r\n\r\n'),
    })
    expect(text).toBe('Jane Doe\n\nSoftware Engineer')
  })

  it('goes by the file extension when the browser sends no type', async () => {
    expect(await extractText({ name: 'cv.TXT', type: '', bytes: enc('Hello') })).toBe('Hello')
  })

  it('rejects other file types, including old .doc files', async () => {
    for (const file of [
      { name: 'resume.doc', type: 'application/msword' },
      { name: 'photo.png', type: 'image/png' },
      { name: 'noext', type: '' },
    ]) {
      const err = await extractText({ ...file, bytes: enc('x') }).catch((e: unknown) => e)
      expect(err).toBeInstanceOf(UnsupportedFileError)
      expect((err as Error).message).toBe('Upload a PDF, Word (.docx) or text file.')
    }
  })

  it('reads a PDF and keeps each line on its own line', async () => {
    const text = await extractText({
      name: 'resume.pdf',
      type: 'application/pdf',
      bytes: makePdf(['Jane Doe', 'Software Engineer | Acme | 2020 - 2024']),
    })
    expect(text.split('\n')).toEqual(['Jane Doe', 'Software Engineer | Acme | 2020 - 2024'])
  })

  it('reads a Word file', async () => {
    const JSZip = (await import('jszip')).default
    const zip = new JSZip()
    zip.file(
      '[Content_Types].xml',
      '<?xml version="1.0"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">' +
        '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>' +
        '<Default Extension="xml" ContentType="application/xml"/>' +
        '<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>',
    )
    zip.file(
      '_rels/.rels',
      '<?xml version="1.0"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
        '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>',
    )
    zip.file(
      'word/document.xml',
      '<?xml version="1.0"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>' +
        '<w:p><w:r><w:t>Jane Doe</w:t></w:r></w:p><w:p><w:r><w:t>Software Engineer</w:t></w:r></w:p></w:body></w:document>',
    )
    const bytes = await zip.generateAsync({ type: 'uint8array' })
    const text = await extractText({
      name: 'resume.docx',
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      bytes,
    })
    expect(text.split('\n').filter(Boolean)).toEqual(['Jane Doe', 'Software Engineer'])
  })

  it('says a damaged file could not be read, as an UnsupportedFileError', async () => {
    const err = await extractText({ name: 'bad.pdf', type: 'application/pdf', bytes: enc('not a pdf') }).catch(
      (e: unknown) => e,
    )
    expect(err).toBeInstanceOf(UnsupportedFileError)
  })
})

describe('normaliseText', () => {
  it('caps the text at 60,000 characters', () => {
    expect(normaliseText('a'.repeat(70_000))).toHaveLength(60_000)
  })
})

describe('itemsToLines', () => {
  const item = (str: string, x: number, y: number, width = str.length * 5): PdfTextItem => ({
    str,
    x,
    y,
    width,
    fontSize: 10,
  })

  it('groups items on one baseline into a line, left to right, with spaces only where there is a gap', () => {
    const lines = itemsToLines([
      item('Jul 2026 - Present', 400, 700),
      item('Software', 72, 700),
      item('Engineer', 72 + 8 * 5 + 3, 700.4),
      item('Acme', 200, 700),
      item('Corp', 200 + 4 * 5 + 4, 700),
    ])
    expect(lines).toEqual(['Software Engineer Acme Corp Jul 2026 - Present'])
  })

  it('starts a new line when the baseline moves and leaves a blank line for a big gap', () => {
    const lines = itemsToLines([item('Name', 72, 740), item('Email', 72, 727), item('Experience', 72, 690)])
    expect(lines).toEqual(['Name', 'Email', '', 'Experience'])
  })
})
