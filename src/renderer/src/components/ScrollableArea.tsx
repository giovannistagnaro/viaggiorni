import { ChevronDown, ChevronUp } from 'lucide-react'
import { CSSProperties, ReactNode, useEffect, useRef, useState } from 'react'

interface Props {
  children: ReactNode
  className?: string
  style?: CSSProperties
  /**
   * Optional decoration rendered behind the scrolling content (z-index below).
   * Stays fixed inside the area — doesn't scroll with content.
   */
  backgroundDecoration?: ReactNode
}

/**
 * A scrollable container with subtle chevron indicators at the top and bottom
 * that fade in only when there's content scrolled above/below the visible
 * area. Both hide when the user reaches the respective edge.
 */
export default function ScrollableArea({
  children,
  className,
  style,
  backgroundDecoration
}: Props): React.JSX.Element {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [canScrollUp, setCanScrollUp] = useState(false)
  const [canScrollDown, setCanScrollDown] = useState(false)

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return

    function check(): void {
      if (!el) return
      const { scrollTop, clientHeight, scrollHeight } = el
      // 4px buffer to avoid flickering at the exact edges
      setCanScrollUp(scrollTop > 4)
      setCanScrollDown(scrollTop + clientHeight < scrollHeight - 4)
    }

    check()
    el.addEventListener('scroll', check)
    const ro = new ResizeObserver(check)
    ro.observe(el)
    for (const child of Array.from(el.children)) ro.observe(child)
    return () => {
      el.removeEventListener('scroll', check)
      ro.disconnect()
    }
  }, [])

  return (
    <div className={`relative ${className ?? ''}`} style={style}>
      {backgroundDecoration && (
        <div className="absolute inset-0 pointer-events-none z-0">{backgroundDecoration}</div>
      )}
      <div ref={scrollRef} className="absolute inset-0 z-10 overflow-auto no-scrollbar">
        {children}
      </div>
      <div
        aria-hidden
        className={`absolute top-1 left-0 right-0 flex justify-center pointer-events-none transition-opacity duration-300 ${
          canScrollUp ? 'opacity-60' : 'opacity-0'
        }`}
      >
        <ChevronUp className="w-4 h-4 text-ink animate-pulse" strokeWidth={1.5} />
      </div>
      <div
        aria-hidden
        className={`absolute bottom-1 left-0 right-0 flex justify-center pointer-events-none transition-opacity duration-300 ${
          canScrollDown ? 'opacity-60' : 'opacity-0'
        }`}
      >
        <ChevronDown className="w-4 h-4 text-ink animate-pulse" strokeWidth={1.5} />
      </div>
    </div>
  )
}
