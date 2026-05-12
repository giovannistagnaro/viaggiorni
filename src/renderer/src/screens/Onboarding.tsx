import { useState } from 'react'
import { toast } from 'sonner'
import { Eye, EyeOff, ShieldAlert } from 'lucide-react'
import { Button } from '@renderer/components/ui/button'
import Stencil from '@renderer/components/Stencil'
import paperUrl from '@renderer/assets/textures/PAPER.png'
import {
  ERROR_MESSAGE_PASSWORD_MISMATCH,
  ERROR_MESSAGE_PASSWORD_TOO_LONG,
  ERROR_MESSAGE_PASSWORD_TOO_SHORT,
  ERROR_MESSAGE_USERNAME_TOO_LONG,
  ERROR_MESSAGE_USERNAME_TOO_SHORT,
  MAX_PASSWORD_LENGTH,
  MAX_USERNAME_LENGTH,
  MIN_PASSWORD_LENGTH,
  MIN_USERNAME_LENGTH,
  PASSWORD_RECOVERY_WARNING_TEXT,
  PASSWORD_SCREEN_CONFIRMATION_PLACEHOLDER_TEXT,
  PASSWORD_SCREEN_HEADER_TEXT,
  ENTER_YOUR_PASSWORD_PLACEHOLDER_TEXT,
  PASSWORD_SUBMIT_BUTTON_TEXT,
  USERNAME_SUBMIT_BUTTON_TEXT,
  WELCOME_SCREEN_HEADER_TEXT,
  WELCOME_SCREEN_PLACEHOLDER_TEXT
} from './screenConstants'

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
  onComplete: () => void
}

type Step = 'welcome' | 'password'

