import coverUrl from '@renderer/assets/textures/COVER.png'
import woodUrl from '@renderer/assets/textures/WOOD.png'
import { Button } from '@renderer/components/ui/button'

interface Props {
  onNavigate: (screen: 'index' | 'day') => void
  onNavigateToToday: () => void
}

function Cover({ onNavigate, onNavigateToToday }: Props): React.JSX.Element {
  const year = new Date().getFullYear()

  return (
    <div
      className="relative h-full w-full grid place-items-center overflow-hidden"
      style={{
        backgroundColor: 'hsl(28, 35%, 12%)',
        backgroundImage: `url(${woodUrl})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      }}
    >
      <div className="relative" style={{ height: 'min(85vh, 760px)' }}>
        <img
          src={coverUrl}
          alt=""
          aria-hidden
          draggable={false}
          className="h-full w-auto block select-none pointer-events-none"
          style={{ filter: 'drop-shadow(0 28px 50px rgba(0,0,0,0.6))' }}
        />

        <div
          className="absolute left-0 right-0 flex flex-col items-center"
          style={{ top: '14%' }}
        >
          <h1
            className="font-serif text-mustard text-5xl font-semibold tracking-wide"
            style={{
              textShadow:
                '0 1px 0 rgba(255,255,255,0.08), 0 -1px 0 rgba(0,0,0,0.55), 0 0 18px rgba(0,0,0,0.35)'
            }}
          >
            Viaggiorni
          </h1>
          <p
            className="mt-2 font-serif text-mustard/80 text-lg tracking-[0.4em] uppercase"
            style={{ textShadow: '0 -1px 0 rgba(0,0,0,0.55)' }}
          >
            {year}
          </p>
          <div className="mt-8 flex items-center gap-3">
            <Button
              onClick={onNavigateToToday}
              className="bg-mustard/90 text-leather hover:bg-mustard font-serif tracking-wide shadow-[0_2px_6px_rgba(0,0,0,0.5)]"
            >
              Today
            </Button>
            <Button
              onClick={() => onNavigate('index')}
              className="bg-mustard/90 text-leather hover:bg-mustard font-serif tracking-wide shadow-[0_2px_6px_rgba(0,0,0,0.5)]"
            >
              Open journal
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Cover
