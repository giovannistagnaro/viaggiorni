import { ipcMain } from 'electron'
import { isOllamaAvailable, listOllamaModels } from '../ollamaService'
import log from 'electron-log'

export function registerOllamaIpc(): void {
  ipcMain.handle('ollama:listOllamaModels', async () => {
    try {
      return await listOllamaModels()
    } catch (err) {
      log.error('Could not list Ollama models', { error: err })
      throw err
    }
  })

  ipcMain.handle('ollama:isOllamaAvailable', async () => {
    try {
      return await isOllamaAvailable()
    } catch (err) {
      log.error('Could not check Ollama availability', { error: err })
      throw err
    }
  })
}
