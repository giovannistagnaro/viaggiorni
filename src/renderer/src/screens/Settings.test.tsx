import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Settings from './Settings'

// Stub the section components so this test focuses on Settings.tsx routing logic, not the children
vi.mock('@renderer/components/settings/ProfileSettings', () => ({
  default: () => <div data-testid="profile-section">Profile content</div>
}))
vi.mock('@renderer/components/settings/AppearanceSettings', () => ({
  default: () => <div data-testid="appearance-section">Appearance content</div>
}))
vi.mock('@renderer/components/settings/HabitSettings', () => ({
  default: () => <div data-testid="habits-section">Habits content</div>
}))
vi.mock('@renderer/components/settings/AISettings', () => ({
  default: () => <div data-testid="ai-section">AI content</div>
}))
vi.mock('@renderer/components/settings/BackupSettings', () => ({
  default: ({ onLockRequired }: { onLockRequired: () => void }) => (
    <div data-testid="backup-section">
      <button data-testid="trigger-lock" onClick={onLockRequired}>
        Trigger lock
      </button>
    </div>
  )
}))

beforeEach(() => {
  window.api = {
    settings: {
      getSettings: vi.fn().mockResolvedValue({
        id: 1,
        theme: 'light',
        streakTolerance: 0,
        ollamaModel: null,
        createdAt: '2026-05-01 00:00:00',
        updatedAt: null
      }),
      updateTheme: vi.fn(),
      updateStreakTolerance: vi.fn(),
      updateOllamaModel: vi.fn()
    }
  } as never
})

describe('Settings', () => {
  it('renders all section labels in the sidebar', async () => {
    render(<Settings onLock={vi.fn()} />)

    // 'Profile' appears twice (sidebar + active-section header), so use getAllByText.
    // The others only appear in the sidebar (since Profile is the default active section).
    await waitFor(() => {
      expect(screen.getAllByText('Profile').length).toBeGreaterThan(0)
    })
    expect(screen.getByText('Appearance')).toBeInTheDocument()
    expect(screen.getByText('Habits')).toBeInTheDocument()
    expect(screen.getByText('AI')).toBeInTheDocument()
    expect(screen.getByText('Backup')).toBeInTheDocument()
  })

  it('renders the Profile section by default', async () => {
    render(<Settings onLock={vi.fn()} />)

    expect(await screen.findByTestId('profile-section')).toBeInTheDocument()
  })

  it('switches to the Appearance section when clicked', async () => {
    render(<Settings onLock={vi.fn()} />)

    await screen.findByTestId('profile-section')
    await userEvent.click(screen.getByText('Appearance'))

    expect(screen.getByTestId('appearance-section')).toBeInTheDocument()
    expect(screen.queryByTestId('profile-section')).not.toBeInTheDocument()
  })

  it('switches to the AI section when clicked', async () => {
    render(<Settings onLock={vi.fn()} />)

    await screen.findByTestId('profile-section')
    await userEvent.click(screen.getByText('AI'))

    expect(screen.getByTestId('ai-section')).toBeInTheDocument()
    expect(screen.queryByTestId('profile-section')).not.toBeInTheDocument()
  })

  it('switches to the Backup section when clicked', async () => {
    render(<Settings onLock={vi.fn()} />)

    await screen.findByTestId('profile-section')
    await userEvent.click(screen.getByText('Backup'))

    expect(screen.getByTestId('backup-section')).toBeInTheDocument()
    expect(screen.queryByTestId('profile-section')).not.toBeInTheDocument()
  })

  it('threads onLock down to BackupSettings as onLockRequired', async () => {
    const onLock = vi.fn()
    render(<Settings onLock={onLock} />)

    await screen.findByTestId('profile-section')
    await userEvent.click(screen.getByText('Backup'))
    await userEvent.click(await screen.findByTestId('trigger-lock'))

    expect(onLock).toHaveBeenCalledTimes(1)
  })
})
