import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import { migrate } from 'drizzle-orm/better-sqlite3/migrator'
import path from 'path'
import { readFileSync } from 'fs'
import { assets } from './schema'

const DB_PATH = path.join(process.cwd(), 'drawai.db')
const MIGRATIONS_FOLDER = path.join(process.cwd(), 'drizzle')
const JSON_PATH = path.join(process.cwd(), 'data', 'svg-library.json')

const sqlite = new Database(DB_PATH)
sqlite.pragma('journal_mode = WAL')
sqlite.pragma('foreign_keys = ON')

const db = drizzle(sqlite, { schema: { assets } })

migrate(db, { migrationsFolder: MIGRATIONS_FOLDER })
console.log('✓ Migrations applied')

type JsonAsset = {
  id: string
  label: string
  description: string
  svgPath: string
  default_width_pct: number
}

const jsonAssets: JsonAsset[] = JSON.parse(readFileSync(JSON_PATH, 'utf8'))

for (const a of jsonAssets) {
  db.insert(assets)
    .values({
      id: a.id,
      label: a.label,
      description: a.description,
      svgPath: a.svgPath,
      defaultWidthPct: a.default_width_pct,
    })
    .onConflictDoNothing()
    .run()
}

console.log(`✓ Seeded ${jsonAssets.length} assets`)
sqlite.close()
