'use client'

import Link from 'next/link'
import { useEffect, useRef, useState, useTransition, type ReactNode } from 'react'
import { Button, iconButtonClass } from '@/components/ui/button'
import {
  ApplicationsIcon,
  BellIcon,
  CloseIcon,
  CompaniesIcon,
  CompassIcon,
  DashboardIcon,
  JobsIcon,
  LocationIcon,
  PersonIcon,
  ResumeIcon,
  SwatchIcon,
} from '@/components/ui/icons'
import { cx } from '@/lib/cx'
import type { ShellActions, ShellData, User } from './types'
import { Brand } from './brand'
import { isActive } from './nav'

type Props = {
  id: string
  open: boolean
  /** Close and return focus to the menu button (×, scrim, Esc). */
  onClose: () => void
  /** Close after a link is followed. */
  onNavigate: () => void
  pathname: string
  user: User
  data: ShellData
  actions: ShellActions
}

const FOCUSABLE = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'

/** The menu slider: every page and every action that isn't in the header. */
export function MenuDrawer({ id, open, onClose, onNavigate, pathname, user, data, actions }: Props) {
  const panel = useRef<HTMLElement>(null)
  const closeButton = useRef<HTMLButtonElement>(null)

  // Focus the close button on open, keep Tab inside the panel, close on Esc, and lock page scroll.
  useEffect(() => {
    if (!open) return
    closeButton.current?.focus()
    document.body.classList.add('menu-open')

    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
        return
      }
      if (e.key !== 'Tab' || !panel.current) return
      const items = Array.from(panel.current.querySelectorAll<HTMLElement>(FOCUSABLE))
      if (items.length === 0) return
      const first = items[0]
      const last = items[items.length - 1]
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.classList.remove('menu-open')
    }
  }, [open, onClose])

  const item = (href: string, label: string, icon: ReactNode, count?: number) => {
    const active = isActive(pathname, href)
    return (
      <Link
        href={href}
        onClick={onNavigate}
        aria-current={active ? 'page' : undefined}
        className={cx(
          'flex h-[42px] items-center gap-3 rounded-button px-2.5 font-medium transition-colors [&_svg]:size-[18px] [&_svg]:shrink-0',
          active ? 'bg-primary-tint text-primary' : 'text-ink hover:bg-surface-muted [&_svg]:text-ink-2',
        )}
      >
        {icon}
        {label}
        {count !== undefined && <span className="ml-auto text-[12.5px] text-ink-3">{count}</span>}
      </Link>
    )
  }

  return (
    <>
      <div
        aria-hidden="true"
        onClick={onClose}
        className={cx(
          'fixed inset-0 z-20 bg-ink/30 transition-opacity duration-200',
          open ? 'opacity-100' : 'pointer-events-none opacity-0',
        )}
      />
      <aside
        id={id}
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-label="Menu"
        inert={!open}
        className={cx(
          'fixed inset-y-0 right-0 z-30 flex w-[min(340px,88vw)] flex-col bg-surface shadow-drawer',
          // Visible at once on open (so focus can move in); hidden only after the slide-out ends.
          open
            ? 'visible translate-x-0 [transition:transform_240ms_var(--ease-out-soft)]'
            : 'invisible translate-x-full [transition:transform_240ms_var(--ease-out-soft),visibility_0s_linear_240ms]',
        )}
      >
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-line pr-4 pl-5">
          <Brand onNavigate={onNavigate} />
          <button
            ref={closeButton}
            type="button"
            className={iconButtonClass()}
            aria-label="Close menu"
            onClick={onClose}
          >
            <CloseIcon />
          </button>
        </div>

        <nav aria-label="Menu" className="flex-1 overflow-y-auto p-3">
          <Group>Go to</Group>
          {item('/', 'Dashboard', <DashboardIcon />)}
          {item('/resumes', 'Resumes', <ResumeIcon />, data.counts?.resumes)}
          {item('/about', 'About you', <PersonIcon />)}
          {item('/jobs', 'Jobs', <JobsIcon />, data.counts?.newMatches)}
          {item('/applications', 'Applications', <ApplicationsIcon />, data.counts?.applied)}
          {item('/programs', 'Programs and other sites', <CompassIcon />)}

          <Group>Job search</Group>
          <SearchCard data={data} run={actions.runSearchNow} />

          <Group>Settings</Group>
          {user.isAdmin && item('/admin', 'People and invites', <PersonIcon />)}
          {user.isAdmin && item('/settings/companies', 'Companies and sources', <CompaniesIcon />)}
          {item('/settings/roles', 'Roles and locations', <LocationIcon />)}
          {item('/settings/alerts', 'Telegram alerts', <BellIcon />)}
          {item('/styleguide', 'Style guide', <SwatchIcon />)}
        </nav>

        <div className="flex shrink-0 items-center gap-2.5 border-t border-line px-5 py-3.5">
          <span
            aria-hidden="true"
            className="grid size-[34px] place-items-center rounded-full bg-primary-soft text-small font-semibold text-primary"
          >
            {user.initials}
          </span>
          <span className="flex-1 font-medium">{user.firstName}</span>
          <form action={actions.signOut}>
            <Button size="sm" type="submit">
              Sign out
            </Button>
          </form>
        </div>
      </aside>
    </>
  )
}

function SearchCard({ data, run }: { data: ShellData; run: ShellActions['runSearchNow'] }) {
  const [pending, start] = useTransition()
  const [message, setMessage] = useState<string | null>(null)
  const search = data.search
  const tone = !search
    ? 'bg-ink-3'
    : search.running || pending
      ? 'bg-primary animate-pulse'
      : search.healthy
        ? 'bg-success'
        : 'bg-warning'
  return (
    <div className="mx-1 mt-1.5 rounded-card border border-line bg-surface-muted p-3.5">
      <p className="flex items-center gap-2 text-[14px] font-semibold">
        <span aria-hidden="true" className={cx('size-2 rounded-full', tone)} />
        {pending ? 'Searching now…' : (search?.label ?? 'Loading…')}
      </p>
      <p className="mt-1 mb-3 text-small text-ink-2" aria-live="polite">
        {message ?? search?.detail ?? '\u00a0'}
      </p>
      <Button
        size="sm"
        loading={pending}
        onClick={() =>
          start(async () => {
            setMessage(null)
            const result = await run()
            setMessage(result.message)
          })
        }
      >
        {pending ? 'Searching' : 'Run search now'}
      </Button>
    </div>
  )
}

function Group({ children }: { children: ReactNode }) {
  return <p className="px-2.5 pt-3.5 pb-1.5 text-caption font-medium text-ink-3">{children}</p>
}
