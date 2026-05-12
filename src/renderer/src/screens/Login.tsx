import { useEffect, useState } from 'react'
import { ENTER_YOUR_PASSWORD_PLACEHOLDER_TEXT } from './screenConstants'
import { toast } from 'sonner'
import { Eye, EyeOff, RotateCcw, ShieldCheck } from 'lucide-react'
import { Button } from '@renderer/components/ui/button'
import Stencil from '@renderer/components/Stencil'
import paperUrl from '@renderer/assets/textures/PAPER.png'

const LARGE_STENCILS = Object.values(
  import.meta.glob('@renderer/assets/stencils/large/*.png', {
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

const PASSPORT_STAMPS = Object.values(
  import.meta.glob('@renderer/assets/stamps/passport_stamps/*.png', {
    eager: true,
    import: 'default',
    query: '?url'
  })
) as string[]

interface Props {
  onSuccess: () => void
}

function Login({ onSuccess }: Props): React.JSX.Element {
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [username, setUsername] = useState<string>('')
  const [showPassword, setShowPassword] = useState(false)
  const [restoring, setRestoring] = useState(false)
  const [topLeftStamp] = useState<string>(
    () => PASSPORT_STAMPS[Math.floor(Math.random() * PASSPORT_STAMPS.length)]
  )

  const [bottomRightStencil] = useState<string>(
    () => LARGE_STENCILS[Math.floor(Math.random() * LARGE_STENCILS.length)]
  )
  const [crestStencil] = useState<string>(
    () => SMALL_STENCILS[Math.floor(Math.random() * SMALL_STENCILS.length)]
  )

  useEffect(() => {
    async function getUsernameWrapper(): Promise<void> {
      try {
        const fetchedUsername = await window.api.user.getUsername()
        setUsername(fetchedUsername ?? '')
      } catch (err) {
        console.error('Failed to fetch username', err)
        toast.error('Failed to fetch username')
      }
    }
    getUsernameWrapper()
  }, [])

  function getGreeting(name: string): string {
    const suffix = name.length > 0 ? `, ${name}` : ''
    const hour = new Date().getHours()
    if (hour >= 5 && hour < 12) {
      return `Good morning${suffix}!`
    } else if (hour >= 12 && hour < 18) {
      return `Good afternoon${suffix}!`
    } else if (hour >= 18 && hour < 22) {
      return `Good evening${suffix}!`
    } else if (hour >= 22 && hour < 24) {
      return `It's getting late${suffix}!`
    } else {
      return `Up at this hour${suffix}?`
    }
  }

  async function handleSubmit(event: React.SyntheticEvent): Promise<void> {
    event.preventDefault()
    setSubmitting(true)
    setError(null)

    const openDbResult = await window.api.db.open(password)
    if (openDbResult.success) {
      onSuccess()
    } else {
      setError(openDbResult.error)
      setSubmitting(false)
    }
  }

  async function handleRestore(): Promise<void> {
    setRestoring(true)
    try {
      const result = await window.api.backup.importBackup()
      if (result.success) {
        toast.success('Backup restored — sign in with your password')
        const fetchedUsername = await window.api.user.getUsername()
        setUsername(fetchedUsername ?? '')
        setPassword('')
        setError(null)
      } else if (result.reason !== 'cancelled') {
        toast.error('Failed to restore backup')
      }
    } catch (err) {
      console.error('Failed to restore backup', err)
      toast.error('Failed to restore backup')
    } finally {
      setRestoring(false)
    }
  }

  return (
    <div
      className="relative min-h-screen w-full overflow-hidden font-serif text-ink"
      style={{
        backgroundColor: 'hsl(38, 35%, 86%)',
        backgroundImage: `url(${paperUrl})`,
        backgroundSize: '600px',
        backgroundRepeat: 'repeat'
      }}
    >
      <span className="absolute top-4 left-6 text-xl tracking-[0.18em] uppercase text-ink/60 select-none">
        Viaggiorni
      </span>

      <img
        src={topLeftStamp}
        alt=""
        aria-hidden
        draggable={false}
        className="absolute pointer-events-none select-none"
        style={{
          top: '88px',
          left: '40px',
          width: '170px',
          opacity: 0.75,
          transform: 'rotate(-10deg)',
          mixBlendMode: 'multiply'
        }}
      />
      <Stencil
        src={bottomRightStencil}
        color="var(--color-sepia)"
        className="absolute bottom-0 right-0 pointer-events-none"
        style={{
          width: '460px',
          height: '460px',
          opacity: 0.4,
          transform: 'rotate(4deg)'
        }}
      />

      <div className="min-h-screen grid place-items-center px-4 py-12 relative z-10">
        <form
          onSubmit={handleSubmit}
          className="w-full max-w-md bg-paper rounded-lg border border-ink/10 p-8"
          style={{
            boxShadow: '0 16px 40px rgba(40, 28, 15, 0.18), 0 4px 12px rgba(40, 28, 15, 0.1)'
          }}
        >
          <div className="flex flex-col items-center mb-5">
            <Stencil
              src={crestStencil}
              color="var(--color-sepia)"
              style={{ width: '64px', height: '64px' }}
            />
            <h1 className="mt-3 text-3xl font-semibold text-ink">{getGreeting(username)}</h1>
            <p className="mt-1 text-ink-soft text-sm">Enter your password to unlock your journal</p>
          </div>

          <label
            htmlFor="login-password"
            className="block text-[11px] uppercase tracking-[0.18em] font-semibold text-ink-soft mb-1.5"
          >
            Password
          </label>
          <div className="relative">
            <input
              id="login-password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={ENTER_YOUR_PASSWORD_PLACEHOLDER_TEXT}
              autoFocus
              disabled={submitting}
              className="w-full px-3 py-2.5 pr-10 rounded-md border border-ink/20 bg-paper text-ink text-sm focus:outline-none focus:ring-2 focus:ring-ink/20 focus:border-ink/40 placeholder:text-ink-soft/60 placeholder:italic disabled:opacity-50"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              tabIndex={-1}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-ink-soft hover:text-ink rounded"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          {error && <p className="mt-2 text-sm text-rust">{error}</p>}

          <Button
            type="submit"
            disabled={submitting || !password}
            className="mt-4 w-full bg-ink text-paper hover:bg-ink/90 shadow-[0_2px_6px_rgba(40,28,15,0.25)]"
          >
            {submitting ? 'Unlocking...' : 'Unlock journal'}
          </Button>

          <div className="mt-5 flex items-start gap-2 rounded-md bg-sepia-soft/15 border border-sepia-soft/30 px-3 py-2 text-xs text-ink-soft">
            <ShieldCheck className="w-4 h-4 flex-none mt-0.5 text-sepia" aria-hidden />
            <span>Your journal is encrypted locally — only you can read it.</span>
          </div>

          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={handleRestore}
              disabled={restoring}
              className="inline-flex items-center gap-1.5 text-xs text-ink-soft hover:text-ink underline decoration-dotted underline-offset-2 disabled:opacity-50"
            >
              <RotateCcw className="w-3 h-3" />
              {restoring ? 'Restoring…' : 'Restore from backup'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default Login
