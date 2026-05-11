import { Check, FilePen, Lock, Settings } from 'lucide-react'
import { formatSavedAgo, useNowTick, useSaveStatus } from '@renderer/utils/saveStatus'

interface Props {
  children: React.ReactNode
  onLock: () => void
  onNavigateToSettings: () => void
  onNavigateToTemplate: () => void
}

function Topbar({
  children,
  onLock,
  onNavigateToSettings,
  onNavigateToTemplate
}: Props): React.JSX.Element {
  const { lastSavedAt } = useSaveStatus()
  const now = useNowTick(30_000)
  const savedLabel = formatSavedAgo(lastSavedAt, now)

  return (
    <header
      className="text-paper font-serif border-b border-black/40 shadow-[0_2px_8px_rgba(0,0,0,0.4)]"
      style={{
        backgroundColor:
          'hsl(28, 30%, 8%)' /* OPTION 1: near-black warm brown. Swap to 'hsl(30, 8%, 12%)' for OPTION 4 cool slate. */
      }}
    >
      <div className="flex items-center justify-between px-6 py-2">
        <div className="flex items-center gap-2 text-sm">{children}</div>

        <div className="flex items-center gap-4">
          {savedLabel && (
            <div className="flex items-center gap-1.5 text-paper/70 text-sm">
              <Check className="w-4 h-4" strokeWidth={2} />
              <span>{savedLabel}</span>
            </div>
          )}

          {savedLabel && <div className="h-5 w-px bg-paper/15" />}

          <IconBtn onClick={onNavigateToTemplate} title="Template editor">
            <FilePen className="w-4 h-4" />
          </IconBtn>
          <IconBtn onClick={onNavigateToSettings} title="Settings">
            <Settings className="w-4 h-4" />
          </IconBtn>
          <IconBtn onClick={onLock} title="Lock app">
            <Lock className="w-4 h-4" />
          </IconBtn>
        </div>
      </div>
    </header>
  )
}

interface IconBtnProps {
  onClick: () => void
  title: string
  disabled?: boolean
  children: React.ReactNode
}

function IconBtn({ onClick, title, disabled, children }: IconBtnProps): React.JSX.Element {
  return (
    <button
      onClick={onClick}
      aria-label={title}
      title={title}
      disabled={disabled}
      className="p-1.5 rounded text-paper/70 hover:text-paper hover:bg-paper/10 disabled:opacity-30 disabled:hover:bg-transparent disabled:cursor-not-allowed transition-colors"
    >
      {children}
    </button>
  )
}

export default Topbar
