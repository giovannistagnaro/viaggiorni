import { Check, FilePen, Lock, Pencil, Settings } from 'lucide-react'
import { formatSavedAgo, useNowTick, useSaveStatus } from '@renderer/utils/saveStatus'

interface Props {
  children: React.ReactNode
  onLock: () => void
  onNavigateToSettings: () => void
  onNavigateToTemplate: () => void
  /** When provided, render an edit-layout toggle in the icon row. Used by Day. */
  onToggleDayEdit?: () => void
  isDayEditMode?: boolean
}

function Topbar({
  children,
  onLock,
  onNavigateToSettings,
  onNavigateToTemplate,
  onToggleDayEdit,
  isDayEditMode
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

          {onToggleDayEdit && (
            <IconBtn
              onClick={onToggleDayEdit}
              title={isDayEditMode ? 'Done editing layout' : 'Edit page layout'}
              active={isDayEditMode}
            >
              <Pencil className="w-4 h-4" />
            </IconBtn>
          )}
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
  active?: boolean
  children: React.ReactNode
}

function IconBtn({ onClick, title, disabled, active, children }: IconBtnProps): React.JSX.Element {
  return (
    <button
      onClick={onClick}
      aria-label={title}
      title={title}
      disabled={disabled}
      aria-pressed={active}
      className={`p-1.5 rounded transition-colors disabled:opacity-30 disabled:hover:bg-transparent disabled:cursor-not-allowed ${
        active ? 'bg-paper/15 text-paper' : 'text-paper/70 hover:text-paper hover:bg-paper/10'
      }`}
    >
      {children}
    </button>
  )
}

export default Topbar
