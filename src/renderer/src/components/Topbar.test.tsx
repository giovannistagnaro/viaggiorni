import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Topbar from './Topbar'

describe('Topbar', () => {
  it('renders the children passed in', () => {
    render(
      <Topbar onLock={vi.fn()} onNavigateToSettings={vi.fn()} onNavigateToTemplate={vi.fn()}>
        <div>Slot content</div>
      </Topbar>
    )

    expect(screen.getByText('Slot content')).toBeInTheDocument()
  })

  it('renders a Lock button', () => {
    render(
      <Topbar onLock={vi.fn()} onNavigateToSettings={vi.fn()} onNavigateToTemplate={vi.fn()}>
        <div />
      </Topbar>
    )

    expect(screen.getByRole('button', { name: 'Lock app' })).toBeInTheDocument()
  })

  it('renders a Settings button', () => {
    render(
      <Topbar onLock={vi.fn()} onNavigateToSettings={vi.fn()} onNavigateToTemplate={vi.fn()}>
        <div />
      </Topbar>
    )

    expect(screen.getByRole('button', { name: 'Settings' })).toBeInTheDocument()
  })

  it('calls onLock when the Lock button is clicked', async () => {
    const onLock = vi.fn()
    render(
      <Topbar onLock={onLock} onNavigateToSettings={vi.fn()} onNavigateToTemplate={vi.fn()}>
        <div />
      </Topbar>
    )

    await userEvent.click(screen.getByRole('button', { name: 'Lock app' }))

    expect(onLock).toHaveBeenCalledTimes(1)
  })

  it('calls onNavigateToSettings when the Settings button is clicked', async () => {
    const onNavigateToSettings = vi.fn()
    render(
      <Topbar
        onLock={vi.fn()}
        onNavigateToSettings={onNavigateToSettings}
        onNavigateToTemplate={vi.fn()}
      >
        <div />
      </Topbar>
    )

    await userEvent.click(screen.getByRole('button', { name: 'Settings' }))

    expect(onNavigateToSettings).toHaveBeenCalledTimes(1)
  })

  it('calls onNavigateToTemplate when the Template button is clicked', async () => {
    const onNavigateToTemplate = vi.fn()
    render(
      <Topbar
        onLock={vi.fn()}
        onNavigateToSettings={vi.fn()}
        onNavigateToTemplate={onNavigateToTemplate}
      >
        <div />
      </Topbar>
    )

    await userEvent.click(screen.getByRole('button', { name: 'Template editor' }))

    expect(onNavigateToTemplate).toHaveBeenCalledTimes(1)
  })
})
