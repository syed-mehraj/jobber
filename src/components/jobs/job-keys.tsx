'use client'

import { useEffect } from 'react'

/** J / K move through the job list (like Gmail or Linear). Ignored while typing in a field. */
export function JobKeys() {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.metaKey || e.ctrlKey || e.altKey) return
      const target = e.target as HTMLElement | null
      if (target?.closest('input, textarea, select, [contenteditable="true"]')) return
      if (e.key !== 'j' && e.key !== 'k') return
      const links = Array.from(document.querySelectorAll<HTMLAnchorElement>('a[data-job-link]'))
      if (!links.length) return
      const current = links.findIndex((a) => a.getAttribute('aria-current') === 'true')
      const next = e.key === 'j' ? Math.min(links.length - 1, current + 1) : Math.max(0, current - 1)
      links[next]?.click()
      links[next]?.focus()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])
  return null
}
