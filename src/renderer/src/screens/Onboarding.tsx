import { useState } from 'react'
import {
  ERROR_MESSAGE_PASSWORD_MISMATCH,
  ERROR_MESSAGE_PASSWORD_TOO_LONG,
  ERROR_MESSAGE_PASSWORD_TOO_SHORT,
  ERROR_MESSAGE_USERNAME_TOO_LONG,
  ERROR_MESSAGE_USERNAME_TOO_SHORT,
  MAX_PASSWORD_LENGTH,
  MAX_USERNAME_LENGTH,
  MIN_PASSWORD_LENGTH,
  MIN_USERNAME_LENGTH,
  PASSWORD_RECOVERY_WARNING_TEXT,
  PASSWORD_SCREEN_CONFIRMATION_PLACEHOLDER_TEXT,
  PASSWORD_SCREEN_HEADER_TEXT,
  ENTER_YOUR_PASSWORD_PLACEHOLDER_TEXT,
  PASSWORD_SUBMIT_BUTTON_TEXT,
  USERNAME_SUBMIT_BUTTON_TEXT,
  WELCOME_SCREEN_HEADER_TEXT,
  WELCOME_SCREEN_PLACEHOLDER_TEXT
} from './screenConstants'

interface Props {
  onComplete: () => void
}

type Step = 'welcome' | 'password'

function Onboarding({ onComplete }: Props): React.JSX.Element {
  const [step, setStep] = useState<Step>('welcome')
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  function handleNameSubmit(event: React.SyntheticEvent): void {
    event.preventDefault()

    if (name.length < MIN_USERNAME_LENGTH) {
      setError(ERROR_MESSAGE_USERNAME_TOO_SHORT)
    } else if (name.length > MAX_USERNAME_LENGTH) {
      setError(ERROR_MESSAGE_USERNAME_TOO_LONG)
    } else {
      setStep('password')
    }
  }

  async function handlePasswordSubmit(event: React.SyntheticEvent): Promise<void> {
    event.preventDefault()
    setSubmitting(true)

    if (password.length < MIN_PASSWORD_LENGTH) {
      setError(ERROR_MESSAGE_PASSWORD_TOO_SHORT)
    } else if (password.length > MAX_PASSWORD_LENGTH) {
      setError(ERROR_MESSAGE_PASSWORD_TOO_LONG)
    } else if (password !== confirmPassword) {
      setError(ERROR_MESSAGE_PASSWORD_MISMATCH)
    } else {
      try {
        const openDbResult = await window.api.db.open(password)
        if (openDbResult.success) {
          await window.api.user.setUsername(name)
          onComplete()
        } else {
          setError(openDbResult.error)
        }
      } catch (err) {
        // TODO: surface to user via error UI
        console.error('Failed to complete onboarding', err)
        setError('Something went wrong. Please try again.')
      }
    }
    setSubmitting(false)
  }

  if (step === 'welcome') {
    return (
      <form onSubmit={handleNameSubmit}>
        <h1>{WELCOME_SCREEN_HEADER_TEXT}</h1>
        <input
          type="text"
          value={name}
          onChange={(e) => {
            setError(null)
            setName(e.target.value)
          }}
          placeholder={WELCOME_SCREEN_PLACEHOLDER_TEXT}
          autoFocus
          disabled={submitting}
        />
        <button type="submit" disabled={submitting || !name}>
          {USERNAME_SUBMIT_BUTTON_TEXT(submitting)}
        </button>
        {error && <p>{error}</p>}
      </form>
    )
  }

  if (step === 'password') {
    return (
      <form onSubmit={handlePasswordSubmit}>
        <h1>{PASSWORD_SCREEN_HEADER_TEXT}</h1>
        <input
          type="password"
          value={password}
          onChange={(e) => {
            setError(null)
            setPassword(e.target.value)
          }}
          placeholder={ENTER_YOUR_PASSWORD_PLACEHOLDER_TEXT}
          autoFocus
          disabled={submitting}
        />
        <input
          type="password"
          value={confirmPassword}
          onChange={(e) => {
            setError(null)
            setConfirmPassword(e.target.value)
          }}
          placeholder={PASSWORD_SCREEN_CONFIRMATION_PLACEHOLDER_TEXT}
          disabled={submitting}
        />
        <p>
          <b>{PASSWORD_RECOVERY_WARNING_TEXT}</b>
        </p>
        <button type="submit" disabled={submitting || !password || !confirmPassword}>
          {PASSWORD_SUBMIT_BUTTON_TEXT(submitting)}
        </button>
        {error && <p>{error}</p>}
      </form>
    )
  }

  throw new Error('unreachable')
}

export default Onboarding
