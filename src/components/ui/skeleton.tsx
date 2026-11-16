import { cx } from '@/lib/cx'

export function Skeleton({ className }: { className?: string }) {
  return <span aria-hidden="true" className={cx('block animate-pulse rounded-control bg-sunken', className)} />
}
