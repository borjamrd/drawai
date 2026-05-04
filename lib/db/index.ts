import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import * as schema from './schema'
import path from 'path'

const DB_PATH = path.join(process.cwd(), 'drawai.db')

const globalForDb = globalThis as unknown as { _drawaiDb?: ReturnType<typeof drizzle> }

if (!globalForDb._drawaiDb) {
  const sqlite = new Database(DB_PATH)
  sqlite.pragma('journal_mode = WAL')
  sqlite.pragma('foreign_keys = ON')
  globalForDb._drawaiDb = drizzle(sqlite, { schema })
}

export const db = globalForDb._drawaiDb
