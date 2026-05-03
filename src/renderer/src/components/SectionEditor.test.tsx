import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import SectionEditor from './SectionEditor'

const baseSection = {
  id: 1,
  label: 'Daily Summary',
  content: null
}

describe('SectionEditor', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders the section label when present', () => {
    render(<SectionEditor section={baseSection} onSave={vi.fn()} />)

    expect(screen.getByRole('heading', { level: 2, name: 'Daily Summary' })).toBeInTheDocument()
  })

  it('does not render a heading when label is null', () => {
    const nullLabelSection = { ...baseSection, label: null }
    render(<SectionEditor section={nullLabelSection} onSave={vi.fn()} />)

    expect(screen.queryByRole('heading', { level: 2 })).not.toBeInTheDocument()
  })

  it('renders the editor', () => {
    const { container } = render(<SectionEditor section={baseSection} onSave={vi.fn()} />)

    expect(container.querySelector('.ProseMirror')).toBeInTheDocument()
  })

  it('initializes the editor with parsed content from section.content', () => {
    const content = JSON.stringify({
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [{ type: 'text', text: 'hello world' }]
        }
      ]
    })
    const sectionWithContent = { ...baseSection, content }

    const { container } = render(<SectionEditor section={sectionWithContent} onSave={vi.fn()} />)

    expect(container.querySelector('.ProseMirror')).toHaveTextContent('hello world')
  })

  it('renders an empty editor when section.content is null', () => {
    render(<SectionEditor section={baseSection} onSave={vi.fn()} />)

    const editor = document.querySelector('.ProseMirror')
    expect(editor?.textContent).toBe('')
  })
})
