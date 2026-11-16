'use client'

import { useEffect, useRef, type ReactNode } from 'react'

/** On narrow screens the fit panel sits above the list; bring it into view when a job is picked. */
export function RevealOnPhone({ id, children }: { id: number; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (window.matchMedia('(max-width: 1023px)').matches) {
      ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [id])
  return (
    <div ref={ref} className="scroll-mt-20">
      {children}
    </div>
  )
}
