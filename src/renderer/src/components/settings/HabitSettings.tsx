import { SafeReturnSettings } from '@shared/types'
import { useEffect, useState } from 'react'

function HabitSettings(): React.JSX.Element {
  const [settings, setSettings] = useState<SafeReturnSettings | null>(null)

  useEffect(() => {
    async function getSettings(): Promise<void> {
      setSettings(await window.api.settings.getSettings())
    }

    getSettings()
  }, [])

  async function handleStreakToleranceBlur(newTolerance: number): Promise<void> {
    if (!Number.isInteger(newTolerance) || newTolerance < 0) return

    try {
      if (!settings) return

      await window.api.settings.updateStreakTolerance(newTolerance)
      setSettings({ ...settings, streakTolerance: newTolerance })
    } catch (err) {
      // TODO: surface to user via error UI
      console.error('Failed to change streak tolerance', err)
    }
  }

  return !settings ? (
    <div>Loading...</div>
  ) : (
    <div>
      <span>Streak Tolerance: </span>
      <input
        type="number"
        min="0"
        step="1"
        defaultValue={settings.streakTolerance}
        onBlur={(e) => handleStreakToleranceBlur(Number(e.target.value))}
      />
    </div>
  )
}

export default HabitSettings
