'use client'

import { useActionState, useState } from 'react'
import type { UploadState } from '@/app/(app)/resumes/upload-actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cx } from '@/lib/cx'

/** Upload a PDF or Word resume; open it in the editor or just keep it. */
export function UploadResumeForm({ action }: { action: (prev: UploadState, form: FormData) => Promise<UploadState> }) {
  const [state, formAction, pending] = useActionState(action, {})
  const [mode, setMode] = useState<'edit' | 'save'>('edit')
  const [fileName, setFileName] = useState('')
  const [tooBig, setTooBig] = useState(false)

  return (
    <form action={formAction} className="grid gap-5">
      <div className="grid gap-1.5">
        <label htmlFor="resume-file" className="text-small font-medium text-ink-2">
          Resume file
        </label>
        <label
          htmlFor="resume-file"
          className={cx(
            'grid cursor-pointer justify-items-center gap-1 rounded-card border-2 border-dashed px-4 py-7 text-center transition-colors',
            fileName ? 'border-primary-tint-border bg-primary-tint/40' : 'border-line-strong hover:border-primary',
          )}
        >
          <span className="font-medium">{fileName || 'Choose a PDF or Word file'}</span>
          <span className="text-small text-ink-3">PDF, Word (.docx) or text · up to 5 MB</span>
        </label>
        <input
          id="resume-file"
          name="file"
          type="file"
          accept=".pdf,.docx,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
          required
          className="sr-only"
          onChange={(e) => {
            const f = e.target.files?.[0]
            setFileName(f?.name ?? '')
            setTooBig(Boolean(f && f.size > 5 * 1024 * 1024))
          }}
        />
        {tooBig && <p className="text-small text-danger">That file is larger than 5 MB.</p>}
      </div>
      <Input label="Name (optional)" name="name" placeholder="Defaults to the file name" maxLength={120} />
      <Input label="For (optional)" name="target" placeholder="Company or role it is for" maxLength={120} />
      <fieldset className="grid gap-2">
        <legend className="mb-1 text-small font-medium text-ink-2">After uploading</legend>
        {(
          [
            ['edit', 'Open it in the editor', 'The text is read into sections you can edit, restyle and tailor.'],
            ['save', 'Just save it', 'Keep the file in Resumes (with a download link); edit it later if you want.'],
          ] as const
        ).map(([value, title, text]) => (
          <label
            key={value}
            className={cx(
              'flex cursor-pointer gap-3 rounded-control border px-3.5 py-3 transition-colors',
              mode === value ? 'border-primary bg-primary-tint/50' : 'border-line hover:border-line-strong',
            )}
          >
            <input
              type="radio"
              name="mode"
              value={value}
              checked={mode === value}
              onChange={() => setMode(value)}
              className="mt-1 size-4 accent-[var(--color-primary)]"
            />
            <span>
              <span className="block font-medium">{title}</span>
              <span className="block text-small text-ink-2">{text}</span>
            </span>
          </label>
        ))}
      </fieldset>
      {state.error && (
        <p className="text-small text-danger" role="alert">
          {state.error}
        </p>
      )}
      <div>
        <Button type="submit" variant="primary" loading={pending} disabled={tooBig}>
          {pending ? 'Reading the file' : mode === 'edit' ? 'Upload and open the editor' : 'Upload and save'}
        </Button>
      </div>
    </form>
  )
}
