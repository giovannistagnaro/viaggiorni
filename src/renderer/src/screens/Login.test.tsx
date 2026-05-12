import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { toast } from 'sonner'
import Login from './Login'
import { ENTER_YOUR_PASSWORD_PLACEHOLDER_TEXT } from './screenConstants'

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn()
  }
}))

beforeEach(() => {
  vi.mocked(toast.success).mockClear()
  vi.mocked(toast.error).mockClear()
  window.api = {
    db: {
      open: vi.fn(),
      close: vi.fn(),
      isUnlocked: vi.fn(),
      isFirstLaunch: vi.fn()
    },
    user: {
      getUsername: vi.fn().mockResolvedValue(''),
      setUsername: vi.fn()
    },
    backup: {
      exportBackup: vi.fn(),
      importBackup: vi.fn()
    }
  } as never
})

describe('Login', () => {
  it('disables submit button when password is empty', () => {
    render(<Login onSuccess={vi.fn()} />)

    expect(screen.getByRole('button', { name: /unlock/i })).toBeDisabled()
  })

  it('fetches and displays username in greeting on mount', async () => {
    vi.mocked(window.api.user.getUsername).mockResolvedValue('alice')

    render(<Login onSuccess={vi.fn()} />)

    expect(await screen.findByText(/alice/)).toBeInTheDocument()
  })

  it('calls onSuccess when db.open succeeds', async () => {
    vi.mocked(window.api.db.open).mockResolvedValue({ success: true })
    const onSuccess = vi.fn()

    render(<Login onSuccess={onSuccess} />)

    await userEvent.type(
      screen.getByPlaceholderText(ENTER_YOUR_PASSWORD_PLACEHOLDER_TEXT),
      'mypassword'
    )
    await userEvent.click(screen.getByRole('button', { name: /unlock/i }))

    expect(window.api.db.open).toHaveBeenCalledWith('mypassword')
    expect(onSuccess).toHaveBeenCalled()
  })

  it('shows error message when db.open fails', async () => {
    vi.mocked(window.api.db.open).mockResolvedValue({
      success: false,
      error: 'Invalid password'
    })

    render(<Login onSuccess={vi.fn()} />)

    await userEvent.type(
      screen.getByPlaceholderText(ENTER_YOUR_PASSWORD_PLACEHOLDER_TEXT),
      'wrongpassword'
    )
    await userEvent.click(screen.getByRole('button', { name: /unlock/i }))

    expect(screen.getByText('Invalid password')).toBeInTheDocument()
  })

  it('disables form inputs while submitting', async () => {
    let resolveOpen: (
      value: { success: true } | { success: false; error: string }
    ) => void = () => {}
    vi.mocked(window.api.db.open).mockReturnValue(
      new Promise((resolve) => {
        resolveOpen = resolve
      })
    )

    render(<Login onSuccess={vi.fn()} />)

    await userEvent.type(
      screen.getByPlaceholderText(ENTER_YOUR_PASSWORD_PLACEHOLDER_TEXT),
      'mypassword'
    )
    await userEvent.click(screen.getByRole('button', { name: /unlock/i }))

    expect(screen.getByPlaceholderText(ENTER_YOUR_PASSWORD_PLACEHOLDER_TEXT)).toBeDisabled()
    expect(screen.getByRole('button', { name: /unlocking/i })).toBeDisabled()

    resolveOpen({ success: false, error: 'cleanup' })
  })

  it('re-enables form after a failed attempt', async () => {
    vi.mocked(window.api.db.open).mockResolvedValue({
      success: false,
      error: 'Invalid password'
    })

    render(<Login onSuccess={vi.fn()} />)

    await userEvent.type(
      screen.getByPlaceholderText(ENTER_YOUR_PASSWORD_PLACEHOLDER_TEXT),
      'wrongpassword'
    )
    await userEvent.click(screen.getByRole('button', { name: /unlock/i }))

    expect(screen.getByPlaceholderText(ENTER_YOUR_PASSWORD_PLACEHOLDER_TEXT)).not.toBeDisabled()
    expect(screen.getByRole('button', { name: /unlock/i })).not.toBeDisabled()
  })

  describe('restore from backup', () => {
    it('renders a "Restore from backup" button', () => {
      render(<Login onSuccess={vi.fn()} />)

      expect(screen.getByRole('button', { name: /restore from backup/i })).toBeInTheDocument()
    })

    it('calls backup.importBackup when clicked', async () => {
      vi.mocked(window.api.backup.importBackup).mockResolvedValue({
        success: false,
        reason: 'cancelled'
      })

      render(<Login onSuccess={vi.fn()} />)

      await userEvent.click(screen.getByRole('button', { name: /restore from backup/i }))

      expect(window.api.backup.importBackup).toHaveBeenCalled()
    })

    it('shows a success toast and re-fetches the username on success', async () => {
      vi.mocked(window.api.backup.importBackup).mockResolvedValue({ success: true })
      // First call (on mount) returns ''; second call (after import) returns 'restored'
      vi.mocked(window.api.user.getUsername)
        .mockResolvedValueOnce('')
        .mockResolvedValueOnce('restored')

      render(<Login onSuccess={vi.fn()} />)

      await userEvent.click(screen.getByRole('button', { name: /restore from backup/i }))

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith(expect.stringMatching(/restored/i))
      })
      expect(window.api.user.getUsername).toHaveBeenCalledTimes(2)
      expect(await screen.findByText(/restored/)).toBeInTheDocument()
    })

    it('clears the password input on successful restore', async () => {
      vi.mocked(window.api.backup.importBackup).mockResolvedValue({ success: true })

      render(<Login onSuccess={vi.fn()} />)

      const passwordInput = screen.getByPlaceholderText(ENTER_YOUR_PASSWORD_PLACEHOLDER_TEXT)
      await userEvent.type(passwordInput, 'typedpassword')
      expect(passwordInput).toHaveValue('typedpassword')

      await userEvent.click(screen.getByRole('button', { name: /restore from backup/i }))

      await waitFor(() => {
        expect(passwordInput).toHaveValue('')
      })
    })

    it('does not show an error toast when the user cancels', async () => {
      vi.mocked(window.api.backup.importBackup).mockResolvedValue({
        success: false,
        reason: 'cancelled'
      })

      render(<Login onSuccess={vi.fn()} />)

      await userEvent.click(screen.getByRole('button', { name: /restore from backup/i }))

      await waitFor(() => {
        expect(window.api.backup.importBackup).toHaveBeenCalled()
      })
      expect(toast.error).not.toHaveBeenCalled()
      expect(toast.success).not.toHaveBeenCalled()
    })

    it('shows an error toast when the restore fails for a non-cancel reason', async () => {
      vi.mocked(window.api.backup.importBackup).mockResolvedValue({
        success: false,
        reason: 'invalid_zip'
      })

      render(<Login onSuccess={vi.fn()} />)

      await userEvent.click(screen.getByRole('button', { name: /restore from backup/i }))

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith(expect.stringMatching(/restore backup/i))
      })
    })

    it('shows an error toast when the IPC itself throws', async () => {
      vi.mocked(window.api.backup.importBackup).mockRejectedValue(new Error('IPC broken'))

      render(<Login onSuccess={vi.fn()} />)

      await userEvent.click(screen.getByRole('button', { name: /restore from backup/i }))

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith(expect.stringMatching(/restore backup/i))
      })
    })
  })
})
