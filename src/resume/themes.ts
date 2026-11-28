import type { CSSProperties } from 'react'
import type { TemplateId } from './design'

/*
 * What makes the templates differ. They share one structure (render.tsx), one column and the same
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
  // Left-aligned, bold uppercase headings over a thin grey rule.
  standard: {
    page: 'px-14 py-[52px] text-[12.5px] leading-[1.5]',
    header: '',
    name: 'text-[26px] leading-8 font-bold tracking-[-0.01em]',
    title: 'mt-0.5 text-[13px] text-ink-2',
    contact: 'mt-1.5 text-ink-2',
    heading:
      'mt-[18px] mb-2 border-b border-line-strong pb-1 text-[12px] leading-4 font-bold tracking-[0.06em] text-ink uppercase',
    strong: 'font-semibold',
    gapLarge: 'space-y-3',
    gapSmall: 'space-y-2.5',
    gapTight: 'space-y-0.5',
    bullets: 'mt-1 list-disc space-y-0.5 pl-[18px]',
    meta: 'text-ink-2',
    muted: 'text-ink-2',
  },
  // Centred name, small-caps headings and thin dark rules, as on university career-office resumes.
  harvard: {
    page: 'px-[60px] py-[48px] text-[12.5px] leading-[1.45]',
    header: 'text-center',
    name: 'text-[28px] leading-9 font-bold tracking-[0.03em]',
    title: 'mt-0.5 text-[13px] text-ink-2',
    contact: 'mt-1 text-ink-2',
    heading:
      'mt-4 mb-1.5 border-b border-ink pb-0.5 text-[14px] leading-5 font-bold tracking-[0.05em] text-ink [font-variant:small-caps]',
    strong: 'font-semibold',
    gapLarge: 'space-y-2.5',
    gapSmall: 'space-y-2',
    gapTight: 'space-y-0.5',
    bullets: 'mt-1 list-disc space-y-0.5 pl-[18px]',
    meta: 'text-ink',
    muted: 'text-ink-2',
  },
  // Dense one-pager: tight spacing and small-caps headings over a full-width rule.
  jake: {
    page: 'px-10 py-8 text-[11.5px] leading-[1.35]',
    header: 'text-center',
    name: 'text-[24px] leading-8 font-bold [font-variant:small-caps]',
    title: 'text-[12px] text-ink-2',
    contact: 'mt-0.5 text-ink-2',
    heading:
      'mt-2.5 mb-1 border-b border-ink pb-0 text-[13px] leading-5 text-ink [font-variant:small-caps]',
    strong: 'font-semibold',
    gapLarge: 'space-y-1.5',
    gapSmall: 'space-y-1',
    gapTight: '',
    bullets: 'mt-0.5 list-disc pl-4',
    meta: 'text-ink',
    muted: 'text-ink-2',
  },
  // Large left-aligned name, with an accent line under each heading (colours from headingStyle).
  professional: {
    page: 'px-14 py-12 text-[12.5px] leading-[1.5]',
    header: '',
    name: 'text-[30px] leading-9 font-bold tracking-[-0.02em]',
    title: 'mt-0.5 text-[14px] text-ink-2',
    contact: 'mt-2 text-ink-2',
    heading:
      'mt-5 mb-2 border-b-2 pb-1 text-[12.5px] leading-4 font-bold tracking-[0.08em] uppercase',
    strong: 'font-semibold',
    gapLarge: 'space-y-3.5',
    gapSmall: 'space-y-2.5',
    gapTight: 'space-y-0.5',
    bullets: 'mt-1 list-disc space-y-0.5 pl-[18px]',
    meta: 'text-ink-2',
    muted: 'text-ink-2',
  },
  // No rules: bold headings and text, with room to breathe.
  plain: {
    page: 'px-[64px] py-[56px] text-[12.5px] leading-[1.55]',
    header: '',
    name: 'text-[26px] leading-9 font-bold tracking-[-0.01em]',
    title: 'mt-1 text-[13px] text-ink-2',
    contact: 'mt-2 text-ink-2',
    heading:
      'mt-7 mb-2 text-[12.5px] leading-4 font-bold tracking-[0.08em] text-ink uppercase',
    strong: 'font-semibold',
    gapLarge: 'space-y-4',
    gapSmall: 'space-y-3',
    gapTight: 'space-y-1',
    bullets: 'mt-1.5 list-disc space-y-1 pl-[18px]',
    meta: 'text-ink-2',
    muted: 'text-ink-2',
  },
}

/** Colours that depend on the accent, set inline because the accent is chosen at run time. */
export function headingStyle(template: TemplateId, accent: string): CSSProperties | undefined {
  return template === 'professional' ? { color: accent, borderColor: accent } : undefined
}
