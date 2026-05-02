'use client'

import { useEffect, useState } from 'react'
import { motion, type TargetAndTransition } from 'framer-motion'
import { RotateCcw } from 'lucide-react'
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
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium text-zinc-700 dark:text-zinc-300 tracking-tight">
          {scene.title}
        </h2>
        <motion.button
          onClick={() => setPlayKey((k) => k + 1)}
          whileTap={{ scale: 0.96, y: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
        >
          <RotateCcw className="h-3 w-3" strokeWidth={1.5} />
          Repetir
        </motion.button>
      </div>

      <div className="relative w-[800px] h-[450px] bg-white border border-zinc-200 dark:border-zinc-700 rounded-xl overflow-hidden shadow-[0_4px_24px_-8px_rgba(0,0,0,0.08)]">
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
                    : { type: 'spring', stiffness: 100, damping: 20 }
                }
              >
                <img src={asset.svgPath} alt={asset.label} className="w-16 h-16" />
              </motion.div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
