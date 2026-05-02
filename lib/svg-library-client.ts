import type { SvgAsset } from './svg-library'
import data from '@/data/svg-library.json'

const assets = data as SvgAsset[]

export const SVG_LIBRARY_MAP: Record<string, SvgAsset> = Object.fromEntries(
  assets.map((a) => [a.id, a])
)
