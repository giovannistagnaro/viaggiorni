import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Topbar from './Topbar'
import { SaveStatusProvider } from './SaveStatus'
import { useSaveStatus } from '@renderer/utils/saveStatus'

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

  describe('save status indicator', () => {
    function MarkSavedTrigger(): React.JSX.Element {
      const { markSaved } = useSaveStatus()
      return (
        <button data-testid="trigger" onClick={markSaved}>
          mark saved
        </button>
      )
    }

    it('hides the indicator before any save has happened', () => {
      render(
        <SaveStatusProvider>
          <Topbar onLock={vi.fn()} onNavigateToSettings={vi.fn()} onNavigateToTemplate={vi.fn()}>
            <div />
          </Topbar>
        </SaveStatusProvider>
      )

      expect(screen.queryByText(/Saved/)).not.toBeInTheDocument()
    })

    it('hides the indicator when rendered without a SaveStatusProvider', () => {
      render(
        <Topbar onLock={vi.fn()} onNavigateToSettings={vi.fn()} onNavigateToTemplate={vi.fn()}>
          <div />
        </Topbar>
      )

      expect(screen.queryByText(/Saved/)).not.toBeInTheDocument()
    })

    it('shows the indicator after markSaved is called', async () => {
      render(
        <SaveStatusProvider>
          <MarkSavedTrigger />
          <Topbar onLock={vi.fn()} onNavigateToSettings={vi.fn()} onNavigateToTemplate={vi.fn()}>
            <div />
          </Topbar>
        </SaveStatusProvider>
      )

      await userEvent.click(screen.getByTestId('trigger'))

      expect(await screen.findByText(/Saved just now/)).toBeInTheDocument()
    })
  })
})
