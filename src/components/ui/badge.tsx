import type { ReactNode } from 'react'
import { cx } from '@/lib/cx'
import { bandBadge, scoreBand } from '@/lib/score'

type Tone = 'neutral' | 'primary' | 'success' | 'warning' | 'danger'

const tones: Record<Tone, string> = {
  neutral: 'bg-sunken text-ink-2',
  primary: 'bg-primary-tint text-primary',
  success: 'bg-success-tint text-success',
  warning: 'bg-warning-tint text-warning',
  danger: 'bg-danger-tint text-danger',
}

export function Badge({ tone = 'neutral', children }: { tone?: Tone; children: ReactNode }) {
  return (
    <span className={cx('inline-flex h-[22px] items-center rounded-full px-2.5 text-caption font-medium', tones[tone])}>
      {children}
    </span>
  )
}

/** A match score with its band colour. The number is always shown, so colour is never the only signal. */
export function ScoreBadge({ score }: { score: number }) {
  return (
    <span
      className={cx(
        'inline-flex h-[22px] items-center rounded-full px-2.5 text-caption font-semibold',
        bandBadge[scoreBand(score)],
      )}
    >
      {score}% match
    </span>
  )
}
