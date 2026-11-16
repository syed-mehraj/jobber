import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: { default: 'Jobber', template: '%s · Jobber' },
  description: 'Resumes, daily job matches and applications in one place.',
  robots: { index: false, follow: false },
}

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-dvh font-sans">{children}</body>
    </html>
  )
}
