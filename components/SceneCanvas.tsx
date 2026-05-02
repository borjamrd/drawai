'use client'

import { useEffect, useState } from 'react'
import { motion, type TargetAndTransition } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { SVG_LIBRARY_MAP } from '@/lib/svg-library-client'
import type { Scene } from '@/lib/genkit/scene-flow'

type EntryEffect = Scene['elements'][number]['entry_effect']

const ENTRY_VARIANTS: Record<EntryEffect, { initial: TargetAndTransition; animate: TargetAndTransition }> = {
  fade:        { initial: { opacity: 0 },              animate: { opacity: 1 } },
  slide_left:  { initial: { opacity: 0, x: -60 },      animate: { opacity: 1, x: 0 } },
  slide_right: { initial: { opacity: 0, x: 60 },       animate: { opacity: 1, x: 0 } },
  slide_up:    { initial: { opacity: 0, y: 40 },       animate: { opacity: 1, y: 0 } },
  zoom:        { initial: { opacity: 0, scale: 0.3 },  animate: { opacity: 1, scale: 1 } },
  bounce:      { initial: { opacity: 0, y: -40 },      animate: { opacity: 1, y: 0 } },
}

interface SceneCanvasProps {
  scene: Scene
}

export function SceneCanvas({ scene }: SceneCanvasProps) {
  const [visibleIndices, setVisibleIndices] = useState<Set<number>>(new Set())
  const [playKey, setPlayKey] = useState(0)

  useEffect(() => {
    setVisibleIndices(new Set())
    const timers = scene.elements.map((el, i) =>
      setTimeout(
        () => setVisibleIndices((prev) => new Set([...prev, i])),
        el.entry_time_ms
      )
    )
    return () => timers.forEach(clearTimeout)
  }, [scene, playKey])

  return (
    <div className="flex flex-col gap-4 items-start">
      <h2 className="text-xl font-semibold">{scene.title}</h2>

      <div className="relative w-[800px] h-[450px] bg-white border rounded-lg overflow-hidden shadow-sm">
        {scene.elements.map((el, i) => {
          if (!visibleIndices.has(i)) return null
          const asset = SVG_LIBRARY_MAP[el.library_id]
          if (!asset) return null
          const variant = ENTRY_VARIANTS[el.entry_effect]

          return (
            <div
              key={`${playKey}-${i}`}
              className="absolute"
              style={{
                left: `${el.x}%`,
                top: `${el.y}%`,
                transform: `translate(-50%, -50%) scale(${el.scale})`,
              }}
            >
              <motion.div
                initial={variant.initial}
                animate={variant.animate}
                transition={
                  el.entry_effect === 'bounce'
                    ? { type: 'spring', stiffness: 300, damping: 10 }
                    : { duration: 0.5 }
                }
              >
                <img src={asset.svgPath} alt={asset.label} className="w-16 h-16" />
              </motion.div>
            </div>
          )
        })}
      </div>

      <Button variant="outline" onClick={() => setPlayKey((k) => k + 1)}>
        Reproducir de nuevo
      </Button>
    </div>
  )
}
