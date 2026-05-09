import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ProfileSettings from './ProfileSettings'

beforeEach(() => {
  window.api = {
    user: {
      getUsername: vi.fn().mockResolvedValue('Alice'),
      setUsername: vi.fn().mockResolvedValue(undefined)
    }
  } as never
})

describe('ProfileSettings', () => {
  it('fetches the username on mount', async () => {
    render(<ProfileSettings />)

    await waitFor(() => {
      expect(window.api.user.getUsername).toHaveBeenCalled()
    })
  })

  it('renders the fetched username in the input', async () => {
    render(<ProfileSettings />)

    expect(await screen.findByDisplayValue('Alice')).toBeInTheDocument()
  })

  it('calls setUsername on blur with the trimmed value when changed', async () => {
    render(<ProfileSettings />)

    const input = await screen.findByDisplayValue('Alice')
    await userEvent.tripleClick(input)
    await userEvent.keyboard('  Bob  ')
    await userEvent.tab()

    expect(window.api.user.setUsername).toHaveBeenCalledWith('Bob')
  })

  it('does not call setUsername when the new value is empty or whitespace', async () => {
    render(<ProfileSettings />)

    const input = await screen.findByDisplayValue('Alice')
    await userEvent.tripleClick(input)
    await userEvent.keyboard('   ')
    await userEvent.tab()

    expect(window.api.user.setUsername).not.toHaveBeenCalled()
  })
})
