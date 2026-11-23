import { Brand } from '@/components/shell/brand'
import { Card } from '@/components/ui/card'

/** The centred card the sign-in, sign-up and setup pages share. */
export function AuthCard({
  title,
  subtitle,
  children,
}: {
  title: string
  subtitle: string
  children: React.ReactNode
}) {
  return (
    <main className="grid min-h-dvh place-items-center px-4 py-10">
      <Card className="w-full max-w-[420px] p-7 shadow-pop">
        <Brand />
        <h1 className="mt-6 text-[22px] leading-8 font-semibold tracking-[-0.01em]">{title}</h1>
        <p className="mt-1 text-ink-2">{subtitle}</p>
        {children}
      </Card>
    </main>
  )
}
