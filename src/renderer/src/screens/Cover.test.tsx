import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Cover from './Cover'

describe('Cover', () => {
  it('renders the journal title', () => {
    render(<Cover onNavigate={vi.fn()} onNavigateToToday={vi.fn()} />)

    expect(screen.getByRole('heading', { name: 'Viaggiorni' })).toBeInTheDocument()
  })

  it('renders the current year', () => {
    render(<Cover onNavigate={vi.fn()} onNavigateToToday={vi.fn()} />)

    const currentYear = new Date().getFullYear().toString()
    expect(screen.getByRole('heading', { name: currentYear })).toBeInTheDocument()
  })

  it('renders Open and Today buttons', () => {
    render(<Cover onNavigate={vi.fn()} onNavigateToToday={vi.fn()} />)

    expect(screen.getByRole('button', { name: 'Open' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Today' })).toBeInTheDocument()
  })

  it('navigates to the index screen when Open is clicked', async () => {
    const onNavigate = vi.fn()
    render(<Cover onNavigate={onNavigate} onNavigateToToday={vi.fn()} />)

    await userEvent.click(screen.getByRole('button', { name: 'Open' }))

    expect(onNavigate).toHaveBeenCalledWith('index')
  })

  it('calls onNavigateToToday when Today is clicked', async () => {
    const onNavigateToToday = vi.fn()
    render(<Cover onNavigate={vi.fn()} onNavigateToToday={onNavigateToToday} />)

    await userEvent.click(screen.getByRole('button', { name: 'Today' }))

    expect(onNavigateToToday).toHaveBeenCalledTimes(1)
  })
})
