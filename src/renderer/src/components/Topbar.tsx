interface Props {
  children: React.ReactNode
  onLock: () => void
  onNavigateToSettings: () => void
}

function Topbar({ children, onLock, onNavigateToSettings }: Props): React.JSX.Element {
  return (
    <header className="flex w-full justify-between px-1">
      {children}
      <div className="flex gap-2">
        <button onClick={onNavigateToSettings} aria-label="Settings">
          Settings
        </button>
        <button onClick={onLock} aria-label="Lock app">
          Lock
        </button>
      </div>
    </header>
  )
}

export default Topbar
