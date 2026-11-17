import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Suspense } from 'react'
import { Editor } from '@/components/editor/editor'
import { EmptyState } from '@/components/ui/empty-state'
import { ResumeIcon } from '@/components/ui/icons'
import { Skeleton } from '@/components/ui/skeleton'
import { getResume } from '@/lib/resumes'
import { toDesign } from '@/resume/design'
import { resumeFontVariables } from '@/resume/fonts'
import { askResumeAssistant } from '../../ai-actions'
import { deleteResume, saveResume } from '../../actions'

export const metadata: Metadata = { title: 'Edit resume' }

export default function EditPage({ params, searchParams }: PageProps<'/resumes/[id]/edit'>) {
  return (
    <Suspense fallback={<Loading />}>
      <EditorLoader params={params} searchParams={searchParams} />
    </Suspense>
  )
}

async function EditorLoader({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const [{ id }, sp] = await Promise.all([params, searchParams])
  const resume = await getResume(Number(id))
  if (!resume) notFound()
  if (!resume.content)
    return (
      <EmptyState
        icon={<ResumeIcon />}
        title="This resume can't be edited"
        text="Its saved content is not in the format the editor expects."
      />
    )
  return (
    <div className={resumeFontVariables}>
      <Editor
        id={resume.id}
        isMaster={resume.isMaster}
        importedFrom={sp.imported && resume.file ? resume.file.name : undefined}
        initial={{
          content: resume.content,
          design: toDesign(resume.design),
          name: resume.name,
          target: resume.target ?? '',
        }}
        save={saveResume}
        ask={askResumeAssistant}
        remove={deleteResume}
      />
    </div>
  )
}

function Loading() {
  return (
    <div aria-hidden="true" className="grid gap-6 lg:grid-cols-12">
      <Skeleton className="h-10 lg:col-span-12" />
      <Skeleton className="h-[760px] lg:col-span-7" />
      <div className="grid gap-4 lg:col-span-5">
        <Skeleton className="h-36" />
        <Skeleton className="h-56" />
        <Skeleton className="h-72" />
      </div>
    </div>
  )
}
