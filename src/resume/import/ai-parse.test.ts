import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('server-only', () => ({}))

import { allIds, toContent } from '../types'
import { aiParseResume } from './ai-parse'

const RESUME = `Jane Doe
Hyderabad, India | jane@example.com | github.com/janedoe
Experience
Backend Intern | Acme Labs | Jun 2025 - Aug 2025
• Built a caching layer that reduced database load by a third
Skills
Languages: Python, Go`

const MODEL_JSON = {
  contact: {
    name: 'Jane Doe',
    title: '',
    location: 'Hyderabad, India',
    email: 'jane@example.com',
    github: 'https://github.com/janedoe/',
    linkedin: '',
    website: '',
  },
  summary: '',
  experience: [
    {
      company: 'Acme Labs',
      role: 'Backend Intern',
      location: '',
      start: 'Jun 2025',
      end: 'Aug 2025',
      bullets: ['Built a caching layer that reduced database load by a third'],
    },
  ],
  projects: [],
  education: [],
  skills: [{ label: 'Languages', items: ['Python', 'Go'] }],
  certifications: [],
  customTitle: '',
  customBullets: [],
  order: ['experience', 'skills'],
}

const reply = (data: unknown) =>
  new Response(JSON.stringify({ candidates: [{ content: { parts: [{ text: JSON.stringify(data) }] } }] }), {
    status: 200,
  })

beforeEach(() => {
  vi.stubEnv('GEMINI_API_KEY', 'test-key-abc123')
  vi.spyOn(console, 'info').mockImplementation(() => {})
  vi.spyOn(console, 'warn').mockImplementation(() => {})
})
afterEach(() => {
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('aiParseResume', () => {
  it('adds ids and returns valid content', async () => {
    const fetchMock = vi.fn().mockResolvedValue(reply(MODEL_JSON))
    vi.stubGlobal('fetch', fetchMock)
    const c = await aiParseResume(RESUME)
    expect(c).not.toBeNull()
    expect(toContent(c)).not.toBeNull()
    expect(c!.contact).toMatchObject({ name: 'Jane Doe', email: 'jane@example.com', github: 'github.com/janedoe' })
    expect(c!.experience.items[0]).toMatchObject({ company: 'Acme Labs', role: 'Backend Intern', start: 'Jun 2025' })
    expect(c!.experience.items[0].bullets[0].text).toBe('Built a caching layer that reduced database load by a third')
    expect(c!.skills.groups[0].items.map((i) => i.name)).toEqual(['Python', 'Go'])
    const ids = allIds(c!)
    expect(ids.length).toBeGreaterThanOrEqual(5)
    expect(ids.every(Boolean)).toBe(true)
    expect(new Set(ids).size).toBe(ids.length)
    expect(c!.order).toEqual([
      'contact',
      'experience',
      'skills',
      'summary',
      'projects',
      'education',
      'certifications',
      'custom',
    ])
    expect(c!.summary.hidden).toBe(true)
    expect(c!.projects.hidden).toBe(true)
    expect(c!.experience.hidden).toBe(false)

    const body = JSON.parse(fetchMock.mock.calls[0][1].body)
    expect(body.contents[0].parts[0].text).toContain('Backend Intern | Acme Labs')
    expect(body.systemInstruction.parts[0].text).toMatch(/Never invent/)
    expect(body.generationConfig.responseSchema.type).toBe('OBJECT')
  })

  it('returns null without a key, and does not call the network', async () => {
    vi.stubEnv('GEMINI_API_KEY', '')
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    expect(await aiParseResume(RESUME)).toBeNull()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('strips a phone number if the model returns one', async () => {
    const withPhone = structuredClone(MODEL_JSON)
    withPhone.contact.location = 'Hyderabad, India +1 (555) 010-0199'
    withPhone.contact.title = 'Call +44 20 7946 0958'
    withPhone.experience[0].bullets = ['Built a caching layer that reduced database load by a third (+1 555 010 0199)']
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(reply(withPhone)))
    const c = await aiParseResume(RESUME)
    expect(c).not.toBeNull()
    expect(JSON.stringify(c)).not.toMatch(/555|7946|0958/)
  })

  it('drops text the model made up', async () => {
    const invented = structuredClone(MODEL_JSON)
    invented.experience[0].bullets.push(
      'Led a team of fifteen engineers across three continents to launch a global platform',
    )
    invented.summary = 'Visionary leader who transformed enterprise cloud strategy'
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(reply(invented)))
    const c = await aiParseResume(RESUME)
    expect(c!.experience.items[0].bullets).toHaveLength(1)
    expect(c!.summary.text).toBe('')
  })

  it('returns null when the model fails, answers with junk, or reads nothing', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')))
    expect(await aiParseResume(RESUME)).toBeNull()

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('nope', { status: 500 })))
    expect(await aiParseResume(RESUME)).toBeNull()

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(reply('just a string')))
    expect(await aiParseResume(RESUME)).toBeNull()

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(reply({})))
    expect(await aiParseResume(RESUME)).toBeNull()
  })
})
