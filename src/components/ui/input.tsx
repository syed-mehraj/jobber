import { useId, type InputHTMLAttributes } from 'react'
import { cx } from '@/lib/cx'

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string
  hint?: string
  error?: string
}

export function Input({ label, hint, error, className, id, ...rest }: InputProps) {
  const autoId = useId()
  const inputId = id ?? autoId
  const noteId = `${inputId}-note`
  return (
    <div className={cx('grid content-start gap-1.5', className)}>
      <label htmlFor={inputId} className="text-small font-medium text-ink-2">
        {label}
      </label>
      <input
        id={inputId}
        aria-invalid={error ? true : undefined}
        aria-describedby={hint || error ? noteId : undefined}
        className={cx(
          'h-[38px] rounded-control border bg-surface px-3 text-body text-ink placeholder:text-ink-3',
          'transition-colors focus:border-primary focus-visible:shadow-[0_0_0_3px_rgb(37_99_235/.35)]',
          'disabled:bg-surface-muted disabled:text-ink-3',
          error ? 'border-danger' : 'border-line-strong',
        )}
        {...rest}
      />
      {(error || hint) && (
        <p id={noteId} className={cx('text-small', error ? 'text-danger' : 'text-ink-3')}>
          {error ?? hint}
        </p>
      )}
    </div>
  )
}
