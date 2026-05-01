import fs from 'fs'
import path from 'path'

export type SvgAsset = {
  id: string
  label: string
  description: string
  svgPath: string
}

const JSON_PATH = path.join(process.cwd(), 'data', 'svg-library.json')

function getRawLibrary(): SvgAsset[] {
  try {
    const data = fs.readFileSync(JSON_PATH, 'utf8')
    return JSON.parse(data)
  } catch (e) {
    console.error('Error reading svg-library.json', e)
    return []
  }
}

export const SVG_LIBRARY: SvgAsset[] = getRawLibrary()

export const SVG_LIBRARY_MAP: Record<string, SvgAsset> = Object.fromEntries(
  SVG_LIBRARY.map((a) => [a.id, a])
)
