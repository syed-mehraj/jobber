import type { Metadata } from 'next'
import { Suspense } from 'react'
import { NewResumeForm } from '@/components/editor/new-resume-form'
import { UploadResumeForm } from '@/components/editor/upload-resume-form'
import { Card } from '@/components/ui/card'
import { PageHeader } from '@/components/ui/page-header'
import { Skeleton } from '@/components/ui/skeleton'
import { getResumes } from '@/lib/resumes'
import { createResume } from '../actions'
import { uploadResume } from '../upload-actions'

export const metadata: Metadata = { title: 'New resume' }

export default function Page() {
  return (
    <>
      <PageHeader
        title="New resume"
        text="Make a version for a role from your master resume, or upload a resume you already have."
      />
      <div className="grid items-start gap-5 lg:grid-cols-2">
        <section aria-labelledby="make-title">
          <h2 id="make-title" className="mb-2 text-title font-semibold">
            Make a version
          </h2>
          <Suspense fallback={<Skeleton className="h-96 rounded-card" />}>
            <Form />
          </Suspense>
        </section>
        <section aria-labelledby="upload-title">
          <h2 id="upload-title" className="mb-2 text-title font-semibold">
            Upload a resume
          </h2>
          <Card className="p-5 sm:p-6">
            <UploadResumeForm action={uploadResume} />
          </Card>
        </section>
      </div>
    </>
  )
}

async function Form() {
  const resumes = await getResumes()
  return (
    <Card className="p-5 sm:p-6">
      <NewResumeForm
        sources={resumes.map((r) => ({ id: r.id, name: r.name, isMaster: r.isMaster }))}
        action={createResume}
      />
    </Card>
  )
}
