import type { ButtonHTMLAttributes } from 'react'
import { cx } from '@/lib/cx'

export type ButtonVariant = 'primary' | 'secondary' | 'subtle' | 'ghost' | 'danger' | 'link'
export type ButtonSize = 'sm' | 'md' | 'lg'

const base =
  'inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap font-medium select-none transition-colors duration-[120ms] ' +
  'disabled:pointer-events-none disabled:opacity-45 aria-disabled:pointer-events-none aria-disabled:opacity-45 ' +
  '[&_svg]:size-4 [&_svg]:shrink-0'

const variants: Record<ButtonVariant, string> = {
  primary:
    'border border-primary bg-primary text-white hover:border-primary-hover hover:bg-primary-hover active:translate-y-px active:bg-primary-active',
  secondary:
    'border border-line-strong bg-surface text-ink hover:bg-surface-muted active:translate-y-px active:bg-sunken',
  subtle:
    'border border-transparent bg-primary-tint text-primary hover:bg-primary-soft active:translate-y-px active:border-primary-tint-border',
  ghost: 'border border-transparent bg-transparent text-ink-2 hover:bg-surface-muted hover:text-ink active:bg-sunken',
  danger: 'border border-danger bg-danger text-white hover:brightness-95 active:translate-y-px active:brightness-90',
  link: 'h-auto! border-0 bg-transparent px-0! text-primary underline-offset-4 hover:underline',
}

const sizes: Record<ButtonSize, string> = {
  sm: 'h-8 rounded-control px-3 text-small',
  md: 'h-[38px] rounded-button px-4 text-body',
  lg: 'h-11 rounded-button px-[18px] text-large',
}

/** Class names for anything that should look like a button (a <button> or a <Link>). */
export function buttonClass({
  variant = 'secondary',
  size = 'md',
  className,
}: { variant?: ButtonVariant; size?: ButtonSize; className?: string } = {}): string {
  return cx(base, variants[variant], sizes[size], className)
}

/** Square icon-only button. Always pass an aria-label. */
export function iconButtonClass({ size = 'md', className }: { size?: ButtonSize; className?: string } = {}): string {
  const box =
    size === 'sm' ? 'size-8 rounded-control' : size === 'lg' ? 'size-11 rounded-button' : 'size-[38px] rounded-button'
  return cx(base, variants.secondary, box, className)
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant
  size?: ButtonSize
  loading?: boolean
}

export function Button({
  variant,
  size,
  loading,
  className,
  children,
  disabled,
  type = 'button',
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      className={buttonClass({ variant, size, className })}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...rest}
    >
      {loading && <Spinner />}
      {children}
    </button>
  )
}

function Spinner() {
  return (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden="true" className="animate-spin">
      <circle cx="8" cy="8" r="6" stroke="currentColor" strokeOpacity=".25" strokeWidth="2" />
      <path d="M14 8a6 6 0 0 0-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}
