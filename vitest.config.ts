import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  test: {
    projects: [
      {
        test: {
          name: 'main',
          environment: 'node',
          include: ['src/main/**/*.test.ts', 'src/preload/**/*.test.ts']
        },
        resolve: {
          alias: {
            '@shared': resolve(__dirname, 'src/shared')
          }
        }
      },
      {
        plugins: [react()],
        test: {
          name: 'renderer',
          environment: 'jsdom',
          include: ['src/renderer/**/*.test.{ts,tsx}'],
          setupFiles: ['./vitest.setup.ts'],
          globals: true
        },
        resolve: {
          alias: {
            '@renderer': resolve(__dirname, 'src/renderer/src'),
            '@': resolve(__dirname, 'src/renderer/src'),
            '@shared': resolve(__dirname, 'src/shared')
          }
        }
      }
    ]
  }
})
