'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useCallback, useEffect, useRef } from 'react'
import { buttonClass, iconButtonClass } from '@/components/ui/button'
import { MenuIcon, PlusIcon } from '@/components/ui/icons'
import { cx } from '@/lib/cx'
import { Brand } from './brand'
import { MenuDrawer } from './menu-drawer'
import { useMenuState } from './menu-state'
import { headerLinks, isActive } from './nav'
import type { ShellActions, ShellData, User } from './types'

type Props = { user: User; data: ShellData; actions: ShellActions }

/** The header holds only what's needed; everything else is in the menu slider. */
export function AppHeader({ user, data, actions }: Props) {
  const pathname = usePathname()
  const { open, setOpen } = useMenuState()
  const menuButton = useRef<HTMLButtonElement>(null)

  const close = useCallback(() => {
    setOpen(false)
    menuButton.current?.focus()
  }, [setOpen])

  // If the header is swapped in while the menu is open (counts arriving), keep focus inside the menu.
  useEffect(() => {
    if (open) document.querySelector<HTMLElement>('#app-menu button[aria-label="Close menu"]')?.focus()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <>
      <header className="sticky top-0 z-10 border-b border-line bg-surface">
        <div className="mx-auto flex h-16 max-w-[1160px] items-center gap-3 px-4 sm:px-5 md:gap-7">
          <Brand />
          <nav aria-label="Main" className="hidden h-full gap-1 md:flex">
            {headerLinks.map(({ href, label }) => {
              const active = isActive(pathname, href)
              return (
                <Link
                  key={href}
                  href={href}
                  aria-current={active ? 'page' : undefined}
                  className={cx(
                    'relative flex items-center rounded-control px-3 font-medium transition-colors',
                    active
                      ? 'text-primary after:absolute after:inset-x-3 after:-bottom-px after:h-0.5 after:rounded-full after:bg-primary'
                      : 'text-ink-2 hover:text-ink',
                  )}
                >
                  {label}
                </Link>
              )
            })}
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
            <button
              ref={menuButton}
              type="button"
              className={iconButtonClass()}
              aria-label="Open menu"
              aria-expanded={open}
              aria-controls="app-menu"
              onClick={() => setOpen(true)}
            >
              <MenuIcon />
            </button>
          </div>
        </div>
      </header>
      <MenuDrawer
        id="app-menu"
        open={open}
        onClose={close}
        onNavigate={() => setOpen(false)}
        pathname={pathname}
        user={user}
        data={data}
        actions={actions}
      />
    </>
  )
}
