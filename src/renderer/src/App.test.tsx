import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from './App'

// Stub child screens so the test focuses on App's hotkey/screen logic.
// Login exposes its onSuccess callback as a clickable button so tests can
// drive App into a post-login state without needing the real password flow.
vi.mock('./screens/Login', () => ({
  default: ({ onSuccess }: { onSuccess: () => void }) => (
    <button data-testid="mock-login-success" onClick={onSuccess}>
      Mock Login
    </button>
  )
}))
vi.mock('./screens/Onboarding', () => ({
  default: ({ onComplete }: { onComplete: () => void }) => (
    <button data-testid="mock-onboarding-complete" onClick={onComplete}>
      Mock Onboarding
    </button>
  )
}))
vi.mock('./screens/Cover', () => ({ default: () => <div data-testid="cover-screen">Cover</div> }))
vi.mock('./screens/Index', () => ({ default: () => <div data-testid="index-screen">Index</div> }))
vi.mock('./screens/Day', () => ({
  default: () => <div data-testid="day-screen">Day</div>
}))
vi.mock('./screens/Settings', () => ({
  default: () => <div data-testid="settings-screen">Settings</div>
}))
vi.mock('./screens/Template', () => ({
  default: () => <div data-testid="template-screen">Template</div>
}))
vi.mock('./components/Topbar', () => ({
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>
}))
vi.mock('./components/Breadcrumb', () => ({ default: () => <nav /> }))

beforeEach(() => {
  window.api = {
    db: {
      open: vi.fn(),
      close: vi.fn().mockResolvedValue(undefined),
      isUnlocked: vi.fn().mockResolvedValue(false),
      isFirstLaunch: vi.fn().mockResolvedValue(false)
    },
    user: {
      getUsername: vi.fn().mockResolvedValue(''),
      setUsername: vi.fn()
    }
  } as never
})

async function renderAndAdvanceToCover(): Promise<void> {
  render(<App />)
  const loginBtn = await screen.findByTestId('mock-login-success')
  await userEvent.click(loginBtn)
  await screen.findByTestId('cover-screen')
}

describe('App', () => {
  describe('hotkey gating before login', () => {
    it('mod+l does not call db.close on the login screen', async () => {
      render(<App />)
      await screen.findByTestId('mock-login-success')

      await userEvent.keyboard('{Control>}l{/Control}')

      expect(window.api.db.close).not.toHaveBeenCalled()
    })

    it('mod+l does not call db.close on the onboarding screen', async () => {
      vi.mocked(window.api.db.isFirstLaunch).mockResolvedValue(true)
      render(<App />)
      await screen.findByTestId('mock-onboarding-complete')

      await userEvent.keyboard('{Control>}l{/Control}')

      expect(window.api.db.close).not.toHaveBeenCalled()
    })

    it('esc does not crash on the login screen even though SCREEN_CONFIG lacks login', async () => {
      render(<App />)
      await screen.findByTestId('mock-login-success')

      // Should be a no-op, not throw
      await userEvent.keyboard('{Escape}')

      expect(screen.getByTestId('mock-login-success')).toBeInTheDocument()
    })
  })

  describe('hotkeys after login', () => {
    it('mod+l locks the app (calls db.close and returns to login screen)', async () => {
      await renderAndAdvanceToCover()

      await userEvent.keyboard('{Control>}l{/Control}')

      await waitFor(() => {
        expect(window.api.db.close).toHaveBeenCalled()
      })
      expect(await screen.findByTestId('mock-login-success')).toBeInTheDocument()
    })

    it('mod+, navigates to the settings screen from cover', async () => {
      await renderAndAdvanceToCover()

      await userEvent.keyboard('{Control>}[Comma]{/Control}')

      expect(await screen.findByTestId('settings-screen')).toBeInTheDocument()
    })

    it('mod+, on settings navigates back to the previous screen', async () => {
      await renderAndAdvanceToCover()
      await userEvent.keyboard('{Control>}[Comma]{/Control}')
      await screen.findByTestId('settings-screen')

      await userEvent.keyboard('{Control>}[Comma]{/Control}')

      expect(await screen.findByTestId('cover-screen')).toBeInTheDocument()
    })

    it('mod+. navigates to the template screen from cover', async () => {
      await renderAndAdvanceToCover()

      await userEvent.keyboard('{Control>}[Period]{/Control}')

      expect(await screen.findByTestId('template-screen')).toBeInTheDocument()
    })

    it('esc on a settings screen navigates back to the previous screen', async () => {
      await renderAndAdvanceToCover()
      await userEvent.keyboard('{Control>}[Comma]{/Control}')
      await screen.findByTestId('settings-screen')

      await userEvent.keyboard('{Escape}')

      expect(await screen.findByTestId('cover-screen')).toBeInTheDocument()
    })

    it('esc on a non-overlay screen is a no-op', async () => {
      await renderAndAdvanceToCover()

      await userEvent.keyboard('{Escape}')

      expect(screen.getByTestId('cover-screen')).toBeInTheDocument()
    })
  })
})
