import Link from 'next/link'

export function Brand({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <Link
      href="/"
      onNavigate={onNavigate}
      className="flex items-center gap-2.5 rounded-control text-[17px] font-semibold text-ink"
    >
      <span
        aria-hidden="true"
        className="grid size-7 place-items-center rounded-control bg-primary text-[14px] font-semibold text-white"
      >
        J
      </span>
      Jobber
    </Link>
  )
}
