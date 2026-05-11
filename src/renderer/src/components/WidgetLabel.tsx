interface Props {
  children: React.ReactNode
}

export default function WidgetLabel({ children }: Props): React.JSX.Element {
  return (
    <div className="mb-2">
      <h2 className="font-serif text-ink text-xs uppercase tracking-[0.18em] font-semibold">
        {children}
      </h2>
      <div className="h-px bg-ink/15 mt-1" />
    </div>
  )
}
