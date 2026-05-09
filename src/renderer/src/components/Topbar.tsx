import { PostLoginScreen } from '@renderer/types'
import BreadCrumb from './Breadcrumb'

interface Props {
  currentScreen: PostLoginScreen
  entryDate?: string
  previousScreen: Exclude<PostLoginScreen, 'settings'>
  onNavigate: (target: PostLoginScreen) => void
  onNavigateToDay: (date: string) => void
  onLock: () => void
}

function Topbar({
  currentScreen,
  entryDate,
  previousScreen,
  onNavigate,
  onNavigateToDay,
  onLock
}: Props): React.JSX.Element {
  return (
    <header className="flex w-full justify-between px-1">
      <BreadCrumb
        currentScreen={currentScreen}
        entryDate={entryDate}
        previousScreen={previousScreen}
        onNavigate={onNavigate}
        onNavigateToDay={onNavigateToDay}
      />
      <button onClick={() => onNavigate('settings')} aria-label="Open settings">
        Settings
      </button>
      <button onClick={onLock} aria-label="Lock app">
        Lock
      </button>
    </header>
  )
}

export default Topbar
