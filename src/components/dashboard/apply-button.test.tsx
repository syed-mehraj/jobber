import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { ApplyButton } from './apply-button'

describe('ApplyButton', () => {
  it('opens the company page in a new tab, then asks "Did you apply?"', () => {
    render(<ApplyButton url="https://example.com/careers" label="SDE Intern at Example" />)
    const apply = screen.getByRole('link', { name: /Apply to SDE Intern at Example/ })
    expect(apply).toHaveAttribute('target', '_blank')
    expect(apply).toHaveAttribute('rel', 'noopener noreferrer')

    fireEvent.click(apply)
    expect(screen.getByText('Did you apply?')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Yes' }))
    expect(screen.getByText('Applied')).toBeInTheDocument()
  })

  it('goes back to Apply on "Not yet"', () => {
    render(<ApplyButton url="https://example.com/careers" label="SDE Intern at Example" />)
    fireEvent.click(screen.getByRole('link', { name: /Apply/ }))
    fireEvent.click(screen.getByRole('button', { name: 'Not yet' }))
    expect(screen.getByRole('link', { name: /Apply/ })).toBeInTheDocument()
  })
})
