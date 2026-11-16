import type { Metadata } from 'next'
import Link from 'next/link'
import { buttonClass } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { ResumeIcon } from '@/components/ui/icons'
import { PageHeader } from '@/components/ui/page-header'

export const metadata: Metadata = { title: 'Resumes' }

export default function Page() {
  return (
    <>
      <PageHeader title="Resumes" text="Your master resume and the versions made from it." />
      <EmptyState
        icon={<ResumeIcon />}
        title="No resumes yet"
        text="Your master resume and its tailored versions will appear here."
        action={
          <Link href="/resumes/new" className={buttonClass()}>
            Start your master resume
          </Link>
        }
      />
    </>
  )
}
