import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Onboarding from './Onboarding'
import {
  ERROR_MESSAGE_PASSWORD_MISMATCH,
  ERROR_MESSAGE_PASSWORD_TOO_LONG,
  ERROR_MESSAGE_PASSWORD_TOO_SHORT,
  ERROR_MESSAGE_USERNAME_TOO_LONG,
  ERROR_MESSAGE_USERNAME_TOO_SHORT,
  MAX_PASSWORD_LENGTH,
  MAX_USERNAME_LENGTH,
  MIN_PASSWORD_LENGTH,
  PASSWORD_RECOVERY_WARNING_TEXT,
  PASSWORD_SCREEN_CONFIRMATION_PLACEHOLDER_TEXT,
  PASSWORD_SCREEN_HEADER_TEXT,
  ENTER_YOUR_PASSWORD_PLACEHOLDER_TEXT,
  PASSWORD_SUBMIT_BUTTON_TEXT,
  USERNAME_SUBMIT_BUTTON_TEXT,
  WELCOME_SCREEN_PLACEHOLDER_TEXT
} from './screenConstants'

async function advanceToPasswordStep(): Promise<void> {
  await userEvent.type(screen.getByPlaceholderText(WELCOME_SCREEN_PLACEHOLDER_TEXT), 'alice')
  await userEvent.click(screen.getByRole('button', { name: USERNAME_SUBMIT_BUTTON_TEXT(false) }))
}

beforeEach(() => {
  window.api = {
    db: {
      open: vi.fn(),
      close: vi.fn(),
      isUnlocked: vi.fn(),
      isFirstLaunch: vi.fn()
    },
    user: {
      getUsername: vi.fn(),
      setUsername: vi.fn()
    }
  } as never
})

