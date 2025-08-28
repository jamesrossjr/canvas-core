import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import { migrate } from 'drizzle-orm/better-sqlite3/migrator'
import * as schema from './schema'
import path from 'path'

// Database file path
const dbPath = path.resolve(process.cwd(), 'database', 'sqlite.db')

// Create better-sqlite3 database instance
const sqlite = new Database(dbPath)

// Enable WAL mode for better performance
sqlite.pragma('journal_mode = WAL')
sqlite.pragma('synchronous = NORMAL')
sqlite.pragma('cache_size = 1000000')
sqlite.pragma('foreign_keys = ON')
sqlite.pragma('temp_store = MEMORY')

// Create drizzle instance
export const db = drizzle(sqlite, {
  schema,
  logger: process.env.NODE_ENV === 'development'
})

// Run migrations on startup
export async function initDatabase() {
  try {
    console.log('🔄 Running database migrations...')

    const migrationsPath = path.resolve(process.cwd(), 'database', 'migrations')
    migrate(db, { migrationsFolder: migrationsPath })

    console.log('✅ Database migrations completed')
  } catch (error) {
    console.error('❌ Database migration failed:', error)
    throw error
  }
}

// Graceful shutdown
export function closeDatabase() {
  try {
    sqlite.close()
    console.log('✅ Database connection closed')
  } catch (error) {
    console.error('❌ Error closing database:', error)
  }
}

// Handle process termination
process.on('SIGINT', closeDatabase)
process.on('SIGTERM', closeDatabase)
process.on('exit', closeDatabase)

export type DB = typeof db

// Re-export schema types
export * from './schema'
