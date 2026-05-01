import library from '@/data/svg-library.json'

export type SvgAsset = {
  id: string
  label: string
  description: string
  svgPath: string
}

export const SVG_LIBRARY: SvgAsset[] = library as SvgAsset[]

export const SVG_LIBRARY_MAP: Record<string, SvgAsset> = Object.fromEntries(
  SVG_LIBRARY.map((a) => [a.id, a])
)
