import { act, fireEvent, render, screen } from '@testing-library/react'
import type { AnchorHTMLAttributes } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AppHeader } from './app-header'
import { isActive } from './nav'
import type { ShellData } from './types'

vi.mock('next/link', () => ({
  default: ({ href, onNavigate, ...rest }: AnchorHTMLAttributes<HTMLAnchorElement> & { onNavigate?: () => void }) => (
    <a href={String(href)} {...rest} onClick={(e) => (rest.onClick?.(e), onNavigate?.())} />
  ),
}))

let pathname = '/'
vi.mock('next/navigation', () => ({ usePathname: () => pathname }))

const data: ShellData = {
  counts: { resumes: 0, newMatches: 24, applied: 9 },
  search: { label: 'Checks every 10 min', detail: 'Last run just now', healthy: true, running: false },
}
const actions = { runSearchNow: vi.fn(async () => ({ ok: true, message: '3 new' })), signOut: vi.fn(async () => {}) }

function renderHeader() {
  return render(<AppHeader user={{ firstName: 'Syed', initials: 'SM' }} data={data} actions={actions} />)
}

describe('isActive', () => {
  it('matches the page and its children, and the dashboard only exactly', () => {
    expect(isActive('/', '/')).toBe(true)
    expect(isActive('/jobs', '/')).toBe(false)
    expect(isActive('/resumes/new', '/resumes')).toBe(true)
    expect(isActive('/resumes-old', '/resumes')).toBe(false)
  })
})

describe('header and menu slider', () => {
  beforeEach(() => {
    pathname = '/'
  })

  it('shows only the main links in the header and marks the current page', () => {
    pathname = '/jobs'
    renderHeader()
    const main = screen.getByRole('navigation', { name: 'Main' })
    const links = Array.from(main.querySelectorAll('a')).map((a) => a.textContent)
    expect(links).toEqual(['Dashboard', 'Resumes', 'About you', 'Jobs'])
    expect(main.querySelector('[aria-current="page"]')?.textContent).toBe('Jobs')
    expect(screen.getByRole('link', { name: 'New resume' })).toHaveAttribute('href', '/resumes/new')
  })

  it('opens the menu, then closes it with Esc and returns focus to the menu button', () => {
    renderHeader()
    const menuButton = screen.getByRole('button', { name: 'Open menu' })
    const drawer = document.getElementById('app-menu')!
    expect(drawer).toHaveAttribute('inert')

    fireEvent.click(menuButton)
    expect(menuButton).toHaveAttribute('aria-expanded', 'true')
    expect(drawer).not.toHaveAttribute('inert')
    expect(screen.getByRole('button', { name: 'Close menu' })).toHaveFocus()
    expect(document.body).toHaveClass('menu-open')

    act(() => {
      fireEvent.keyDown(document, { key: 'Escape' })
    })
    expect(menuButton).toHaveAttribute('aria-expanded', 'false')
    expect(drawer).toHaveAttribute('inert')
    expect(menuButton).toHaveFocus()
    expect(document.body).not.toHaveClass('menu-open')
  })

  it('holds everything else: all pages with counts, the daily search and settings', () => {
    renderHeader()
    fireEvent.click(screen.getByRole('button', { name: 'Open menu' }))
    const menu = screen.getByRole('navigation', { name: 'Menu' })
    for (const name of [
      'Dashboard',
      'Resumes',
      'Jobs',
      'Applications',
      'Companies and sources',
      'Roles and locations',
      'Telegram alerts',
    ]) {
      expect(menu.querySelector(`a[href]`)).not.toBeNull()
      expect(Array.from(menu.querySelectorAll('a')).some((a) => a.textContent?.startsWith(name))).toBe(true)
    }
    expect(screen.getByText('Run search now')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Sign out' })).toBeInTheDocument()
  })

  it('runs a search from the menu and shows the result', async () => {
    renderHeader()
    fireEvent.click(screen.getByRole('button', { name: 'Open menu' }))
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Run search now' }))
    })
    expect(actions.runSearchNow).toHaveBeenCalled()
    expect(await screen.findByText('3 new')).toBeInTheDocument()
  })

  it('closes when a menu link is followed', () => {
    renderHeader()
    const menuButton = screen.getByRole('button', { name: 'Open menu' })
    fireEvent.click(menuButton)
    const menu = screen.getByRole('navigation', { name: 'Menu' })
    const jobs = Array.from(menu.querySelectorAll('a')).find((a) => a.textContent?.startsWith('Jobs'))!
    fireEvent.click(jobs)
    expect(menuButton).toHaveAttribute('aria-expanded', 'false')
  })
})
