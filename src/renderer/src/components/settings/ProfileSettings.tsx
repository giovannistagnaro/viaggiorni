import { useEffect, useState } from 'react'

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
      // TODO: surface to user via error UI
      console.error('Failed to change username', err)
    }
  }

  return username === null ? (
    <div>Loading...</div>
  ) : (
    <div>
      <span>Username: </span>
      <input
        type="text"
        defaultValue={username}
        onBlur={(e) => handleUsernameBlur(e.target.value)}
        placeholder="Enter username..."
      />
    </div>
  )
}

export default ProfileSettings
