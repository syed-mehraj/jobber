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
import { timeAgo } from '@/lib/format'
import { getResumes, type ResumeRecord } from '@/lib/resumes'
import { countBullets, countSections } from '@/resume/types'

export const metadata: Metadata = { title: 'Resumes' }

export default function Page() {
  return (
    <>
      <PageHeader
        title="Resumes"
        text="Your master resume, the versions made from it, and resumes you uploaded."
        action={
          <Link href="/resumes/new" className={buttonClass()}>
            Upload a resume
          </Link>
        }
      />
      <Suspense fallback={<GridSkeleton />}>
        <Resumes />
      </Suspense>
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
    <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {resumes.map((r) => (
        <li key={r.id}>
          <ResumeCard resume={r} />
        </li>
      ))}
    </ul>
  )
}

function ResumeCard({ resume }: { resume: ResumeRecord }) {
  const c = resume.content
  return (
    <Card className="relative h-full p-5 transition-colors duration-[120ms] hover:border-line-strong hover:bg-surface-muted">
      <div className="flex items-start justify-between gap-3">
        <h2 className="text-title font-semibold">
          {/* The whole card opens the resume; the download link sits above this overlay. */}
          <Link href={`/resumes/${resume.id}`} className="after:absolute after:inset-0 after:rounded-card">
            {resume.name}
          </Link>
        </h2>
        {resume.isMaster && <Badge tone="primary">Master</Badge>}
      </div>
      <p className="mt-1 text-small text-ink-2">
        {resume.target ? `For ${resume.target} · ` : ''}Edited {timeAgo(resume.updatedAt)}
      </p>
      <p className="mt-4 text-small text-ink-2">
        {c ? `${countSections(c)} sections · ${countBullets(c)} bullets` : 'Needs to be opened in the editor'}
      </p>
      {resume.file && (
        <p className="mt-2 flex items-center gap-2 text-small text-ink-2">
          <span className="truncate">📎 {resume.file.name}</span>
          <a
            href={`/resumes/${resume.id}/file`}
            className="relative z-[1] shrink-0 font-medium text-primary hover:underline"
          >
            Download
          </a>
        </p>
      )}
    </Card>
  )
}

function GridSkeleton() {
  return (
    <div aria-hidden="true" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {[0, 1, 2].map((i) => (
        <Card key={i} className="p-5">
          <Skeleton className="h-5 w-2/3" />
          <Skeleton className="mt-3 h-4 w-1/3" />
          <Skeleton className="mt-6 h-4 w-1/2" />
        </Card>
      ))}
    </div>
  )
}
