import type { HTMLAttributes, ReactNode } from 'react'
import { cx } from '@/lib/cx'

export function Card({ className, ...rest }: HTMLAttributes<HTMLElement>) {
  return <section className={cx('rounded-card border border-line bg-surface shadow-card', className)} {...rest} />
}

export function CardHeader({ title, action, id }: { title: ReactNode; action?: ReactNode; id?: string }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-line px-4 py-4 sm:px-[22px] sm:py-[18px]">
      <h2 id={id} className="text-title font-semibold">
        {title}
      </h2>
      {action}
    </div>
  )
}
