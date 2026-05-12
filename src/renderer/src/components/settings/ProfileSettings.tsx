import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Row, SETTINGS_INPUT } from './_shared'

function ProfileSettings(): React.JSX.Element {
  const [username, setUsername] = useState<string | null>(null)

  useEffect(() => {
    async function getUsername(): Promise<void> {
      setUsername(await window.api.user.getUsername())
    }
    getUsername()
  }, [])

  async function handleUsernameBlur(newUsername: string): Promise<void> {
    try {
      const trimmed = newUsername.trim()
      if (trimmed === '') return
      await window.api.user.setUsername(trimmed)
      setUsername(trimmed)
    } catch (err) {
      console.error('Failed to change username', err)
      toast.error('Failed to change username')
    }
  }

  if (username === null) {
    return <p className="font-serif text-muted-foreground text-sm italic">Loading…</p>
  }

  return (
    <Row label="Username" description="Shown on the cover and topbar." htmlFor="settings-username">
      <input
        id="settings-username"
        type="text"
        defaultValue={username}
        onBlur={(e) => handleUsernameBlur(e.target.value)}
        placeholder="Enter username..."
        className={SETTINGS_INPUT}
      />
    </Row>
  )
}

export default ProfileSettings
