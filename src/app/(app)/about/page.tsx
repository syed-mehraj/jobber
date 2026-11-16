import type { Metadata } from 'next'
import { Suspense } from 'react'
import { AboutSection } from '@/components/resume/about-section'
import { PageHeader } from '@/components/ui/page-header'
import { Skeleton } from '@/components/ui/skeleton'
import { timeAgo } from '@/lib/format'
import { getAbouts } from '@/lib/resumes'
import { createAbout, deleteAbout, duplicateAbout, updateAbout } from './actions'

export const metadata: Metadata = { title: 'About you' }

const actions = { create: createAbout, update: updateAbout, duplicate: duplicateAbout, remove: deleteAbout }

export default function AboutPage() {
  return (
    <>
      <PageHeader
        title="About you"
        text="Your work in your own words. Keep one for each kind of role you apply to, and copy it into applications."
      />
      <div className="max-w-[820px]">
        <Suspense fallback={<Skeleton className="h-96 rounded-card" />}>
          <AboutList />
        </Suspense>
      </div>
    </>
  )
}

async function AboutList() {
  const items = await getAbouts()
  return (
    <AboutSection
      items={items.map((a) => ({
        id: a.id,
        title: a.title,
        target: a.target,
        text: a.text,
        updated: `saved ${timeAgo(a.updatedAt)}`,
      }))}
      actions={actions}
    />
  )
}
