import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  dialect: 'sqlite',
  schema: './src/main/db/schemas/schema.ts',
  out: './drizzle',
  dbCredentials: {
    url: './dev.db'
  }
})
