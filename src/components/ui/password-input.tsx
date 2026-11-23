'use client'

import { useState, type ComponentProps } from 'react'
import { EyeIcon, EyeOffIcon } from './icons'
import { Input } from './input'

/** A password box with an eye button that shows or hides what was typed. */
export function PasswordInput(props: Omit<ComponentProps<typeof Input>, 'type' | 'end'>) {
  const [shown, setShown] = useState(false)
  return (
    <Input
      {...props}
      type={shown ? 'text' : 'password'}
      end={
        <button
          type="button"
          onClick={() => setShown((v) => !v)}
          aria-label={shown ? 'Hide password' : 'Show password'}
          aria-pressed={shown}
          className="grid size-8 place-items-center rounded-control text-ink-3 transition-colors hover:bg-surface-muted hover:text-ink focus-visible:shadow-[0_0_0_3px_rgb(37_99_235/.35)] focus-visible:outline-none"
        >
          {shown ? <EyeOffIcon className="size-4" /> : <EyeIcon className="size-4" />}
        </button>
      }
    />
  )
}
