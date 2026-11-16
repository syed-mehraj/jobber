export type ScoreBand = 'strong' | 'good' | 'partial' | 'weak'

/** Match-score bands from DESIGN.md: 80+ strong, 60–79 good, 40–59 partial, below 40 weak. */
export function scoreBand(score: number): ScoreBand {
  if (score >= 80) return 'strong'
  if (score >= 60) return 'good'
  if (score >= 40) return 'partial'
  return 'weak'
}

export const bandText: Record<ScoreBand, string> = {
  strong: 'text-success',
  good: 'text-primary',
  partial: 'text-warning',
  weak: 'text-danger',
}

export const bandBadge: Record<ScoreBand, string> = {
  strong: 'bg-success-tint text-success',
  good: 'bg-primary-tint text-primary',
  partial: 'bg-warning-tint text-warning',
  weak: 'bg-danger-tint text-danger',
}
