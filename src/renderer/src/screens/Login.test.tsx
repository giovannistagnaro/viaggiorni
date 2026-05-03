import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Login from './Login'
import { ENTER_YOUR_PASSWORD_PLACEHOLDER_TEXT } from './screenConstants'

beforeEach(() => {
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
})
