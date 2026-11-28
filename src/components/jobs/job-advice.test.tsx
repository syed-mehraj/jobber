import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { JobAdvice as Advice } from '@/jobs/advice'

const adviseForJob = vi.fn()
const createTailoredResume = vi.fn()
vi.mock('@/app/(app)/jobs/advice-actions', () => ({
  adviseForJob: (...a: unknown[]) => adviseForJob(...a),
  createTailoredResume: (...a: unknown[]) => createTailoredResume(...a),
}))

const { JobAdvice } = await import('./job-advice')

const advice: Advice = {
  fit: 'good',
  headline: 'You cover the core of this role.',
  emphasize: ['Lead with the voice agent project'],
  gaps: ['Kafka: add only if you have used it'],
  suggestions: [
    { path: 'summary.text', before: 'Old summary', after: 'New summary', reason: 'Mirrors the posting' },
    { path: 'experience.a.bullets.b', before: 'Old bullet', after: 'New bullet', reason: 'Plain verb' },
  ],
}

describe('JobAdvice', () => {
  beforeEach(() => {
    adviseForJob.mockReset()
    createTailoredResume.mockReset()
  })

  it('asks only when clicked, shows the advice, and sends only the ticked edits', async () => {
    adviseForJob.mockResolvedValue({ ok: true, advice })
    createTailoredResume.mockResolvedValue(undefined)
    render(<JobAdvice jobId={7} label="Backend Engineer – Acme" />)
    expect(adviseForJob).not.toHaveBeenCalled()

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /get resume advice/i }))
    })
    expect(adviseForJob).toHaveBeenCalledWith(7)
    expect(await screen.findByText('Good fit')).toBeInTheDocument()
    expect(screen.getByText('Lead with the voice agent project')).toBeInTheDocument()
    expect(screen.getByText(/Kafka: add only if you have used it/)).toBeInTheDocument()

    const boxes = screen.getAllByRole('checkbox')
    expect(boxes).toHaveLength(2)
    expect(boxes.every((b) => (b as HTMLInputElement).checked)).toBe(true)
    await act(async () => {
      fireEvent.click(boxes[1])
    })
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Create tailored resume (1 edit)' }))
    })
    await waitFor(() => expect(createTailoredResume).toHaveBeenCalledTimes(1))
    expect(createTailoredResume).toHaveBeenCalledWith(7, [{ path: 'summary.text', after: 'New summary' }])
  })

  it('offers a plain copy when nothing is ticked', async () => {
    adviseForJob.mockResolvedValue({ ok: true, advice })
    render(<JobAdvice jobId={1} label="x" />)
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /get resume advice/i }))
    })
    for (const box of await screen.findAllByRole('checkbox'))
      await act(async () => {
        fireEvent.click(box)
      })
    expect(screen.getByRole('button', { name: 'Create a copy to edit' })).toBeInTheDocument()
  })

  it('shows an error and lets the person try again', async () => {
    adviseForJob.mockResolvedValue({ ok: false, error: 'You have used today’s 30 assistant requests.' })
    render(<JobAdvice jobId={1} label="x" />)
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /get resume advice/i }))
    })
    expect(await screen.findByRole('alert')).toHaveTextContent('used today')
    expect(screen.getByRole('button', { name: /get resume advice/i })).toBeInTheDocument()
  })

  it('shows a failure from creating the copy', async () => {
    adviseForJob.mockResolvedValue({ ok: true, advice })
    createTailoredResume.mockResolvedValue({ ok: false, error: 'You can keep up to 50 resumes. Delete one first.' })
    render(<JobAdvice jobId={1} label="x" />)
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /get resume advice/i }))
    })
    await act(async () => {
      fireEvent.click(await screen.findByRole('button', { name: /create tailored resume/i }))
    })
    expect(await screen.findByRole('alert')).toHaveTextContent('50 resumes')
  })
})
