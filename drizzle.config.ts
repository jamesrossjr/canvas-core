import type { Config } from 'drizzle-kit'

export default {
  schema: './database/schema/*.ts',
  out: './database/migrations',
  dialect: 'sqlite',
  dbCredentials: {
    url: './database/sqlite.db'
  },
  verbose: true,
  strict: true
} satisfies Config
