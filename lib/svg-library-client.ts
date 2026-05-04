'use client'

import { useState, useEffect } from 'react'
import type { SvgAsset } from './svg-library'
import rawData from '@/data/svg-library.json'

const bootstrapMap: Record<string, SvgAsset> = Object.fromEntries(
  (rawData as SvgAsset[]).map((a) => [a.id, a]),
)

// Module-level cache — one fetch per page load across all components
let _liveMap: Record<string, SvgAsset> | null = null

export function useAssetsMap(): Record<string, SvgAsset> {
  const [map, setMap] = useState<Record<string, SvgAsset>>(_liveMap ?? bootstrapMap)

  useEffect(() => {
    if (_liveMap) {
      setMap(_liveMap)
      return
    }
    fetch('/api/assets')
      .then((r) => r.json())
      .then((assets: SvgAsset[]) => {
        _liveMap = Object.fromEntries(assets.map((a) => [a.id, a]))
        setMap(_liveMap)
      })
      .catch(() => {})
  }, [])

  return map
}
