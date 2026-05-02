'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { CheckCircle, SkipForward, Sparkles } from 'lucide-react'
import type { MissingAssetProposal } from '@/lib/presentation'

interface MissingAssetApprovalProps {
  assets: MissingAssetProposal[]
  onConfirm: (approved: MissingAssetProposal[], skipped: MissingAssetProposal[]) => void
}

export function MissingAssetApproval({ assets, onConfirm }: MissingAssetApprovalProps) {
  const [drafts, setDrafts] = useState<MissingAssetProposal[]>(assets)
  const [skipped, setSkipped] = useState<Set<number>>(new Set())

  function updatePrompt(index: number, prompt: string) {
    setDrafts((prev) => prev.map((a, i) => (i === index ? { ...a, suggested_prompt: prompt } : a)))
  }

  function toggleSkip(index: number) {
    setSkipped((prev) => {
      const next = new Set(prev)
      if (next.has(index)) next.delete(index)
      else next.add(index)
      return next
    })
  }

  function handleConfirmAll() {
    const approved = drafts.filter((_, i) => !skipped.has(i))
    const skippedItems = drafts.filter((_, i) => skipped.has(i))
    onConfirm(approved, skippedItems)
  }

  function handleApproveAll() {
    setSkipped(new Set())
    onConfirm(drafts, [])
  }

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-orange-200 bg-orange-50/60 p-3.5 dark:border-orange-900/40 dark:bg-orange-950/20">
      <div className="flex items-center gap-2">
        <Sparkles className="h-3.5 w-3.5 text-orange-500" strokeWidth={1.5} />
        <span className="text-[11px] font-semibold text-orange-700 dark:text-orange-400">
          Assets faltantes
        </span>
        <span className="font-mono text-[10px] text-orange-500 dark:text-orange-500/70">
          {assets.length}
        </span>
      </div>

      <div className="flex flex-col gap-2">
        {drafts.map((asset, i) => {
          const isSkipped = skipped.has(i)
          return (
            <div
              key={asset.concept}
              className={`flex flex-col gap-1.5 rounded-md border p-2.5 transition-opacity ${
                isSkipped
                  ? 'border-zinc-200 bg-zinc-50 opacity-50 dark:border-zinc-800 dark:bg-zinc-900/40'
                  : 'border-orange-200/60 bg-white dark:border-orange-900/30 dark:bg-zinc-900/60'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-semibold text-zinc-700 dark:text-zinc-300">
                  {asset.concept}
                </span>
                <button
                  onClick={() => toggleSkip(i)}
                  className="flex items-center gap-1 text-[10px] text-zinc-400 transition-colors hover:text-zinc-600 dark:hover:text-zinc-300"
                >
                  <SkipForward className="h-2.5 w-2.5" strokeWidth={2} />
                  {isSkipped ? 'Incluir' : 'Omitir'}
                </button>
              </div>
              {!isSkipped && (
                <textarea
                  value={asset.suggested_prompt}
                  onChange={(e) => updatePrompt(i, e.target.value)}
                  rows={2}
                  className="w-full resize-none rounded border border-zinc-200 bg-zinc-50 px-2 py-1.5 text-[10px] leading-relaxed text-zinc-600 focus:outline-none focus:ring-1 focus:ring-orange-300 dark:border-zinc-700 dark:bg-zinc-800/50 dark:text-zinc-400 dark:focus:ring-orange-700"
                />
              )}
            </div>
          )
        })}
      </div>

      <div className="flex gap-2">
        <motion.button
          onClick={handleApproveAll}
          whileTap={{ scale: 0.97, y: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-orange-500 px-3 py-2 text-[11px] font-semibold text-white shadow-sm hover:bg-orange-600 transition-colors"
        >
          <CheckCircle className="h-3 w-3" strokeWidth={2} />
          Aprobar todo
        </motion.button>
        {skipped.size < drafts.length && (
          <motion.button
            onClick={handleConfirmAll}
            whileTap={{ scale: 0.97, y: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            className="flex items-center gap-1.5 rounded-lg border border-zinc-200 px-3 py-2 text-[11px] font-medium text-zinc-600 hover:bg-zinc-50 transition-colors dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
          >
            Confirmar selección
          </motion.button>
        )}
      </div>
    </div>
  )
}
