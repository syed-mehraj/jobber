import 'server-only'

/*
 * A thin Gemini REST client. Server-only: the key never leaves this module, is never logged and is
 * never part of an error message. One line is logged per call (model, tokens, duration), never the prompt.
 */

export class AiNotConfiguredError extends Error {
  constructor() {
    super('GEMINI_API_KEY is not set')
    this.name = 'AiNotConfiguredError'
  }
}

const DEFAULT_MODEL = 'gemini-2.5-flash'
const TIMEOUT_MS = 45_000

type GeminiResponse = {
  candidates?: { content?: { parts?: { text?: string }[] }; finishReason?: string }[]
  usageMetadata?: { promptTokenCount?: number; candidatesTokenCount?: number }
  error?: { message?: string }
}

export async function generateJson<T>(opts: {
  system: string
  prompt: string
  schema: object
  /** The answer and the model's own "thinking" share this budget, so leave room for both. */
  maxOutputTokens?: number
  /** Caps the thinking tokens (faster, and less likely to cut the answer off). */
  thinkingBudget?: number
}): Promise<{ data: T; usage: { input: number; output: number } }> {
  const key = process.env.GEMINI_API_KEY
  if (!key) throw new AiNotConfiguredError()
  const model = process.env.GEMINI_MODEL || DEFAULT_MODEL
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`
  const started = Date.now()

  let res: Response
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-goog-api-key': key },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: opts.system }] },
        contents: [{ role: 'user', parts: [{ text: opts.prompt }] }],
        generationConfig: {
          responseMimeType: 'application/json',
          responseSchema: opts.schema,
          temperature: 0.4,
          ...(opts.maxOutputTokens ? { maxOutputTokens: opts.maxOutputTokens } : {}),
          ...(opts.thinkingBudget !== undefined ? { thinkingConfig: { thinkingBudget: opts.thinkingBudget } } : {}),
        },
      }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
      cache: 'no-store',
    })
  } catch (e) {
    const timedOut = e instanceof Error && (e.name === 'TimeoutError' || e.name === 'AbortError')
    throw new Error(timedOut ? 'Gemini did not answer within 45 seconds.' : 'Could not reach Gemini.')
  }

  const ms = Date.now() - started
  const body = (await res.json().catch(() => null)) as GeminiResponse | null
  if (!res.ok) {
    console.warn(`[ai] model=${model} status=${res.status} ms=${ms}`)
    const detail = (body?.error?.message ?? '').split(key).join('***').slice(0, 300)
    throw new Error(`Gemini error ${res.status}${detail ? `: ${detail}` : ''}`)
  }

  const input = body?.usageMetadata?.promptTokenCount ?? 0
  const output = body?.usageMetadata?.candidatesTokenCount ?? 0
  console.info(`[ai] model=${model} in=${input} out=${output} ms=${ms}`)

  if (body?.candidates?.[0]?.finishReason === 'MAX_TOKENS')
    throw new Error('Gemini ran out of room before finishing its answer. Try again, or with a shorter request.')
  const text = body?.candidates?.[0]?.content?.parts?.[0]?.text
  if (typeof text !== 'string' || !text.trim()) throw new Error('Gemini returned no answer.')
  try {
    return { data: JSON.parse(text) as T, usage: { input, output } }
  } catch {
    throw new Error('Gemini returned an answer that is not valid JSON.')
  }
}
