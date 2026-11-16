import type { ReactNode } from 'react'
import { Card } from './card'

/** An icon, one sentence and at most one action. */
export function EmptyState({
  icon,
  title,
  text,
  action,
}: {
  icon: ReactNode
  title: string
  text: string
  action?: ReactNode
}) {
  return (
    <Card className="grid justify-items-center px-6 py-14 text-center">
      <span className="grid size-12 place-items-center rounded-card bg-primary-tint text-primary [&_svg]:size-6">
        {icon}
      </span>
      <h2 className="mt-4 text-title font-semibold">{title}</h2>
      <p className="mt-1 max-w-sm text-ink-2">{text}</p>
      {action && <div className="mt-5">{action}</div>}
    </Card>
  )
}
