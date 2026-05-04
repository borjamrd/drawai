import { db } from './db/index'
import { assets as assetsTable } from './db/schema'

export type SvgAsset = {
  id: string
  label: string
  description: string
  svgPath: string
  default_width_pct: number
}

function rowToAsset(r: typeof assetsTable.$inferSelect): SvgAsset {
  return {
    id: r.id,
    label: r.label,
    description: r.description,
    svgPath: r.svgPath,
    default_width_pct: r.defaultWidthPct,
  }
}

export function getSvgLibrary(): SvgAsset[] {
  return db.select().from(assetsTable).all().map(rowToAsset)
}

export function getSvgLibraryMap(): Record<string, SvgAsset> {
  return Object.fromEntries(getSvgLibrary().map((a) => [a.id, a]))
}
