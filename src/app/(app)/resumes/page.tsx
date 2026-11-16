import type { Metadata } from 'next'
import Link from 'next/link'
import { Suspense } from 'react'
import { Badge } from '@/components/ui/badge'
import { buttonClass } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty-state'
import { ResumeIcon } from '@/components/ui/icons'
import { PageHeader } from '@/components/ui/page-header'
import { Skeleton } from '@/components/ui/skeleton'
import { AboutCard } from '@/components/resume/about-card'
import { timeAgo } from '@/lib/format'
import { getAbout, getResumes, type ResumeRecord } from '@/lib/resumes'
import { countBullets, countSections } from '@/resume/types'
import { saveAbout } from './actions'

export const metadata: Metadata = { title: 'Resumes' }

export default function Page() {
  return (
    <>
      <PageHeader title="Resumes" text="Your master resume and the versions made from it." />
      <div className="grid items-start gap-5 lg:grid-cols-12">
        <div className="lg:col-span-8">
          <Suspense fallback={<GridSkeleton />}>
            <Resumes />
          </Suspense>
        </div>
        <aside className="lg:sticky lg:top-[88px] lg:col-span-4">
          <Suspense fallback={<Skeleton className="h-80 rounded-card" />}>
            <About />
          </Suspense>
        </aside>
      </div>
    </>
  )
}

async function Resumes() {
  const resumes = await getResumes()
  if (!resumes.length) {
    return (
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
    )
  }
  return (
    <ul className="grid gap-4 sm:grid-cols-2">
      {resumes.map((r) => (
        <li key={r.id}>
          <ResumeCard resume={r} />
        </li>
      ))}
    </ul>
  )
}

async function About() {
  const about = await getAbout()
  return (
    <AboutCard
      text={about.text}
      updated={about.updatedAt ? `saved ${timeAgo(about.updatedAt)}` : null}
      save={saveAbout}
    />
  )
}

function ResumeCard({ resume }: { resume: ResumeRecord }) {
  const c = resume.content
  return (
    <Link href={`/resumes/${resume.id}`} className="group block rounded-card">
      <Card className="h-full p-5 transition-colors duration-[120ms] group-hover:border-line-strong group-hover:bg-surface-muted">
        <div className="flex items-start justify-between gap-3">
          <h2 className="text-title font-semibold">{resume.name}</h2>
          {resume.isMaster && <Badge tone="primary">Master</Badge>}
        </div>
        <p className="mt-1 text-small text-ink-2">Edited {timeAgo(resume.updatedAt)}</p>
        <p className="mt-4 text-small text-ink-2">
          {c ? `${countSections(c)} sections · ${countBullets(c)} bullets` : 'Needs to be opened in the editor'}
        </p>
      </Card>
    </Link>
  )
}

function GridSkeleton() {
  return (
    <div aria-hidden="true" className="grid gap-4 sm:grid-cols-2">
      {[0, 1].map((i) => (
        <Card key={i} className="p-5">
          <Skeleton className="h-5 w-2/3" />
          <Skeleton className="mt-3 h-4 w-1/3" />
          <Skeleton className="mt-6 h-4 w-1/2" />
        </Card>
      ))}
    </div>
  )
}
