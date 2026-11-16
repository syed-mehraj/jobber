import type { ReactNode } from 'react'

export function PageHeader({ title, text, action }: { title: string; text?: string; action?: ReactNode }) {
  return (
    <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-[24px] leading-8 font-semibold tracking-[-0.02em] sm:text-page">{title}</h1>
        {text && <p className="mt-1.5 text-large text-ink-2">{text}</p>}
      </div>
      {action}
    </div>
  )
}
