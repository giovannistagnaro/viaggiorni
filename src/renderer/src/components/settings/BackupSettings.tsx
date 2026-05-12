import { toast } from 'sonner'
import { Button } from '@renderer/components/ui/button'
import { Download, Upload } from 'lucide-react'
import { Row } from './_shared'

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
    <>
      <Row label="Export" description="Save an encrypted snapshot of your journal to a file.">
        <Button variant="outline" onClick={handleExport}>
          <Upload />
          Export a backup
        </Button>
      </Row>
      <Row
        label="Import"
        description="Restore from a backup file. The app will lock so you can sign back in."
      >
        <Button variant="outline" onClick={handleImport}>
          <Download />
          Import a backup
        </Button>
      </Row>
    </>
  )
}

export default BackupSettings
