import AISettings from '@renderer/components/settings/AISettings'
import AppearanceSettings from '@renderer/components/settings/AppearanceSettings'
import BackupSettings from '@renderer/components/settings/BackupSettings'
import HabitSettings from '@renderer/components/settings/HabitSettings'
import MoodSettings from '@renderer/components/settings/MoodSettings'
import ProfileSettings from '@renderer/components/settings/ProfileSettings'
import { useState } from 'react'

interface Props {
  onLock: () => void
}

const SECTIONS = ['Profile', 'Appearance', 'Habits', 'Moods', 'AI', 'Backup']
type Section = (typeof SECTIONS)[number]

function Settings({ onLock }: Props): React.JSX.Element {
  const [section, setSection] = useState<Section>('Profile')

  return (
    <div className="grid grid-cols-2 px-1">
      <div className="grid grid-cols-1 place-items-start">
        {SECTIONS.map((sectionName) => (
          <button key={sectionName} onClick={() => setSection(sectionName)}>
            <h1>{sectionName}</h1>
          </button>
        ))}
      </div>
      <div>
        <h1>{section}</h1>
        <div>
          {section === 'Profile' && <ProfileSettings />}
          {section === 'Appearance' && <AppearanceSettings />}
          {section === 'Habits' && <HabitSettings />}
          {section === 'Moods' && <MoodSettings />}
          {section === 'AI' && <AISettings />}
          {section === 'Backup' && <BackupSettings onLockRequired={onLock} />}
        </div>
      </div>
    </div>
  )
}
export default Settings
