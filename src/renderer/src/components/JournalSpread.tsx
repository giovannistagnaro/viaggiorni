import journalUrl from '@renderer/assets/textures/JOURNAL.png'
import woodUrl from '@renderer/assets/textures/WOOD.png'
import { useEffect, useRef, useState } from 'react'
import ScrollableArea from './ScrollableArea'

interface Props {
  left: React.ReactNode
  right: React.ReactNode
  leftEdge?: React.ReactNode
  rightEdge?: React.ReactNode
  bookmarkTab?: React.ReactNode
}

const JOURNAL_W = 1484
const JOURNAL_H = 952
const JOURNAL_RATIO = JOURNAL_W / JOURNAL_H

const LEFT_PAGE = { left: '8%', top: '8%', width: '38%', height: '84%' } as const
const RIGHT_PAGE = { left: '54%', top: '8%', width: '38%', height: '84%' } as const

export default function JournalSpread({
  left,
  right,
  leftEdge,
  rightEdge,
  bookmarkTab
}: Props): React.JSX.Element {
  const containerRef = useRef<HTMLDivElement>(null)
  const [size, setSize] = useState<{ w: number; h: number }>({ w: 0, h: 0 })

  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    function recompute(): void {
      if (!el) return
      const { width: pw, height: ph } = el.getBoundingClientRect()
      const widthBound = pw <= ph * JOURNAL_RATIO
      const w = widthBound ? pw : ph * JOURNAL_RATIO
      const h = widthBound ? pw / JOURNAL_RATIO : ph
      setSize({ w, h })
    }
    recompute()
    const ro = new ResizeObserver(recompute)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  return (
    <div
      ref={containerRef}
      className="relative h-full w-full grid place-items-center overflow-hidden"
      style={{
        backgroundColor: 'hsl(28, 35%, 12%)',
        backgroundImage: `url(${woodUrl})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      }}
    >
      {leftEdge && <div className="absolute left-2 top-1/2 -translate-y-1/2 z-30">{leftEdge}</div>}
      {rightEdge && (
        <div className="absolute right-2 top-1/2 -translate-y-1/2 z-30">{rightEdge}</div>
      )}

      <div className="relative" style={{ width: size.w || '100%', height: size.h || '100%' }}>
        {bookmarkTab && (
          <div
            className="absolute z-30"
            style={{ top: 0, right: '8%', width: '3.2%', aspectRatio: '316 / 819' }}
          >
            {bookmarkTab}
          </div>
        )}

        <img
          src={journalUrl}
          className="absolute inset-0 w-full h-full block select-none pointer-events-none z-10"
          style={{ filter: 'drop-shadow(0 24px 40px rgba(0,0,0,0.55))' }}
          alt=""
          aria-hidden
          draggable={false}
        />

        <ScrollableArea className="z-20" style={{ position: 'absolute', ...LEFT_PAGE }}>
          {left}
        </ScrollableArea>

        <ScrollableArea className="z-20" style={{ position: 'absolute', ...RIGHT_PAGE }}>
          {right}
        </ScrollableArea>
      </div>
    </div>
  )
}
