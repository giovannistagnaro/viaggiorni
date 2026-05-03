import { useEffect, useState } from 'react'
import { ENTER_YOUR_PASSWORD_PLACEHOLDER_TEXT } from './screenConstants'

interface Props {
  onSuccess: () => void
}

function Login({ onSuccess }: Props): React.JSX.Element {
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [username, setUsername] = useState<string>('')

  useEffect(() => {
    async function getUsernameWrapper(): Promise<void> {
      const fetchedUsername = await window.api.user.getUsername()
      setUsername(fetchedUsername ?? '')
    }
    getUsernameWrapper()
  }, [])

  function getGreeting(name: string): string {
    const suffix = name.length > 0 ? `, ${name}` : ''
    const hour = new Date().getHours()
    if (hour >= 5 && hour < 12) {
      return `Good morning${suffix}!`
    } else if (hour >= 12 && hour < 18) {
      return `Good afternoon${suffix}!`
    } else if (hour >= 18 && hour < 22) {
      return `Good evening${suffix}!`
    } else if (hour >= 22 && hour < 24) {
      return `It's getting late${suffix}!`
    } else {
      return `Up at this hour${suffix}?`
    }
  }

  async function handleSubmit(event: React.SyntheticEvent): Promise<void> {
    event.preventDefault()
    setSubmitting(true)
    setError(null)

    const openDbResult = await window.api.db.open(password)
    if (openDbResult.success) {
      onSuccess()
    } else {
      setError(openDbResult.error)
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ padding: 20 }}>
      <h1>{getGreeting(username)}</h1>

      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder={ENTER_YOUR_PASSWORD_PLACEHOLDER_TEXT}
        autoFocus
        disabled={submitting}
      />
      <button type="submit" disabled={submitting || !password}>
        {submitting ? 'Unlocking...' : 'Unlock'}
      </button>
      {error && <p>{error}</p>}
      <p>Your journal is encrypted locally on this device.</p>
    </form>
  )
}

export default Login
