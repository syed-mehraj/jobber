import { AppHeader } from '@/components/shell/app-header'
import { sampleCounts, sampleSearch, sampleUser } from '@/lib/sample-data'

export default function AppLayout({ children }: LayoutProps<'/'>) {
  return (
    <>
      <AppHeader user={sampleUser} counts={sampleCounts} search={sampleSearch} />
      <main className="mx-auto max-w-[1040px] px-4 pt-7 pb-16 sm:px-5 sm:pt-9">{children}</main>
    </>
  )
}
