import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('server-only', () => ({}))

import { AiNotConfiguredError, generateJson } from './gemini'

const KEY = 'test-key-abc123'
const opts = { system: 'sys', prompt: 'hello', schema: { type: 'OBJECT' } }

const ok = (text: string) =>
  new Response(
    JSON.stringify({
      candidates: [{ content: { parts: [{ text }] } }],
      usageMetadata: { promptTokenCount: 12, candidatesTokenCount: 5 },
    }),
    { status: 200 },
  )

beforeEach(() => {
  vi.stubEnv('GEMINI_API_KEY', KEY)
  vi.stubEnv('GEMINI_MODEL', '')
  vi.spyOn(console, 'info').mockImplementation(() => {})
  vi.spyOn(console, 'warn').mockImplementation(() => {})
})
afterEach(() => {
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('generateJson', () => {
  it('sends a thinking cap when asked, and says so clearly when the answer is cut off', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(
        new Response(
          JSON.stringify({ candidates: [{ finishReason: 'MAX_TOKENS', content: { parts: [{ text: '{"a":' }] } }] }),
          { status: 200 },
        ),
      )
    vi.stubGlobal('fetch', fetchMock)
    await expect(generateJson({ ...opts, maxOutputTokens: 100, thinkingBudget: 256 })).rejects.toThrow(
      /ran out of room/,
    )
    const sent = JSON.parse(fetchMock.mock.calls[0][1].body)
    expect(sent.generationConfig.thinkingConfig).toEqual({ thinkingBudget: 256 })
    expect(sent.generationConfig.maxOutputTokens).toBe(100)
  })

  it('sends the key header, schema and system instruction, and parses the answer and usage', async () => {
    const fetchMock = vi.fn().mockResolvedValue(ok('{"a":1}'))
    vi.stubGlobal('fetch', fetchMock)
    const r = await generateJson<{ a: number }>(opts)
    expect(r).toEqual({ data: { a: 1 }, usage: { input: 12, output: 5 } })

    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent')
    expect(init.headers['x-goog-api-key']).toBe(KEY)
    expect(url).not.toContain(KEY)
    const body = JSON.parse(init.body)
    expect(body.systemInstruction.parts[0].text).toBe('sys')
    expect(body.contents[0].parts[0].text).toBe('hello')
    expect(body.generationConfig).toMatchObject({
      responseMimeType: 'application/json',
      responseSchema: { type: 'OBJECT' },
      temperature: 0.4,
    })
  })
  it('uses GEMINI_MODEL when set and logs one line without prompt or key', async () => {
    vi.stubEnv('GEMINI_MODEL', 'gemini-test')
    const fetchMock = vi.fn().mockResolvedValue(ok('{}'))
    vi.stubGlobal('fetch', fetchMock)
    await generateJson(opts)
    expect(fetchMock.mock.calls[0][0]).toContain('/models/gemini-test:generateContent')
    const info = vi.mocked(console.info).mock.calls
    expect(info).toHaveLength(1)
    expect(String(info[0][0])).toContain('model=gemini-test')
    expect(String(info[0][0])).toContain('in=12')
    expect(String(info[0][0])).not.toContain(KEY)
    expect(String(info[0][0])).not.toContain('hello')
  })
  it('throws AiNotConfiguredError without a key and does not call fetch', async () => {
    vi.stubEnv('GEMINI_API_KEY', '')
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    await expect(generateJson(opts)).rejects.toBeInstanceOf(AiNotConfiguredError)
    expect(fetchMock).not.toHaveBeenCalled()
  })
  it('includes the status and Google message in errors, never the key', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValue(new Response(JSON.stringify({ error: { message: `Bad key ${KEY}` } }), { status: 403 })),
    )
    const err = await generateJson(opts).catch((e: Error) => e)
    expect(err).toBeInstanceOf(Error)
    expect((err as Error).message).toContain('403')
    expect((err as Error).message).toContain('Bad key')
    expect((err as Error).message).not.toContain(KEY)
  })
  it('reports network failures and invalid JSON readably', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error(`boom ${KEY}`)))
    const net = await generateJson(opts).catch((e: Error) => e)
    expect((net as Error).message).not.toContain(KEY)
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(ok('not json')))
    await expect(generateJson(opts)).rejects.toThrow(/not valid JSON/)
  })
})
