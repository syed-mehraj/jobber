import { act, fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

vi.mock('@/app/(app)/actions', () => ({ markApplied: vi.fn() }))

const { ApplyButton } = await import('./apply-button')

describe('ApplyButton', () => {
  it('opens the company page in a new tab, asks "Did you apply?", then records it', async () => {
    const onApplied = vi.fn(async () => {})
    render(
      <ApplyButton jobId={7} url="https://example.com/careers" label="SDE Intern at Example" onApplied={onApplied} />,
    )
    const apply = screen.getByRole('link', { name: /Apply to SDE Intern at Example/ })
    expect(apply).toHaveAttribute('target', '_blank')
    expect(apply).toHaveAttribute('rel', 'noopener noreferrer')

    fireEvent.click(apply)
    expect(screen.getByText('Did you apply?')).toBeInTheDocument()

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Yes' }))
    })
    expect(onApplied).toHaveBeenCalledWith(7)
    expect(screen.getByText('Applied')).toBeInTheDocument()
  })

  it('goes back to Apply on "Not yet", and shows Applied when already recorded', () => {
    const { unmount } = render(<ApplyButton jobId={1} url="https://example.com" label="X" onApplied={vi.fn()} />)
    fireEvent.click(screen.getByRole('link', { name: /Apply/ }))
    fireEvent.click(screen.getByRole('button', { name: 'Not yet' }))
    expect(screen.getByRole('link', { name: /Apply/ })).toBeInTheDocument()
    unmount()
    render(<ApplyButton jobId={1} url="https://example.com" label="X" applied onApplied={vi.fn()} />)
    expect(screen.getByText('Applied')).toBeInTheDocument()
  })
})
