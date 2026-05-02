'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle, Layers } from 'lucide-react'
import type { ScenePlan } from '@/lib/presentation'
import { ScenePlanCard } from '@/components/ScenePlanCard'
import { cn } from '@/lib/utils'

function ScenePlanCardSkeleton() {
  return (
    <div className="flex-shrink-0 w-[300px] animate-pulse rounded-xl border border-zinc-100 dark:border-zinc-800/60 bg-zinc-50 dark:bg-zinc-900/50 p-5 space-y-3.5">
      <div className="h-2.5 w-6 rounded bg-zinc-200 dark:bg-zinc-800" />
      <div className="h-4 w-3/4 rounded bg-zinc-200 dark:bg-zinc-800" />
      <div className="space-y-1.5">
        <div className="h-3 w-full rounded bg-zinc-150 dark:bg-zinc-800/80" />
        <div className="h-3 w-5/6 rounded bg-zinc-150 dark:bg-zinc-800/80" />
        <div className="h-3 w-2/3 rounded bg-zinc-150 dark:bg-zinc-800/80" />
      </div>
      <div className="flex gap-1.5">
        <div className="h-5 w-16 rounded-md bg-zinc-100 dark:bg-zinc-800/80" />
        <div className="h-5 w-20 rounded-md bg-zinc-100 dark:bg-zinc-800/80" />
      </div>
    </div>
  )
}

function StoryboardEmptyState() {
  return (
    <div className="flex w-full flex-col items-center justify-center gap-4 py-20">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-200 dark:border-zinc-800">
        <Layers className="h-5 w-5 text-zinc-400" strokeWidth={1.5} />
      </div>
      <div className="space-y-1 text-center">
        <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
          Sin escenas todavía
        </p>
        <p className="max-w-[280px] text-xs text-zinc-400 dark:text-zinc-600">
          Describe un concepto complejo y el sistema dividirá el contenido en escenas educativas.
        </p>
      </div>
    </div>
  )
}

const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.07 },
  },
}

const cardVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring' as const, stiffness: 100, damping: 20 },
  },
}

interface StoryboardViewProps {
  scenes: ScenePlan[]
  isLoading?: boolean
  skeletonCount?: number
  canConfirm?: boolean
  onConfirm?: () => void
}

export function StoryboardView({
  scenes,
  isLoading = false,
  skeletonCount = 3,
  canConfirm = false,
  onConfirm,
}: StoryboardViewProps) {
  const hasGenerating = scenes.some((s) => s.status.startsWith('generating_'))
  const confirmEnabled = canConfirm && scenes.length > 0 && !hasGenerating

  const showHeader = isLoading || scenes.length > 0

  return (
    <div className="flex flex-col gap-4">
      {showHeader && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-600">
              Storyboard
            </span>
            {scenes.length > 0 && (
              <span className="font-mono text-[10px] text-zinc-400 dark:text-zinc-600">
                {scenes.length} escena{scenes.length !== 1 ? 's' : ''}
              </span>
            )}
          </div>

          {canConfirm && (
            <motion.button
              onClick={onConfirm}
              disabled={!confirmEnabled}
              whileTap={confirmEnabled ? { scale: 0.97, y: 1 } : {}}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              className={cn(
                'flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-medium transition-all duration-200',
                confirmEnabled
                  ? 'bg-zinc-950 text-white shadow-md hover:opacity-90 dark:bg-white dark:text-zinc-950'
                  : 'cursor-not-allowed bg-zinc-100 text-zinc-400 dark:bg-zinc-800 dark:text-zinc-600',
              )}
            >
              <CheckCircle className="h-3.5 w-3.5" strokeWidth={2} />
              Confirmar estructura
            </motion.button>
          )}
        </div>
      )}

      <div className="overflow-x-auto pb-3 -mx-1 px-1">
        <AnimatePresence mode="wait">
          {isLoading ? (
            <div key="skeleton" className="flex gap-4" style={{ width: 'max-content' }}>
              {Array.from({ length: skeletonCount }).map((_, i) => (
                <ScenePlanCardSkeleton key={i} />
              ))}
            </div>
          ) : scenes.length === 0 ? (
            <StoryboardEmptyState key="empty" />
          ) : (
            <motion.div
              key="cards"
              className="flex gap-4"
              style={{ width: 'max-content' }}
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              {scenes.map((scene, i) => (
                <motion.div key={scene.id} variants={cardVariants}>
                  <ScenePlanCard plan={scene} index={i} />
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