describe('Onboarding', () => {
  describe('welcome step', () => {
    it('starts on the welcome step', () => {
      render(<Onboarding onComplete={vi.fn()} />)

      expect(screen.getByPlaceholderText(WELCOME_SCREEN_PLACEHOLDER_TEXT)).toBeInTheDocument()
    })
    it('shows error when username is too short', async () => {
      render(<Onboarding onComplete={vi.fn()} />)

      await userEvent.type(screen.getByPlaceholderText(WELCOME_SCREEN_PLACEHOLDER_TEXT), 'A')
      await userEvent.click(
        screen.getByRole('button', { name: USERNAME_SUBMIT_BUTTON_TEXT(false) })
      )

      expect(screen.getByText(ERROR_MESSAGE_USERNAME_TOO_SHORT)).toBeInTheDocument()
    })
    it('shows error when username is too long', async () => {
      render(<Onboarding onComplete={vi.fn()} />)

      await userEvent.type(
        screen.getByPlaceholderText(WELCOME_SCREEN_PLACEHOLDER_TEXT),
        'A'.repeat(MAX_USERNAME_LENGTH + 1)
      )
      await userEvent.click(
        screen.getByRole('button', { name: USERNAME_SUBMIT_BUTTON_TEXT(false) })
      )

      expect(screen.getByText(ERROR_MESSAGE_USERNAME_TOO_LONG)).toBeInTheDocument()
    })
    it('advances to the password step on valid username', async () => {
      render(<Onboarding onComplete={vi.fn()} />)

      await userEvent.type(screen.getByPlaceholderText(WELCOME_SCREEN_PLACEHOLDER_TEXT), 'alice')
      await userEvent.click(
        screen.getByRole('button', { name: USERNAME_SUBMIT_BUTTON_TEXT(false) })
      )

      expect(screen.getByText(PASSWORD_SCREEN_HEADER_TEXT)).toBeInTheDocument()
    })
    it('disables continue button when name is empty', () => {
      render(<Onboarding onComplete={vi.fn()} />)

      expect(
        screen.getByRole('button', { name: USERNAME_SUBMIT_BUTTON_TEXT(false) })
      ).toBeDisabled()
    })
  })

  describe('password step', () => {
    it('renders the no-recovery warning', async () => {
      render(<Onboarding onComplete={vi.fn()} />)
      await advanceToPasswordStep()

      expect(screen.getByText(PASSWORD_RECOVERY_WARNING_TEXT)).toBeInTheDocument()
    })
    it('shows error when password is too short', async () => {
      render(<Onboarding onComplete={vi.fn()} />)
      await advanceToPasswordStep()

      await userEvent.type(screen.getByPlaceholderText(ENTER_YOUR_PASSWORD_PLACEHOLDER_TEXT), 'A')
      await userEvent.type(
        screen.getByPlaceholderText(PASSWORD_SCREEN_CONFIRMATION_PLACEHOLDER_TEXT),
        'A'
      )
      await userEvent.click(
        screen.getByRole('button', { name: PASSWORD_SUBMIT_BUTTON_TEXT(false) })
      )

      expect(screen.getByText(ERROR_MESSAGE_PASSWORD_TOO_SHORT)).toBeInTheDocument()
    })
    it('shows error when password is too long', async () => {
      render(<Onboarding onComplete={vi.fn()} />)
      await advanceToPasswordStep()

      await userEvent.type(
        screen.getByPlaceholderText(ENTER_YOUR_PASSWORD_PLACEHOLDER_TEXT),
        'A'.repeat(MAX_PASSWORD_LENGTH + 1)
      )
      await userEvent.type(
        screen.getByPlaceholderText(PASSWORD_SCREEN_CONFIRMATION_PLACEHOLDER_TEXT),
        'A'.repeat(MAX_PASSWORD_LENGTH + 1)
      )
      await userEvent.click(
        screen.getByRole('button', { name: PASSWORD_SUBMIT_BUTTON_TEXT(false) })
      )

      expect(screen.getByText(ERROR_MESSAGE_PASSWORD_TOO_LONG)).toBeInTheDocument()
    })
    it('shows error when passwords do not match', async () => {
      render(<Onboarding onComplete={vi.fn()} />)
      await advanceToPasswordStep()

      await userEvent.type(
        screen.getByPlaceholderText(ENTER_YOUR_PASSWORD_PLACEHOLDER_TEXT),
        'A'.repeat(MIN_PASSWORD_LENGTH)
      )
      await userEvent.type(
        screen.getByPlaceholderText(PASSWORD_SCREEN_CONFIRMATION_PLACEHOLDER_TEXT),
        'B'.repeat(MIN_PASSWORD_LENGTH)
      )
      await userEvent.click(
        screen.getByRole('button', { name: PASSWORD_SUBMIT_BUTTON_TEXT(false) })
      )

      expect(screen.getByText(ERROR_MESSAGE_PASSWORD_MISMATCH)).toBeInTheDocument()
    })
    it('calls db.open with password then setUsername then onComplete on valid submission', async () => {
      vi.mocked(window.api.db.open).mockResolvedValue({ success: true })
      const onComplete = vi.fn()

      render(<Onboarding onComplete={onComplete} />)
      await advanceToPasswordStep()

      await userEvent.type(
        screen.getByPlaceholderText(ENTER_YOUR_PASSWORD_PLACEHOLDER_TEXT),
        'mypassword123'
      )
      await userEvent.type(
        screen.getByPlaceholderText(PASSWORD_SCREEN_CONFIRMATION_PLACEHOLDER_TEXT),
        'mypassword123'
      )
      await userEvent.click(
        screen.getByRole('button', { name: PASSWORD_SUBMIT_BUTTON_TEXT(false) })
      )

      expect(window.api.db.open).toHaveBeenCalledWith('mypassword123')
      expect(window.api.user.setUsername).toHaveBeenCalledWith('alice')
      expect(onComplete).toHaveBeenCalled()
    })
    it('shows error message when db.open fails', async () => {
      vi.mocked(window.api.db.open).mockResolvedValue({
        success: false,
        error: 'Invalid password'
      })

      render(<Onboarding onComplete={vi.fn()} />)
      await advanceToPasswordStep()

      await userEvent.type(
        screen.getByPlaceholderText(ENTER_YOUR_PASSWORD_PLACEHOLDER_TEXT),
        'mypassword123'
      )
      await userEvent.type(
        screen.getByPlaceholderText(PASSWORD_SCREEN_CONFIRMATION_PLACEHOLDER_TEXT),
        'mypassword123'
      )
      await userEvent.click(
        screen.getByRole('button', { name: PASSWORD_SUBMIT_BUTTON_TEXT(false) })
      )

      expect(screen.getByText('Invalid password')).toBeInTheDocument()
    })
  })
})
