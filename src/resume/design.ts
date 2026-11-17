/*
 * How a resume looks: which template, which font, which accent colour. Plain TypeScript with no React,
 * so the editor, the server and the tests can all use it. It is stored beside the resume content.
 */

export type TemplateId = 'simple' | 'compact' | 'classic' | 'modern' | 'bold' | 'minimal'
export type FontId = 'inter' | 'source-serif' | 'lato' | 'roboto' | 'ibm-plex' | 'eb-garamond'
export type AccentId = 'blue' | 'black'
export type ResumeDesign = { template: TemplateId; font: FontId; accent: AccentId }

export const defaultDesign: ResumeDesign = { template: 'simple', font: 'inter', accent: 'blue' }

export const TEMPLATES: { id: TemplateId; label: string; description: string }[] = [
  { id: 'simple', label: 'Simple', description: 'Clean and balanced, with generous spacing.' },
  { id: 'compact', label: 'Compact', description: 'Tighter spacing and smaller type, to fit more on one page.' },
  { id: 'classic', label: 'Classic', description: 'Centred name, small-caps headings and thin rules.' },
  { id: 'modern', label: 'Modern', description: 'Accent-coloured headings with a fine accent line.' },
  { id: 'bold', label: 'Bold', description: 'Strong section bands and heavier type.' },
  { id: 'minimal', label: 'Minimal', description: 'No rules, lots of white space, a light touch.' },
]

export const FONTS: { id: FontId; label: string; description: string; cssVar: string }[] = [
  { id: 'inter', label: 'Inter', description: 'Neutral and modern sans-serif.', cssVar: '--font-resume-inter' },
  {
    id: 'source-serif',
    label: 'Source Serif',
    description: 'Readable, traditional serif.',
    cssVar: '--font-resume-source-serif',
  },
  { id: 'lato', label: 'Lato', description: 'Warm, friendly sans-serif.', cssVar: '--font-resume-lato' },
  { id: 'roboto', label: 'Roboto', description: 'Familiar, even sans-serif.', cssVar: '--font-resume-roboto' },
  {
    id: 'ibm-plex',
    label: 'IBM Plex Sans',
    description: 'Technical, slightly condensed sans-serif.',
    cssVar: '--font-resume-ibm-plex',
  },
  {
    id: 'eb-garamond',
    label: 'EB Garamond',
    description: 'Elegant old-style serif.',
    cssVar: '--font-resume-eb-garamond',
  },
]

export const ACCENT_COLORS: Record<AccentId, string> = { blue: '#2563EB', black: '#0F172A' }

const SANS = "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Arial, sans-serif"
const SERIF = "Georgia, 'Times New Roman', serif"

/**
 * The CSS font-family for a font. It uses the font's variable when a wrapper provides it, and falls back to
 * a system font of the same kind (serif or sans) when the variable is missing.
 */
export function fontStack(id: FontId): string {
  const font = FONTS.find((f) => f.id === id) ?? FONTS[0]
  const serif = font.id === 'source-serif' || font.id === 'eb-garamond'
  const fallback = serif ? SERIF : SANS
  // The app's own Inter variable is a second fallback for the default font.
  const inner = font.id === 'inter' ? `var(--font-inter, ${fallback})` : fallback
  return `var(${font.cssVar}, ${inner}), ${fallback}`
}

const isOneOf = <T extends string>(list: readonly { id: T }[], v: unknown): v is T =>
  typeof v === 'string' && list.some((x) => x.id === v)

/** Narrows loosely typed JSON to a design. Each field that is missing or unknown falls back to its default. */
export function toDesign(raw: unknown): ResumeDesign {
  const r = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {}
  return {
    template: isOneOf(TEMPLATES, r.template) ? r.template : defaultDesign.template,
    font: isOneOf(FONTS, r.font) ? r.font : defaultDesign.font,
    accent: r.accent === 'blue' || r.accent === 'black' ? r.accent : defaultDesign.accent,
  }
}
