import { sqliteTable, text, integer, real, primaryKey } from 'drizzle-orm/sqlite-core'

export const presentations = sqliteTable('presentations', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  input: text('input').notNull(),
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull(),
})

export const scenePlans = sqliteTable(
  'scene_plans',
  {
    id: text('id').notNull(),
    presentationId: text('presentation_id')
      .notNull()
      .references(() => presentations.id, { onDelete: 'cascade' }),
    position: integer('position').notNull(),
    title: text('title').notNull(),
    excerpt: text('excerpt').notNull(),
    keyConcepts: text('key_concepts').notNull(),
    status: text('status').notNull(),
    visualDescription: text('visual_description'),
    scene: text('scene'),
    missingAssets: text('missing_assets'),
    errorMessage: text('error_message'),
  },
  (t) => [primaryKey({ columns: [t.id, t.presentationId] })],
)

export const assets = sqliteTable('assets', {
  id: text('id').primaryKey(),
  label: text('label').notNull(),
  description: text('description').notNull(),
  svgPath: text('svg_path').notNull(),
  defaultWidthPct: real('default_width_pct').notNull().default(20),
})
