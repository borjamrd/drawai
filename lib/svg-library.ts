import fs from 'fs'
import path from 'path'

export type SvgAsset = {
  id: string
  label: string
  description: string
  svgPath: string
  default_width_pct: number
}

const JSON_PATH = path.join(process.cwd(), 'data', 'svg-library.json')

export function getSvgLibrary(): SvgAsset[] {
  try {
    const rawData = fs.readFileSync(JSON_PATH, 'utf8')
    return JSON.parse(rawData) as SvgAsset[]
  } catch (error) {
    console.error('Error reading SVG library:', error)
    return []
  }
}

export function getSvgLibraryMap(): Record<string, SvgAsset> {
  const library = getSvgLibrary()
  return Object.fromEntries(library.map((a) => [a.id, a]))
}

/**
 * @deprecated Use getSvgLibrary() for up-to-date data. 
 * This constant is initialized at startup and will be stale if new assets are added.
 */
export const SVG_LIBRARY: SvgAsset[] = getSvgLibrary()

/**
 * @deprecated Use getSvgLibraryMap() for up-to-date data.
 * This constant is initialized at startup and will be stale if new assets are added.
 */
export const SVG_LIBRARY_MAP: Record<string, SvgAsset> = Object.fromEntries(
  SVG_LIBRARY.map((a) => [a.id, a])
)
