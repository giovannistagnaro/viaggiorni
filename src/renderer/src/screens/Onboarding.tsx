import { useState } from 'react'
import {
  MAX_PASSWORD_LENGTH,
  MAX_USERNAME_LENGTH,
  MIN_PASSWORD_LENGTH,
  MIN_USERNAME_LENGTH
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
      setError(`Username needs to be at least ${MIN_USERNAME_LENGTH} characters.`)
    } else if (name.length > MAX_USERNAME_LENGTH) {
      setError(`Username needs to be at most ${MAX_USERNAME_LENGTH} characters.`)
    } else {
      setStep('password')
    }
  }

  async function handlePasswordSubmit(event: React.SyntheticEvent): Promise<void> {
    event.preventDefault()
    setSubmitting(true)

    if (password.length < MIN_PASSWORD_LENGTH) {
      setError(`Password needs to be at least ${MIN_PASSWORD_LENGTH} characters.`)
    } else if (password.length > MAX_PASSWORD_LENGTH) {
      setError(`Password needs to be at most ${MAX_PASSWORD_LENGTH} characters.`)
    } else if (password !== confirmPassword) {
      setError('Passwords do not match.')
    } else {
      const openDbResult = await window.api.db.open(password)
      if (openDbResult.success) {
        await window.api.user.setUsername(name)
        onComplete()
      } else {
        setError(openDbResult.error)
      }
    }
    setSubmitting(false)
  }

  if (step === 'welcome') {
    return (
      <form onSubmit={handleNameSubmit}>
        <h1>Welcome to Viaggiorni!</h1>
        <input
          type="text"
          value={name}
          onChange={(e) => {
            setError(null)
            setName(e.target.value)
          }}
          placeholder="Enter your username."
          autoFocus
          disabled={submitting}
        />
        <button type="submit" disabled={submitting || !name}>
          {submitting ? 'Checking username...' : 'Continue'}
        </button>
        {error && <p>{error}</p>}
      </form>
    )
  }

  if (step === 'password') {
    return (
      <form onSubmit={handlePasswordSubmit}>
        <h1>Set your password.</h1>
        <input
          type="password"
          value={password}
          onChange={(e) => {
            setError(null)
            setPassword(e.target.value)
          }}
          placeholder="Enter your password."
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
          placeholder="Confirm your password."
          disabled={submitting}
        />
        <p>
          <b>Your password cannot be recovered. If you forget it, your journal is lost forever.</b>
        </p>
        <button type="submit" disabled={submitting || !password || !confirmPassword}>
          {submitting ? 'Checking password...' : 'Submit'}
        </button>
        {error && <p>{error}</p>}
      </form>
    )
  }

  throw new Error('unreachable')
}

export default Onboarding
