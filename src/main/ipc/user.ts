import { app, ipcMain } from 'electron'
import { existsSync, readFileSync, writeFileSync } from 'fs'
import { join } from 'path'
import { DEFAULT_USERNAME, USERNAME_FILE_NAME } from '../db/dbConstants'

export function registerUserIpc(): void {
  ipcMain.handle('user:getUsername', (): string => {
    let username = DEFAULT_USERNAME
    const usernamePath = join(app.getPath('userData'), USERNAME_FILE_NAME)
    if (existsSync(usernamePath)) {
      username = readFileSync(usernamePath, 'utf-8')
    }
    return username
  })

  ipcMain.handle('user:setUsername', (_event, name: string): void => {
    writeFileSync(join(app.getPath('userData'), USERNAME_FILE_NAME), name)
  })
}
