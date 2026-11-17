import type { Metadata } from 'next'
import { Suspense } from 'react'
import { NewResumeForm } from '@/components/editor/new-resume-form'
import { Card } from '@/components/ui/card'
import { PageHeader } from '@/components/ui/page-header'
import { Skeleton } from '@/components/ui/skeleton'
import { getResumes } from '@/lib/resumes'
import { createResume } from '../actions'

export const metadata: Metadata = { title: 'New resume' }

export default function Page() {
  return (
    <>
      <PageHeader title="New resume" text="Make a version for a role. Start from your master resume and tailor it." />
      <div className="max-w-[640px]">
        <Suspense fallback={<Skeleton className="h-96 rounded-card" />}>
          <Form />
        </Suspense>
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
