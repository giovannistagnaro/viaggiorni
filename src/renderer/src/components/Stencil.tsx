import { CSSProperties } from 'react'

interface Props {
  src: string
  color: string
  className?: string
  style?: CSSProperties
}

export default function Stencil({ src, color, className, style }: Props): React.JSX.Element {
  return (
    <div
      aria-hidden
      className={className}
      style={{
        backgroundColor: color,
        WebkitMaskImage: `url(${src})`,
        maskImage: `url(${src})`,
        WebkitMaskSize: 'contain',
        maskSize: 'contain',
        WebkitMaskRepeat: 'no-repeat',
        maskRepeat: 'no-repeat',
        WebkitMaskPosition: 'center',
        maskPosition: 'center',
        ...style
      }}
    />
  )
}
