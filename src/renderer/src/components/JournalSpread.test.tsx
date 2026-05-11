import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import JournalSpread from './JournalSpread'

describe('JournalSpread', () => {
  it('renders content placed in both page slots', () => {
    render(
      <JournalSpread
        left={<div data-testid="left-content">left side</div>}
        right={<div data-testid="right-content">right side</div>}
      />
    )

    expect(screen.getByTestId('left-content')).toHaveTextContent('left side')
    expect(screen.getByTestId('right-content')).toHaveTextContent('right side')
  })

  it('renders leftEdge and rightEdge when provided', () => {
    render(
      <JournalSpread
        left={<div />}
        right={<div />}
        leftEdge={<button>‹</button>}
        rightEdge={<button>›</button>}
      />
    )

    expect(screen.getByRole('button', { name: '‹' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '›' })).toBeInTheDocument()
  })

  it('omits edges when not provided', () => {
    render(<JournalSpread left={<div />} right={<div />} />)
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })
})
