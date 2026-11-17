import type { CSSProperties } from 'react'
import type { TemplateId } from './design'

/*
 * What makes the six templates differ. They share one structure (render.tsx), one column and the same
 * data-path attributes; only these classes and inline styles change. Class names are written out in full
 * so Tailwind can find them.
 */

export type Theme = {
  /** Page padding, base size and line height. */
  page: string
  /** Wrapper of the contact block. */
  header: string
  name: string
  title: string
  contact: string
  /** The h2 of each section. */
  heading: string
  /** The bold bits: company, school, project and skill-group names. */
  strong: string
  /** Space between experience items, and between other items. */
  gapLarge: string
  gapSmall: string
  /** The skills and certifications lists. */
  gapTight: string
  bullets: string
  /** Text on the right of a line (dates, locations). */
  meta: string
  /** Secondary text (project stack, grade, contact). */
  muted: string
}

export const THEMES: Record<TemplateId, Theme> = {
  // The original look: balanced, a thin grey rule under each heading.
  simple: {
    page: 'px-14 py-[52px] text-[12.5px] leading-[1.5]',
    header: '',
    name: 'text-[26px] leading-8 font-semibold tracking-[-0.01em]',
    title: 'mt-0.5 text-[13px] text-ink-2',
    contact: 'mt-1.5 text-ink-2',
    heading:
      'mt-[18px] mb-2 border-b border-line-strong pb-1 text-[11px] leading-4 font-semibold tracking-[0.08em] text-ink uppercase',
    strong: 'font-semibold',
    gapLarge: 'space-y-3',
    gapSmall: 'space-y-2.5',
    gapTight: 'space-y-0.5',
    bullets: 'mt-1 list-disc space-y-0.5 pl-[18px]',
    meta: 'text-ink-2',
    muted: 'text-ink-2',
  },
  // Tighter spacing and smaller type, to fit more on one page.
  compact: {
    page: 'px-10 py-8 text-[11px] leading-[1.35]',
    header: '',
    name: 'text-[22px] leading-7 font-semibold tracking-[-0.01em]',
    title: 'text-[12px] text-ink-2',
    contact: 'mt-1 text-ink-2',
    heading:
      'mt-3 mb-1.5 border-b border-line-strong pb-0.5 text-[10px] leading-4 font-semibold tracking-[0.08em] text-ink uppercase',
    strong: 'font-semibold',
    gapLarge: 'space-y-1.5',
    gapSmall: 'space-y-1',
    gapTight: '',
    bullets: 'mt-0.5 list-disc pl-4',
    meta: 'text-ink-2',
    muted: 'text-ink-2',
  },
  // Centred name, small-caps headings and thin dark rules.
  classic: {
    page: 'px-[60px] py-[52px] text-[12.5px] leading-[1.5]',
    header: 'text-center',
    name: 'text-[28px] leading-9 font-semibold tracking-[0.03em]',
    title: 'mt-0.5 text-[13px] text-ink-2',
    contact: 'mt-1.5 text-ink-2',
    heading:
      'mt-5 mb-2 border-b border-ink pb-0.5 text-[14px] leading-5 font-semibold tracking-[0.06em] text-ink [font-variant:small-caps]',
    strong: 'font-semibold',
    gapLarge: 'space-y-3',
    gapSmall: 'space-y-2.5',
    gapTight: 'space-y-0.5',
    bullets: 'mt-1 list-disc space-y-0.5 pl-[18px]',
    meta: 'text-ink',
    muted: 'text-ink-2',
  },
  // Accent-coloured headings with a hairline in the accent (colours come from headingStyle).
  modern: {
    page: 'px-14 py-12 text-[12.5px] leading-[1.5]',
    header: '',
    name: 'text-[30px] leading-9 font-bold tracking-[-0.02em]',
    title: 'mt-0.5 text-[14px] text-ink-2',
    contact: 'mt-2 text-ink-2',
    heading: 'mt-5 mb-2 border-b pb-1 text-[12px] leading-4 font-bold tracking-[0.1em] uppercase',
    strong: 'font-semibold',
    gapLarge: 'space-y-3.5',
    gapSmall: 'space-y-2.5',
    gapTight: 'space-y-0.5',
    bullets: 'mt-1 list-disc space-y-0.5 pl-[18px]',
    meta: 'text-ink-2',
    muted: 'text-ink-2',
  },
  // A heavy name and solid section bands.
  bold: {
    page: 'px-12 py-11 text-[12.5px] leading-[1.5]',
    header: 'border-b-[3px] pb-3',
    name: 'text-[34px] leading-10 font-bold tracking-[-0.02em] uppercase',
    title: 'mt-0.5 text-[14px] font-medium text-ink-2',
    contact: 'mt-2 text-ink-2',
    heading: 'mt-5 mb-2.5 px-2.5 py-1 text-[12px] leading-4 font-bold tracking-[0.1em] uppercase',
    strong: 'font-bold',
    gapLarge: 'space-y-3',
    gapSmall: 'space-y-2.5',
    gapTight: 'space-y-0.5',
    bullets: 'mt-1 list-disc space-y-0.5 pl-[18px]',
    meta: 'text-ink-2',
    muted: 'text-ink-2',
  },
  // No rules, wide margins, quiet labels and light type.
  minimal: {
    page: 'px-[68px] py-[60px] text-[12.5px] leading-[1.6]',
    header: '',
    name: 'text-[26px] leading-9 font-normal tracking-[-0.01em]',
    title: 'mt-1 text-[13px] text-ink-3',
    contact: 'mt-2 text-ink-3',
    heading: 'mt-8 mb-3 text-[10.5px] leading-4 font-medium tracking-[0.16em] text-ink-3 uppercase',
    strong: 'font-medium',
    gapLarge: 'space-y-4',
    gapSmall: 'space-y-3',
    gapTight: 'space-y-1',
    bullets: 'mt-1.5 list-disc space-y-1 pl-[18px] marker:text-ink-3',
    meta: 'text-ink-3',
    muted: 'text-ink-3',
  },
}

/** Colours that depend on the accent, set inline because the accent is chosen at run time. */
export function headingStyle(template: TemplateId, accent: string): CSSProperties | undefined {
  if (template === 'modern') return { color: accent, borderColor: accent, borderBottomWidth: 1 }
  if (template === 'bold')
    return {
      backgroundColor: accent,
      color: '#ffffff',
      // keep the bands when the page is printed or saved as a PDF
      WebkitPrintColorAdjust: 'exact',
      printColorAdjust: 'exact',
    }
  return undefined
}

export function headerStyle(template: TemplateId, accent: string): CSSProperties | undefined {
  return template === 'bold' ? { borderColor: accent } : undefined
}

export function titleStyle(template: TemplateId, accent: string): CSSProperties | undefined {
  return template === 'modern' ? { color: accent } : undefined
}
