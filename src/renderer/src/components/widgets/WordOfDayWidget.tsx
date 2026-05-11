import { WordOfDay } from '@shared/types'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { pickByDate } from '@renderer/utils/pickByDate'
import Stencil from '@renderer/components/Stencil'

const BLUE_TORN_PAPERS = Object.values(
  import.meta.glob('@renderer/assets/torn_paper/blue/*.png', {
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

const MEDIUM_STENCILS = Object.values(
  import.meta.glob('@renderer/assets/stencils/medium/*.png', {
    eager: true,
    import: 'default',
    query: '?url'
  })
) as string[]

interface Props {
  entryDate: string
}

function WordOfDayWidget({ entryDate }: Props): React.JSX.Element {
  const [word, setWord] = useState<WordOfDay | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)

  useEffect(() => {
    async function getWordOfDay(): Promise<void> {
      try {
        setWord(await window.api.wordOfDay.getOrCreateForDate(entryDate))
      } catch (err) {
        console.error('Failed to load word of day', err)
        toast.error('Failed to load word of day')
      } finally {
        setIsLoading(false)
      }
    }
    getWordOfDay()
  }, [entryDate])

  if (isLoading) {
    return <div className="font-serif text-ink-soft text-sm italic">Loading…</div>
  }
  if (word === null) {
    return <div className="font-serif text-ink-soft text-sm italic">No word available today.</div>
  }

  const paperUrl = pickByDate(entryDate, 'wod-paper', BLUE_TORN_PAPERS)
  const washiUrl = pickByDate(entryDate, 'wod-tape', WASHI_TAPES)
  const stencilUrl = pickByDate(entryDate, 'wod-stencil', MEDIUM_STENCILS)

  return (
    <div className="relative inline-block" style={{ transform: 'rotate(0.4deg)' }}>
      <img
        src={washiUrl}
        alt=""
        aria-hidden
        draggable={false}
        className="absolute -top-2 left-6 z-10 pointer-events-none select-none"
        style={{
          width: '28%',
          transform: 'rotate(-4deg)',
          filter: 'drop-shadow(0 2px 2px rgba(0,0,0,0.22))'
        }}
      />

      <div
        className="relative px-6 pt-7 pb-5 pr-28 min-w-[280px]"
        style={{
          backgroundImage: `url(${paperUrl})`,
          backgroundSize: '100% 100%',
          backgroundRepeat: 'no-repeat',
          filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.18))'
        }}
      >
        {/* Stencil inside the card so it can't overflow */}
        <Stencil
          src={stencilUrl}
          color="var(--color-ink)"
          className="absolute pointer-events-none"
          style={{
            width: '84px',
            height: '92px',
            right: '8px',
            bottom: '8px',
            transform: 'rotate(6deg)'
          }}
        />
        <h3 className="font-serif text-ink text-xl font-semibold leading-tight">{word.word}</h3>
        <p className="font-serif text-ink-soft text-sm mt-1">{word.definition}</p>
        <p className="font-serif text-ink text-sm italic mt-2 leading-snug">{word.example}</p>
      </div>
    </div>
  )
}

export default WordOfDayWidget
