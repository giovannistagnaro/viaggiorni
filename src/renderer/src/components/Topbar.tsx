import { PostLoginScreen } from '@renderer/types'
import BreadCrumb from './Breadcrumb'

interface Props {
  currentScreen: PostLoginScreen
  entryDate?: string
  onNavigate: (screen: 'cover' | 'index') => void
  onLock: () => void
}

function Topbar({ currentScreen, entryDate, onNavigate, onLock }: Props): React.JSX.Element {
  return (
    <header className="flex w-full justify-between px-1">
      <BreadCrumb currentScreen={currentScreen} entryDate={entryDate} onNavigate={onNavigate} />
      <button onClick={onLock} aria-label="Lock app">
        Lock
      </button>
    </header>
  )
}

export default Topbar
