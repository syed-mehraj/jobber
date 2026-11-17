import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Suspense } from 'react'
import { PrintButton } from '@/components/resume/print-button'
import { Badge } from '@/components/ui/badge'
import { buttonClass } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { ResumeIcon } from '@/components/ui/icons'
import { Skeleton } from '@/components/ui/skeleton'
import { getResume } from '@/lib/resumes'
import { toDesign } from '@/resume/design'
import { resumeFontVariables } from '@/resume/fonts'
import { ResumePage } from '@/resume/render'

export const metadata: Metadata = { title: 'Resume' }

/** Print only the page: A4, the margins set here, no toolbar, no canvas colour, no shadow. */
const printStyles = `
@media print {
  @page { size: A4; margin: 16mm 15mm; }
  body { background: #fff !important; }
  body * { visibility: hidden; }
  .resume-page, .resume-page * { visibility: visible; }
  .resume-page { position: absolute; top: 0; left: 0; width: auto !important; min-height: 0 !important; padding: 0 !important; }
}
`

export default function Page({ params }: PageProps<'/resumes/[id]'>) {
  return (
    <Suspense fallback={<Loading />}>
      <Viewer params={params} />
    </Suspense>
  )
}

async function Viewer({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const resume = await getResume(Number(id))
  if (!resume) notFound()

  return (
    <>
      <style>{printStyles}</style>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3 print:hidden">
        <div className="flex min-w-0 items-center gap-3">
          <Link href="/resumes" className={buttonClass({ variant: 'ghost', size: 'sm' })}>
            ← Resumes
          </Link>
          <h1 className="truncate text-title font-semibold">{resume.name}</h1>
          {resume.isMaster && <Badge tone="primary">Master</Badge>}
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/resumes/${resume.id}/edit`} className={buttonClass({ variant: 'primary' })}>
            Edit
          </Link>
          <PrintButton />
        </div>
      </div>
      {resume.content ? (
        <div className="overflow-x-auto pb-2">
          <div className={`mx-auto w-fit shadow-card ${resumeFontVariables}`}>
            <ResumePage content={resume.content} design={toDesign(resume.design)} />
          </div>
        </div>
      ) : (
        <EmptyState
          icon={<ResumeIcon />}
          title="This resume can't be shown"
          text="Its saved content is not in the format the editor expects."
        />
      )}
    </>
  )
}

function Loading() {
  return (
    <div aria-hidden="true">
      <Skeleton className="mb-5 h-8 w-64" />
      <Skeleton className="mx-auto h-[640px] w-full max-w-[794px]" />
    </div>
  )
}
