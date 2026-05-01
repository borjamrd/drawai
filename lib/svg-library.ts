export type SvgAsset = {
  id: string
  label: string
  description: string
  svgPath: string
}

export const SVG_LIBRARY: SvgAsset[] = [
  {
    id: 'soldier_standing',
    label: 'Soldado Colonial',
    description: 'A standing colonial soldier in uniform, holding a rifle',
    svgPath: '/assets/soldier_standing.svg',
  },
  {
    id: 'indigenous_figure',
    label: 'Figura Indígena',
    description: 'A standing indigenous person in traditional clothing',
    svgPath: '/assets/indigenous_figure.svg',
  },
  {
    id: 'territory_map',
    label: 'Mapa de Territorio',
    description: 'A simple map outline showing a territory or region',
    svgPath: '/assets/territory_map.svg',
  },
  {
    id: 'colonial_flag',
    label: 'Bandera Colonial',
    description: 'A flag on a pole representing a colonial power',
    svgPath: '/assets/colonial_flag.svg',
  },
  {
    id: 'directional_arrow',
    label: 'Flecha Direccional',
    description: 'A bold arrow indicating movement or direction',
    svgPath: '/assets/directional_arrow.svg',
  },
]

export const SVG_LIBRARY_MAP: Record<string, SvgAsset> = Object.fromEntries(
  SVG_LIBRARY.map((a) => [a.id, a])
)
