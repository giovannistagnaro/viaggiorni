import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Breadcrumb from './Breadcrumb'

const ENTRY_DATE = '2026-05-07'

describe('Breadcrumb', () => {
  describe('on the cover screen', () => {
    it('renders Cover as plain text, not a button', () => {
      render(<Breadcrumb currentScreen="cover" onNavigate={vi.fn()} />)

      expect(screen.queryByRole('button', { name: 'Cover' })).not.toBeInTheDocument()
      expect(screen.getByText('Cover')).toBeInTheDocument()
    })

    it('does not render the Index segment', () => {
      render(<Breadcrumb currentScreen="cover" onNavigate={vi.fn()} />)

      expect(screen.queryByText('Index')).not.toBeInTheDocument()
    })

    it('does not render an entry date', () => {
      render(
        <Breadcrumb currentScreen="cover" entryDate={ENTRY_DATE} onNavigate={vi.fn()} />
      )

      expect(screen.queryByText(ENTRY_DATE)).not.toBeInTheDocument()
    })
  })

  describe('on the index screen', () => {
    it('renders Cover as a clickable button', () => {
      render(<Breadcrumb currentScreen="index" onNavigate={vi.fn()} />)

      expect(screen.getByRole('button', { name: 'Cover' })).toBeInTheDocument()
    })

    it('renders Index as plain text, not a button', () => {
      render(<Breadcrumb currentScreen="index" onNavigate={vi.fn()} />)

      expect(screen.queryByRole('button', { name: 'Index' })).not.toBeInTheDocument()
      expect(screen.getByText('Index')).toBeInTheDocument()
    })

    it('does not render an entry date', () => {
      render(
        <Breadcrumb currentScreen="index" entryDate={ENTRY_DATE} onNavigate={vi.fn()} />
      )

      expect(screen.queryByText(ENTRY_DATE)).not.toBeInTheDocument()
    })
  })

  describe('on the day screen', () => {
    it('renders Cover and Index as clickable buttons', () => {
      render(
        <Breadcrumb currentScreen="day" entryDate={ENTRY_DATE} onNavigate={vi.fn()} />
      )

      expect(screen.getByRole('button', { name: 'Cover' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Index' })).toBeInTheDocument()
    })

    it('renders the entry date as plain text, not a button', () => {
      render(
        <Breadcrumb currentScreen="day" entryDate={ENTRY_DATE} onNavigate={vi.fn()} />
      )

      expect(screen.queryByRole('button', { name: ENTRY_DATE })).not.toBeInTheDocument()
      expect(screen.getByText(ENTRY_DATE)).toBeInTheDocument()
    })

    it('omits the entry date when entryDate is undefined', () => {
      render(<Breadcrumb currentScreen="day" onNavigate={vi.fn()} />)

      // Cover and Index still render, but no third segment
      expect(screen.getByRole('button', { name: 'Cover' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Index' })).toBeInTheDocument()
    })
  })

  describe('navigation', () => {
    it('calls onNavigate with "cover" when Cover is clicked', async () => {
      const onNavigate = vi.fn()
      render(<Breadcrumb currentScreen="day" entryDate={ENTRY_DATE} onNavigate={onNavigate} />)

      await userEvent.click(screen.getByRole('button', { name: 'Cover' }))

      expect(onNavigate).toHaveBeenCalledWith('cover')
    })

    it('calls onNavigate with "index" when Index is clicked', async () => {
      const onNavigate = vi.fn()
      render(<Breadcrumb currentScreen="day" entryDate={ENTRY_DATE} onNavigate={onNavigate} />)

      await userEvent.click(screen.getByRole('button', { name: 'Index' }))

      expect(onNavigate).toHaveBeenCalledWith('index')
    })

    it('does not fire onNavigate when there are no buttons (cover screen)', async () => {
      const onNavigate = vi.fn()
      render(<Breadcrumb currentScreen="cover" onNavigate={onNavigate} />)

      // Cover is plain text, so clicking it does nothing
      await userEvent.click(screen.getByText('Cover'))

      expect(onNavigate).not.toHaveBeenCalled()
    })
  })

  describe('semantics', () => {
    it('wraps segments in a nav element with an accessible label', () => {
      render(
        <Breadcrumb currentScreen="day" entryDate={ENTRY_DATE} onNavigate={vi.fn()} />
      )

      expect(screen.getByRole('navigation', { name: /Breadcrumb/i })).toBeInTheDocument()
    })
  })
})
