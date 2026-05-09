import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Topbar from './Topbar'

const ENTRY_DATE = '2026-05-07'

describe('Topbar', () => {
  it('renders the breadcrumb for the current screen', () => {
    render(
      <Topbar currentScreen="day" entryDate={ENTRY_DATE} onNavigate={vi.fn()} onLock={vi.fn()} />
    )

    // Day-level breadcrumb shows Cover, Index, and the entry date
    expect(screen.getByRole('button', { name: 'Cover' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Index' })).toBeInTheDocument()
    expect(screen.getByText(ENTRY_DATE)).toBeInTheDocument()
  })

  it('passes currentScreen through to the breadcrumb so non-day screens omit the date', () => {
    render(
      <Topbar currentScreen="index" entryDate={ENTRY_DATE} onNavigate={vi.fn()} onLock={vi.fn()} />
    )

    // Index-level breadcrumb omits the date even when entryDate is provided
    expect(screen.queryByText(ENTRY_DATE)).not.toBeInTheDocument()
  })

  it('renders a Lock button', () => {
    render(<Topbar currentScreen="day" onNavigate={vi.fn()} onLock={vi.fn()} />)

    expect(screen.getByRole('button', { name: 'Lock app' })).toBeInTheDocument()
  })

  it('calls onLock when the Lock button is clicked', async () => {
    const onLock = vi.fn()
    render(<Topbar currentScreen="day" onNavigate={vi.fn()} onLock={onLock} />)

    await userEvent.click(screen.getByRole('button', { name: 'Lock app' }))

    expect(onLock).toHaveBeenCalledTimes(1)
  })

  it('calls onNavigate when a breadcrumb segment is clicked', async () => {
    const onNavigate = vi.fn()
    render(
      <Topbar currentScreen="day" entryDate={ENTRY_DATE} onNavigate={onNavigate} onLock={vi.fn()} />
    )

    await userEvent.click(screen.getByRole('button', { name: 'Cover' }))

    expect(onNavigate).toHaveBeenCalledWith('cover')
  })
})
