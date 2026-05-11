import { pickByDate } from '@renderer/utils/pickByDate'
import Stencil from './Stencil'

const TORN_PAPERS = Object.values(
  import.meta.glob('@renderer/assets/torn_paper/cream/*.png', {
    eager: true,
    import: 'default',
    query: '?url'
  })
) as string[]

const WASHI_TAPES = Object.values(
  import.meta.glob('@renderer/assets/washi_tape/*.png', {
    eager: true,
    import: 'default',
    query: '?url'
  })
) as string[]

const SMALL_STENCILS = Object.values(
  import.meta.glob('@renderer/assets/stencils/small/*.png', {
    eager: true,
    import: 'default',
    query: '?url'
  })
) as string[]

interface Props {
  title: string
  entryDate: string
  onTitleBlur: (next: string) => void
}

export default function EntryHeader({
  title,
  entryDate,
  onTitleBlur
}: Props): React.JSX.Element {
  const tornPaperUrl = pickByDate(entryDate, 'header-paper', TORN_PAPERS)
  const washiTapeUrl = pickByDate(entryDate, 'header-tape', WASHI_TAPES)
  const stencilUrl = pickByDate(entryDate, 'header-stencil', SMALL_STENCILS)

  return (
    <div className="relative inline-block mt-4" style={{ transform: 'rotate(-0.6deg)' }}>
      <img
        src={washiTapeUrl}
        alt=""
        aria-hidden
        draggable={false}
        className="absolute -top-2 left-1/2 z-10 pointer-events-none select-none"
        style={{
          width: '28%',
          transform: 'translate(-50%, 0) rotate(-3deg)',
          filter: 'drop-shadow(0 2px 2px rgba(0,0,0,0.22))'
        }}
      />

      <div
        className="relative px-8 pt-10 pb-6 min-w-[280px]"
        style={{
          backgroundImage: `url(${tornPaperUrl})`,
          backgroundSize: '100% 100%',
          backgroundRepeat: 'no-repeat',
          filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.18))'
        }}
      >
        <div className="flex items-center gap-3">
          <input
            key={entryDate}
            type="text"
            defaultValue={title}
            onBlur={(e) => onTitleBlur(e.target.value)}
            placeholder="Enter entry title…"
            className="font-serif text-ink text-2xl font-semibold bg-transparent border-none outline-none focus:outline-1 focus:outline-ink/30 focus:outline-dashed focus:outline-offset-2 rounded px-0.5 flex-1 min-w-0"
            style={{ textShadow: '0 1px 0 rgba(0,0,0,0.04), 0 0 1px rgba(0,0,0,0.06)' }}
          />
          <Stencil
            src={stencilUrl}
            color="var(--color-sepia)"
            className="flex-none"
            style={{
              width: '48px',
              height: '48px',
              transform: 'rotate(8deg)'
            }}
          />
        </div>
      </div>
    </div>
  )
}
