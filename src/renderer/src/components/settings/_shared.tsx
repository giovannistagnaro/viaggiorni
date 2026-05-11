import { ReactNode } from 'react'

export const SETTINGS_INPUT =
  'w-full px-3 py-2 rounded-md border border-input bg-background text-foreground text-sm font-serif focus:outline-none focus:ring-2 focus:ring-ring/40 focus:border-ring placeholder:text-muted-foreground/60 placeholder:italic'

export const SETTINGS_SELECT = SETTINGS_INPUT + ' appearance-none pr-8 cursor-pointer'

interface RowProps {
  label: string
  description?: string
  htmlFor?: string
  children: ReactNode
}

export function Row({ label, description, htmlFor, children }: RowProps): React.JSX.Element {
  return (
    <div className="flex items-start gap-6 py-4 border-b border-border/50 last:border-b-0">
      <div className="w-40 flex-none pt-1.5">
        <label
          htmlFor={htmlFor}
          className="font-serif text-foreground text-sm font-medium block cursor-default"
        >
          {label}
        </label>
        {description && (
          <p className="font-serif text-muted-foreground text-xs mt-1 leading-snug">
            {description}
          </p>
        )}
      </div>
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  )
}

interface SubsectionProps {
  title: string
  children: ReactNode
}

export function Subsection({ title, children }: SubsectionProps): React.JSX.Element {
  return (
    <section className="mt-8">
      <h2 className="font-serif text-foreground text-sm uppercase tracking-[0.18em] font-semibold mb-2">
        {title}
      </h2>
      <div className="h-px bg-border mb-4" />
      {children}
    </section>
  )
}