function Onboarding({ onComplete }: Props): React.JSX.Element {
  const [step, setStep] = useState<Step>('welcome')
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const [topLeftStamp] = useState<string>(
    () => PASSPORT_STAMPS[Math.floor(Math.random() * PASSPORT_STAMPS.length)]
  )
  const [bottomRightStencil] = useState<string>(
    () => LARGE_STENCILS[Math.floor(Math.random() * LARGE_STENCILS.length)]
  )
  const [crestStencil] = useState<string>(
    () => SMALL_STENCILS[Math.floor(Math.random() * SMALL_STENCILS.length)]
  )

  function handleNameSubmit(event: React.SyntheticEvent): void {
    event.preventDefault()

    if (name.length < MIN_USERNAME_LENGTH) {
      setError(ERROR_MESSAGE_USERNAME_TOO_SHORT)
    } else if (name.length > MAX_USERNAME_LENGTH) {
      setError(ERROR_MESSAGE_USERNAME_TOO_LONG)
    } else {
      setError(null)
      setStep('password')
    }
  }

  async function handlePasswordSubmit(event: React.SyntheticEvent): Promise<void> {
    event.preventDefault()
    setSubmitting(true)

    if (password.length < MIN_PASSWORD_LENGTH) {
      setError(ERROR_MESSAGE_PASSWORD_TOO_SHORT)
    } else if (password.length > MAX_PASSWORD_LENGTH) {
      setError(ERROR_MESSAGE_PASSWORD_TOO_LONG)
    } else if (password !== confirmPassword) {
      setError(ERROR_MESSAGE_PASSWORD_MISMATCH)
    } else {
      try {
        const openDbResult = await window.api.db.open(password)
        if (openDbResult.success) {
          await window.api.user.setUsername(name)
          onComplete()
        } else {
          setError(openDbResult.error)
        }
      } catch (err) {
        console.error('Failed to complete onboarding', err)
        toast.error('Failed to complete onboarding')
        setError('Something went wrong. Please try again.')
      }
    }
    setSubmitting(false)
  }

  const stepLabel = step === 'welcome' ? 'Step 1 of 2' : 'Step 2 of 2'

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
        <div
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
            <span className="mt-3 text-[10px] uppercase tracking-[0.22em] font-semibold text-ink-soft">
              {stepLabel}
            </span>
            <h1 className="mt-1 text-3xl font-semibold text-ink text-center">
              {step === 'welcome' ? WELCOME_SCREEN_HEADER_TEXT : PASSWORD_SCREEN_HEADER_TEXT}
            </h1>
            <p className="mt-1 text-ink-soft text-sm text-center">
              {step === 'welcome'
                ? 'Let’s set up your journal.'
                : 'This is the only key to your journal.'}
            </p>
          </div>

          {step === 'welcome' && (
            <form onSubmit={handleNameSubmit}>
              <label
                htmlFor="onboarding-name"
                className="block text-[11px] uppercase tracking-[0.18em] font-semibold text-ink-soft mb-1.5"
              >
                Username
              </label>
              <input
                id="onboarding-name"
                type="text"
                value={name}
                onChange={(e) => {
                  setError(null)
                  setName(e.target.value)
                }}
                placeholder={WELCOME_SCREEN_PLACEHOLDER_TEXT}
                autoFocus
                disabled={submitting}
                className="w-full px-3 py-2.5 rounded-md border border-ink/20 bg-paper text-ink text-sm focus:outline-none focus:ring-2 focus:ring-ink/20 focus:border-ink/40 placeholder:text-ink-soft/60 placeholder:italic disabled:opacity-50"
              />

              {error && <p className="mt-2 text-sm text-rust">{error}</p>}

              <Button
                type="submit"
                disabled={submitting || !name}
                className="mt-4 w-full bg-ink text-paper hover:bg-ink/90 shadow-[0_2px_6px_rgba(40,28,15,0.25)]"
              >
                {USERNAME_SUBMIT_BUTTON_TEXT(submitting)}
              </Button>
            </form>
          )}

          {step === 'password' && (
            <form onSubmit={handlePasswordSubmit}>
              <label
                htmlFor="onboarding-password"
                className="block text-[11px] uppercase tracking-[0.18em] font-semibold text-ink-soft mb-1.5"
              >
                Password
              </label>
              <div className="relative">
                <input
                  id="onboarding-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setError(null)
                    setPassword(e.target.value)
                  }}
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

              <label
                htmlFor="onboarding-confirm"
                className="mt-3 block text-[11px] uppercase tracking-[0.18em] font-semibold text-ink-soft mb-1.5"
              >
                Confirm password
              </label>
              <div className="relative">
                <input
                  id="onboarding-confirm"
                  type={showConfirm ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => {
                    setError(null)
                    setConfirmPassword(e.target.value)
                  }}
                  placeholder={PASSWORD_SCREEN_CONFIRMATION_PLACEHOLDER_TEXT}
                  disabled={submitting}
                  className="w-full px-3 py-2.5 pr-10 rounded-md border border-ink/20 bg-paper text-ink text-sm focus:outline-none focus:ring-2 focus:ring-ink/20 focus:border-ink/40 placeholder:text-ink-soft/60 placeholder:italic disabled:opacity-50"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm((v) => !v)}
                  aria-label={showConfirm ? 'Hide password' : 'Show password'}
                  tabIndex={-1}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-ink-soft hover:text-ink rounded"
                >
                  {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              <div className="mt-4 flex items-start gap-2 rounded-md bg-rust/10 border border-rust/30 px-3 py-2 text-xs text-ink-soft">
                <ShieldAlert className="w-4 h-4 flex-none mt-0.5 text-rust" aria-hidden />
                <span>{PASSWORD_RECOVERY_WARNING_TEXT}</span>
              </div>

              {error && <p className="mt-2 text-sm text-rust">{error}</p>}

              <Button
                type="submit"
                disabled={submitting || !password || !confirmPassword}
                className="mt-4 w-full bg-ink text-paper hover:bg-ink/90 shadow-[0_2px_6px_rgba(40,28,15,0.25)]"
              >
                {PASSWORD_SUBMIT_BUTTON_TEXT(submitting)}
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}

export default Onboarding
