import { describe, expect, it } from 'vitest'
import { parseGoogleResults } from './google'

describe('parseGoogleResults', () => {
  it('reads the embedded job data and the total', () => {
    const job = ['123', 'Software Engineer, Early Career', 'x', [null, '<li>Build</li>'], [null, '<li>BS CS</li>']]
    const html = `<script>AF_initDataCallback({key: 'ds:1', hash: '2', data:${JSON.stringify([[job], null, 10, 14])}, sideChannel: {}});</script>`
    const { jobs, total } = parseGoogleResults(html)
    expect(total).toBe(14)
    expect(jobs[0][1]).toBe('Software Engineer, Early Career')
  })
  it('fails loudly when the page format changes', () => {
    expect(() => parseGoogleResults('<html>nothing here</html>')).toThrow(/format changed/)
  })
})
