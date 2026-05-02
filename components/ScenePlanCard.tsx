'use client'

import { motion } from 'framer-motion'
import { AlertCircle } from 'lucide-react'
import type { ScenePlan, ScenePlanStatus } from '@/lib/presentation'
import { cn } from '@/lib/utils'

const STATUS_LABELS: Record<ScenePlanStatus, string> = {
  pending: 'Pendiente',
  generating_description: 'Generando descripción...',
  awaiting_asset_approval: 'Revisión de assets',
  generating_assets: 'Generando assets...',
  generating_scene: 'Generando escena...',
  ready: 'Lista',
  error: 'Error',
}

function StatusDot({ status }: { status: ScenePlanStatus }) {
  const isGenerating = status.startsWith('generating_')

  const dotClass = cn(
    'h-1.5 w-1.5 rounded-full flex-shrink-0',
    status === 'ready' && 'bg-emerald-500',
    status === 'error' && 'bg-red-500',
    status === 'awaiting_asset_approval' && 'bg-orange-400',
    isGenerating && 'bg-amber-400',
    status === 'pending' && 'bg-zinc-300 dark:bg-zinc-600',
  )

  if (isGenerating) {
    return (
      <motion.span
        className={dotClass}
        animate={{ opacity: [1, 0.25, 1] }}
        transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
      />
    )
  }

  return <span className={dotClass} />
}

interface ScenePlanCardProps {
  plan: ScenePlan
  index: number
}

export function ScenePlanCard({ plan, index }: ScenePlanCardProps) {
  const sceneNumber = String(index + 1).padStart(2, '0')

  return (
    <motion.article
      layout
      className="flex-shrink-0 w-[300px] flex flex-col gap-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 shadow-[0_4px_16px_-8px_rgba(0,0,0,0.06)]"
    >
      <div className="flex items-center justify-between">
        <span className="font-mono text-[10px] font-bold tracking-[0.2em] text-zinc-400 dark:text-zinc-600">
          {sceneNumber}
        </span>
        {plan.status === 'error' && (
          <AlertCircle className="h-3.5 w-3.5 text-red-500" strokeWidth={1.5} />
        )}
      </div>

      <h3 className="text-sm font-semibold leading-snug text-zinc-900 dark:text-zinc-100">
        {plan.title}
      </h3>

      <p className="text-xs leading-relaxed text-zinc-500 dark:text-zinc-400 line-clamp-3">
        {plan.excerpt}
      </p>

      {plan.key_concepts.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {plan.key_concepts.map((concept) => (
            <span
              key={concept}
              className="inline-flex items-center rounded-md bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 text-[11px] font-medium text-zinc-600 dark:text-zinc-400"
            >
              {concept}
            </span>
          ))}
        </div>
      )}

      {plan.visual_description && (
        <div className="rounded-lg border border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/40 px-3 py-2.5">
          <p className="text-[11px] leading-relaxed text-zinc-500 dark:text-zinc-400 line-clamp-2 italic">
            {plan.visual_description}
          </p>
        </div>
      )}

      <div className="flex items-center gap-2 mt-auto pt-0.5">
        <StatusDot status={plan.status} />
        <span className="text-[11px] font-medium text-zinc-400 dark:text-zinc-600">
          {STATUS_LABELS[plan.status]}
        </span>
        {plan.status === 'error' && plan.error_message && (
          <span className="truncate text-[11px] text-red-500">{plan.error_message}</span>
        )}
      </div>
    </motion.article>
  )
}
