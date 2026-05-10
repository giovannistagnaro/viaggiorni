import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import BackupSettings from './BackupSettings'

const toastSuccess = vi.fn()
const toastError = vi.fn()
vi.mock('sonner', () => ({
  toast: {
    success: (...args: unknown[]) => toastSuccess(...args),
    error: (...args: unknown[]) => toastError(...args)
  }
}))

beforeEach(() => {
  toastSuccess.mockReset()
  toastError.mockReset()
  window.api = {
    backup: {
      exportBackup: vi.fn(),
      importBackup: vi.fn()
    }
  } as never
})

describe('BackupSettings', () => {
  it('renders import and export buttons', () => {
    render(<BackupSettings onLockRequired={vi.fn()} />)

    expect(screen.getByRole('button', { name: 'Import a backup' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Export a backup' })).toBeInTheDocument()
  })

  describe('import', () => {
    it('calls window.api.backup.importBackup when the import button is clicked', async () => {
      vi.mocked(window.api.backup.importBackup).mockResolvedValue({ success: true })

      render(<BackupSettings onLockRequired={vi.fn()} />)
      await userEvent.click(screen.getByRole('button', { name: 'Import a backup' }))

      expect(window.api.backup.importBackup).toHaveBeenCalledTimes(1)
    })

    it('on success: shows success toast and triggers onLockRequired', async () => {
      const onLockRequired = vi.fn()
      vi.mocked(window.api.backup.importBackup).mockResolvedValue({ success: true })

      render(<BackupSettings onLockRequired={onLockRequired} />)
      await userEvent.click(screen.getByRole('button', { name: 'Import a backup' }))

      expect(toastSuccess).toHaveBeenCalledWith('Import successful')
      expect(onLockRequired).toHaveBeenCalledTimes(1)
      expect(toastError).not.toHaveBeenCalled()
    })

    it('on cancelled: shows no toast and does not trigger onLockRequired', async () => {
      const onLockRequired = vi.fn()
      vi.mocked(window.api.backup.importBackup).mockResolvedValue({
        success: false,
        reason: 'cancelled'
      })

      render(<BackupSettings onLockRequired={onLockRequired} />)
      await userEvent.click(screen.getByRole('button', { name: 'Import a backup' }))

      expect(toastSuccess).not.toHaveBeenCalled()
      expect(toastError).not.toHaveBeenCalled()
      expect(onLockRequired).not.toHaveBeenCalled()
    })

    it.each([
      'invalid_zip' as const,
      'missing_required' as const,
      'newer_schema' as const,
      'extract_failed' as const
    ])('on %s: shows error toast and does not trigger onLockRequired', async (reason) => {
      const onLockRequired = vi.fn()
      vi.mocked(window.api.backup.importBackup).mockResolvedValue({ success: false, reason })

      render(<BackupSettings onLockRequired={onLockRequired} />)
      await userEvent.click(screen.getByRole('button', { name: 'Import a backup' }))

      expect(toastError).toHaveBeenCalledWith('Failed to import backup')
      expect(onLockRequired).not.toHaveBeenCalled()
      expect(toastSuccess).not.toHaveBeenCalled()
    })

    it('on thrown error: shows error toast and does not trigger onLockRequired', async () => {
      const onLockRequired = vi.fn()
      vi.mocked(window.api.backup.importBackup).mockRejectedValue(new Error('IPC blew up'))

      render(<BackupSettings onLockRequired={onLockRequired} />)
      await userEvent.click(screen.getByRole('button', { name: 'Import a backup' }))

      expect(toastError).toHaveBeenCalledWith('Failed to import backup')
      expect(onLockRequired).not.toHaveBeenCalled()
    })
  })

  describe('export', () => {
    it('calls window.api.backup.exportBackup when the export button is clicked', async () => {
      vi.mocked(window.api.backup.exportBackup).mockResolvedValue({
        success: true,
        path: '/tmp/backup.zip'
      })

      render(<BackupSettings onLockRequired={vi.fn()} />)
      await userEvent.click(screen.getByRole('button', { name: 'Export a backup' }))

      expect(window.api.backup.exportBackup).toHaveBeenCalledTimes(1)
    })

    it('on success: shows success toast', async () => {
      vi.mocked(window.api.backup.exportBackup).mockResolvedValue({
        success: true,
        path: '/tmp/backup.zip'
      })

      render(<BackupSettings onLockRequired={vi.fn()} />)
      await userEvent.click(screen.getByRole('button', { name: 'Export a backup' }))

      expect(toastSuccess).toHaveBeenCalledWith('Export successful')
      expect(toastError).not.toHaveBeenCalled()
    })

    it('on cancelled: shows no toast', async () => {
      vi.mocked(window.api.backup.exportBackup).mockResolvedValue({
        success: false,
        reason: 'cancelled'
      })

      render(<BackupSettings onLockRequired={vi.fn()} />)
      await userEvent.click(screen.getByRole('button', { name: 'Export a backup' }))

      expect(toastSuccess).not.toHaveBeenCalled()
      expect(toastError).not.toHaveBeenCalled()
    })

    it('on write_failed: shows error toast', async () => {
      vi.mocked(window.api.backup.exportBackup).mockResolvedValue({
        success: false,
        reason: 'write_failed'
      })

      render(<BackupSettings onLockRequired={vi.fn()} />)
      await userEvent.click(screen.getByRole('button', { name: 'Export a backup' }))

      expect(toastError).toHaveBeenCalledWith('Failed to export backup')
      expect(toastSuccess).not.toHaveBeenCalled()
    })

    it('on thrown error: shows error toast', async () => {
      vi.mocked(window.api.backup.exportBackup).mockRejectedValue(new Error('IPC blew up'))

      render(<BackupSettings onLockRequired={vi.fn()} />)
      await userEvent.click(screen.getByRole('button', { name: 'Export a backup' }))

      expect(toastError).toHaveBeenCalledWith('Failed to export backup')
    })

    it('does not call onLockRequired on successful export', async () => {
      const onLockRequired = vi.fn()
      vi.mocked(window.api.backup.exportBackup).mockResolvedValue({
        success: true,
        path: '/tmp/backup.zip'
      })

      render(<BackupSettings onLockRequired={onLockRequired} />)
      await userEvent.click(screen.getByRole('button', { name: 'Export a backup' }))

      expect(onLockRequired).not.toHaveBeenCalled()
    })
  })
})
