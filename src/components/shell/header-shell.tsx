import Link from 'next/link'
import { buttonClass, iconButtonClass } from '@/components/ui/button'
import { MenuIcon, PlusIcon } from '@/components/ui/icons'
import { Brand } from './brand'
import { headerLinks } from './nav'

/**
 * The header without the current-page underline. Shown for a moment while the real header (which reads the URL)
 * loads; on routes like /resumes/[id] Next.js needs this fallback because the URL isn't known while prerendering.
 */
export function HeaderShell() {
  return (
    <header className="sticky top-0 z-10 border-b border-line bg-surface">
      <div className="mx-auto flex h-16 max-w-[1160px] items-center gap-3 px-4 sm:px-5 md:gap-7 [body:has(.editor-wide)_&]:max-w-none">
        <Brand />
        <nav aria-label="Main" className="hidden h-full gap-1 md:flex">
          {headerLinks.map(({ href, label }) => (
            <Link key={href} href={href} className="flex items-center rounded-control px-3 font-medium text-ink-2">
              {label}
            </Link>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <Link
            href="/resumes/new"
            aria-label="New resume"
            className={buttonClass({ variant: 'primary', className: 'max-md:w-[38px] max-md:px-0' })}
          >
            <PlusIcon />
            <span className="max-md:hidden">New resume</span>
          </Link>
          <button type="button" className={iconButtonClass()} aria-label="Open menu" disabled>
            <MenuIcon />
          </button>
        </div>
      </div>
    </header>
  )
}
