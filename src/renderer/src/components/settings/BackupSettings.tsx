import { toast } from 'sonner'

interface Props {
  onLockRequired: () => void
}

function BackupSettings({ onLockRequired }: Props): React.JSX.Element {
  async function handleImport(): Promise<void> {
    try {
      const result = await window.api.backup.importBackup()
      if (result.success) {
        toast.success('Import successful')
        onLockRequired()
      } else if (result.reason !== 'cancelled') {
        toast.error('Failed to import backup')
      }
    } catch (err) {
      console.error('Failed to import backup', err)
      toast.error('Failed to import backup')
    }
  }

  async function handleExport(): Promise<void> {
    try {
      const result = await window.api.backup.exportBackup()
      if (result.success) {
        toast.success('Export successful')
      } else if (result.reason !== 'cancelled') {
        toast.error('Failed to export backup')
      }
    } catch (err) {
      console.error('Failed to export backup', err)
      toast.error('Failed to export backup')
    }
  }

  return (
    <div>
      <div>
        <button onClick={handleImport}>Import a backup</button>
      </div>
      <div>
        <button onClick={handleExport}>Export a backup</button>
      </div>
    </div>
  )
}

export default BackupSettings
