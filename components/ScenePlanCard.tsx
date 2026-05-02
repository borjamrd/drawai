'use client'

import { useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { AlertCircle, ChevronLeft, ChevronRight, Plus, RefreshCcw, X } from 'lucide-react'
import { SceneCanvas } from '@/components/SceneCanvas'
import { MissingAssetApproval } from '@/components/MissingAssetApproval'
import type { MissingAssetProposal, ScenePlan, ScenePlanStatus } from '@/lib/presentation'
import type { Scene } from '@/lib/genkit/scene-flow'
import { cn } from '@/lib/utils'

const STATUS_LABELS: Record<ScenePlanStatus, string> = {
  pending: 'Pending',
  generating_description: 'Generating description...',
  awaiting_asset_approval: 'Asset review',
  generating_assets: 'Generating assets...',
  generating_scene: 'Generating scene...',
  ready: 'Ready',
  error: 'Error',
}

const MINI_SCALE = 260 / 800
const MINI_H = Math.round(450 * MINI_SCALE) // 146px

function MiniScenePreview({ scene }: { scene: Scene }) {
  return (
    <div
      className="overflow-hidden rounded-lg"
      style={{ width: 260, height: MINI_H }}
    >
      <div
        style={{
          transform: `scale(${MINI_SCALE})`,
          transformOrigin: 'top left',
          width: 800,
          height: 450,
          pointerEvents: 'none',
        }}
      >
        <SceneCanvas scene={scene} compact />
      </div>
    </div>
  )
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
  total: number
  canEdit?: boolean
  onUpdate?: (changes: Pick<ScenePlan, 'title' | 'key_concepts'>) => void
  onMoveLeft?: () => void
  onMoveRight?: () => void
  onRegenerate?: (visualDescription: string) => void
  onApprove?: (approved: MissingAssetProposal[], skipped: MissingAssetProposal[]) => void
}

export function ScenePlanCard({
  plan,
  index,
  total,
  canEdit = false,
  onUpdate,
  onMoveLeft,
  onMoveRight,
  onRegenerate,
  onApprove,
}: ScenePlanCardProps) {
  const [editingTitle, setEditingTitle] = useState(false)
  const [draftTitle, setDraftTitle] = useState(plan.title)
  const [addingConcept, setAddingConcept] = useState(false)
  const [draftConcept, setDraftConcept] = useState('')
  // draftVisualDesc initializes from prop; StoryboardView resets this card via key when status changes
  const [draftVisualDesc, setDraftVisualDesc] = useState(plan.visual_description ?? '')
  const conceptInputRef = useRef<HTMLInputElement>(null)
  const sceneNumber = String(index + 1).padStart(2, '0')

  function commitTitle() {
    const trimmed = draftTitle.trim()
    if (trimmed && trimmed !== plan.title) {
      onUpdate?.({ title: trimmed, key_concepts: plan.key_concepts })
    } else {
      setDraftTitle(plan.title)
    }
    setEditingTitle(false)
  }

  function removeConcept(concept: string) {
    onUpdate?.({
      title: plan.title,
      key_concepts: plan.key_concepts.filter((c) => c !== concept),
    })
  }

  function commitConcept() {
    const trimmed = draftConcept.trim()
    if (trimmed && !plan.key_concepts.includes(trimmed)) {
      onUpdate?.({ title: plan.title, key_concepts: [...plan.key_concepts, trimmed] })
    }
    setDraftConcept('')
    setAddingConcept(false)
  }

  const isGenerating = plan.status.startsWith('generating_')
  const showLevel2 =
    (plan.status === 'ready' || plan.status === 'error') && plan.visual_description !== undefined

  return (
    <motion.article
      layout
      className="flex-shrink-0 w-[300px] flex flex-col gap-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 shadow-[0_4px_16px_-8px_rgba(0,0,0,0.06)]"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="font-mono text-[10px] font-bold tracking-[0.2em] text-zinc-400 dark:text-zinc-600">
          {sceneNumber}
        </span>
        <div className="flex items-center gap-0.5">
          {canEdit && (
            <>
              <button
                onClick={onMoveLeft}
                disabled={index === 0}
                className="flex h-6 w-6 items-center justify-center rounded text-zinc-400 transition-colors hover:text-zinc-700 disabled:pointer-events-none disabled:opacity-25 dark:hover:text-zinc-300"
              >
                <ChevronLeft className="h-3.5 w-3.5" strokeWidth={2} />
              </button>
              <button
                onClick={onMoveRight}
                disabled={index === total - 1}
                className="flex h-6 w-6 items-center justify-center rounded text-zinc-400 transition-colors hover:text-zinc-700 disabled:pointer-events-none disabled:opacity-25 dark:hover:text-zinc-300"
              >
                <ChevronRight className="h-3.5 w-3.5" strokeWidth={2} />
              </button>
            </>
          )}
          {plan.status === 'error' && (
            <AlertCircle className="h-3.5 w-3.5 text-red-500" strokeWidth={1.5} />
          )}
        </div>
      </div>

      {/* Title */}
      {canEdit && editingTitle ? (
        <input
          autoFocus
          value={draftTitle}
          onChange={(e) => setDraftTitle(e.target.value)}
          onBlur={commitTitle}
          onKeyDown={(e) => {
            if (e.key === 'Enter') commitTitle()
            if (e.key === 'Escape') {
              setDraftTitle(plan.title)
              setEditingTitle(false)
            }
          }}
          className="-mx-1 w-[calc(100%+0.5rem)] rounded-md border border-zinc-300 bg-transparent px-2 py-1 text-sm font-semibold text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-400 dark:border-zinc-700 dark:text-zinc-100 dark:focus:ring-zinc-600"
        />
      ) : (
        <h3
          onClick={() => canEdit && setEditingTitle(true)}
          className={cn(
            '-mx-1 rounded px-1 text-sm font-semibold leading-snug text-zinc-900 dark:text-zinc-100',
            canEdit && 'cursor-text transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800',
          )}
        >
          {plan.title}
        </h3>
      )}

      {/* Excerpt — shown when not yet ready */}
      {!plan.scene && (
        <p className="text-xs leading-relaxed text-zinc-500 dark:text-zinc-400 line-clamp-3">
          {plan.excerpt}
        </p>
      )}

      {/* Key concepts — shown during structure editing */}
      {canEdit && (
        <div className="flex flex-wrap gap-1.5">
          {plan.key_concepts.map((concept) => (
            <span
              key={concept}
              className="inline-flex items-center gap-1 rounded-md bg-zinc-100 px-2 py-0.5 text-[11px] font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
            >
              {concept}
              <button
                onClick={() => removeConcept(concept)}
                className="text-zinc-400 transition-colors hover:text-zinc-700 dark:hover:text-zinc-200"
              >
                <X className="h-2.5 w-2.5" strokeWidth={2.5} />
              </button>
            </span>
          ))}
          {!addingConcept && plan.key_concepts.length < 4 && (
            <button
              onClick={() => {
                setAddingConcept(true)
                setTimeout(() => conceptInputRef.current?.focus(), 0)
              }}
              className="inline-flex items-center gap-1 rounded-md border border-dashed border-zinc-300 px-2 py-0.5 text-[11px] text-zinc-400 transition-colors hover:text-zinc-600 dark:border-zinc-700 dark:hover:text-zinc-300"
            >
              <Plus className="h-2.5 w-2.5" strokeWidth={2.5} />
              Add
            </button>
          )}
          {addingConcept && (
            <input
              ref={conceptInputRef}
              autoFocus
              value={draftConcept}
              onChange={(e) => setDraftConcept(e.target.value)}
              onBlur={commitConcept}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === 'Tab') {
                  e.preventDefault()
                  commitConcept()
                }
                if (e.key === 'Escape') {
                  setDraftConcept('')
                  setAddingConcept(false)
                }
              }}
              placeholder="concept..."
              className="w-24 rounded-md border border-zinc-300 bg-zinc-50 px-2 py-0.5 text-[11px] text-zinc-700 placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:focus:ring-zinc-600"
            />
          )}
        </div>
      )}

      {/* Missing asset approval panel */}
      {plan.status === 'awaiting_asset_approval' && plan.missing_assets && plan.missing_assets.length > 0 && (
        <MissingAssetApproval
          assets={plan.missing_assets.filter((a) => !a.approved)}
          onConfirm={(approved, skipped) => onApprove?.(approved, skipped)}
        />
      )}

      {/* Generating: show visual description with pulse */}
      {isGenerating && plan.visual_description && (
        <div className="rounded-lg border border-zinc-100 bg-zinc-50 px-3 py-2.5 dark:border-zinc-800 dark:bg-zinc-800/40">
          <p className="line-clamp-2 text-[11px] italic leading-relaxed text-zinc-500 dark:text-zinc-400">
            {plan.visual_description}
          </p>
        </div>
      )}

      {/* Mini preview — shown when ready */}
      {plan.status === 'ready' && plan.scene && (
        <MiniScenePreview scene={plan.scene} />
      )}

      {/* Level 2: visual description editor + regenerate */}
      {showLevel2 && (
        <div className="flex flex-col gap-2">
          <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-600">
            Visual description
          </label>
          <textarea
            value={draftVisualDesc}
            onChange={(e) => setDraftVisualDesc(e.target.value)}
            rows={3}
            className="w-full resize-none rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-[11px] leading-relaxed text-zinc-600 focus:outline-none focus:ring-1 focus:ring-zinc-400 dark:border-zinc-800 dark:bg-zinc-900/50 dark:text-zinc-400 dark:focus:ring-zinc-600"
          />
          <motion.button
            onClick={() => onRegenerate?.(draftVisualDesc)}
            disabled={!draftVisualDesc.trim() || isGenerating}
            whileTap={{ scale: 0.97, y: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            className="flex items-center gap-1.5 self-start rounded-lg border border-zinc-200 px-3 py-1.5 text-[11px] font-medium text-zinc-600 transition-colors hover:bg-zinc-50 disabled:pointer-events-none disabled:opacity-40 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
          >
            <RefreshCcw className="h-3 w-3" strokeWidth={2} />
            Regenerate scene
          </motion.button>
        </div>
      )}

      {/* Status footer */}
      <div className="mt-auto flex items-center gap-2 pt-0.5">
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
