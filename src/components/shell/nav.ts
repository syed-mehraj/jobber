/** Pages shown in the header. Everything else lives in the menu slider. */
export const headerLinks = [
  { href: '/', label: 'Dashboard' },
  { href: '/resumes', label: 'Resumes' },
  { href: '/about', label: 'About you' },
  { href: '/jobs', label: 'Jobs' },
] as const

/** True when `href` is the current page or a parent of it. */
export function isActive(pathname: string, href: string): boolean {
  if (href === '/') return pathname === '/'
  return pathname === href || pathname.startsWith(`${href}/`)
}
