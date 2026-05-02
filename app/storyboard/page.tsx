'use client'

import { useState, useEffect, startTransition } from 'react'
import { motion } from 'framer-motion'
import { Layers } from 'lucide-react'
import { StoryboardView } from '@/components/StoryboardView'
import type { Presentation, ScenePlan } from '@/lib/presentation'
import { loadPresentations, savePresentation } from '@/lib/presentation-storage'
import type { MissingAssetProposal } from '@/lib/presentation'
import type { PresentationPlan, Scene, VisualDescriptionOutput } from '@/lib/genkit/scene-flow'

type Phase = 'idle' | 'structure' | 'generating'

export default function StoryboardPage() {
  const [presentation, setPresentation] = useState<Presentation | null>(null)
  const [prompt, setPrompt] = useState<string>('')
  const [phase, setPhase] = useState<Phase>('idle')

  useEffect(() => {
    const presentations = loadPresentations()
    if (presentations.length > 0) {
      startTransition(() => {
        setPresentation(presentations[0])
        setPrompt(presentations[0]?.input ?? '')
        setPhase('structure')
      })
    }
  }, [])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // ─── helpers ──────────────────────────────────────────────────────────────

  function patchScene(index: number, patch: Partial<ScenePlan>, pres: Presentation): Presentation {
    return {
      ...pres,
      scenes: pres.scenes.map((s, i) => (i === index ? { ...s, ...patch } : s)),
      updatedAt: Date.now(),
    }
  }

  function applyAndSave(updater: (prev: Presentation) => Presentation) {
    setPresentation((prev) => {
      if (!prev) return prev
      const next = updater(prev)
      savePresentation(next)
      return next
    })
  }

  // ─── phase 1: generate structure ──────────────────────────────────────────

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!prompt.trim()) return

    setIsLoading(true)
    setError(null)
    setPresentation(null)
    setPhase('idle')

    try {
      const res = await fetch('/api/generate-presentation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)

      const plan = (await res.json()) as PresentationPlan

      const newPresentation: Presentation = {
        id: crypto.randomUUID(),
        title: plan.title,
        input: prompt,
        scenes: plan.scenes.map((s, i) => ({
          id: String(i + 1),
          title: s.title,
          excerpt: s.excerpt,
          key_concepts: s.key_concepts,
          status: 'pending',
        })),
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }

      setPresentation(newPresentation)
      savePresentation(newPresentation)
      setPhase('structure')
    } catch {
      setError('Algo salió mal, inténtalo de nuevo.')
    } finally {
      setIsLoading(false)
    }
  }

  // ─── level 1 editing ──────────────────────────────────────────────────────

  function handleUpdateScene(index: number, changes: Pick<ScenePlan, 'title' | 'key_concepts'>) {
    applyAndSave((prev) => patchScene(index, changes, prev))
  }

  function handleMoveScene(fromIndex: number, toIndex: number) {
    applyAndSave((prev) => {
      const scenes = [...prev.scenes]
      const [moved] = scenes.splice(fromIndex, 1)
      scenes.splice(toIndex, 0, moved)
      return { ...prev, scenes, updatedAt: Date.now() }
    })
  }

  // ─── asset generation helper ──────────────────────────────────────────────

  async function generateAsset(asset: MissingAssetProposal): Promise<void> {
    await fetch('/api/generate-asset', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ concept: asset.concept, prompt: asset.suggested_prompt }),
    })
    // Non-fatal: if generation fails, the scene will render without this asset
  }

  async function generateSceneElements(visualDescription: string, index: number): Promise<void> {
    applyAndSave((prev) => patchScene(index, { status: 'generating_scene' }, prev))
    const res = await fetch('/api/generate-scene', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: visualDescription }),
    })
    if (!res.ok) throw new Error('scene')
    const scene = (await res.json()) as Scene
    applyAndSave((prev) => patchScene(index, { status: 'ready', scene }, prev))
  }

  // ─── phase 2: confirm + generate all scenes in parallel ───────────────────

  async function handleConfirm() {
    if (!presentation) return
    const scenesSnapshot = presentation.scenes

    applyAndSave((prev) => ({
      ...prev,
      scenes: prev.scenes.map((s) => ({ ...s, status: 'generating_description' as const })),
      updatedAt: Date.now(),
    }))
    setPhase('generating')

    scenesSnapshot.forEach((scenePlan, i) => runScenePipeline(scenePlan, i))
  }

  async function runScenePipeline(scenePlan: ScenePlan, index: number) {
    try {
      // Step 1: visual description + missing asset detection
      const descRes = await fetch('/api/generate-visual-description', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: scenePlan.title,
          excerpt: scenePlan.excerpt,
          key_concepts: scenePlan.key_concepts,
        }),
      })
      if (!descRes.ok) throw new Error('description')
      const { visual_description, missing_assets } = (await descRes.json()) as VisualDescriptionOutput

      const autoAssets = missing_assets.filter((a) => a.approved)
      const needsApproval = missing_assets.filter((a) => !a.approved)

      // Pause for user approval if any ambiguous assets exist
      if (needsApproval.length > 0) {
        applyAndSave((prev) =>
          patchScene(index, { status: 'awaiting_asset_approval', visual_description, missing_assets }, prev),
        )
        return // resumes via handleApproveSceneAssets
      }

      // Auto-generate concrete missing assets
      if (autoAssets.length > 0) {
        applyAndSave((prev) =>
          patchScene(index, { status: 'generating_assets', visual_description, missing_assets }, prev),
        )
        await Promise.all(autoAssets.map(generateAsset))
      } else {
        applyAndSave((prev) => patchScene(index, { visual_description }, prev))
      }

      // Step 2: generate scene elements
      await generateSceneElements(visual_description, index)
    } catch {
      applyAndSave((prev) =>
        patchScene(index, { status: 'error', error_message: 'Generación fallida' }, prev),
      )
    }
  }

  // ─── phase 2b: resume after user approves missing assets ──────────────────

  async function handleApproveSceneAssets(
    index: number,
    approved: MissingAssetProposal[],
    _: MissingAssetProposal[],
  ) {
    // Capture current visual_description before async work (read from current state)
    const currentScene = presentation?.scenes[index]
    const visualDescription = currentScene?.visual_description
    if (!visualDescription) return

    try {
      if (approved.length > 0) {
        applyAndSave((prev) =>
          patchScene(index, { status: 'generating_assets', missing_assets: [] }, prev),
        )
        await Promise.all(approved.map(generateAsset))
      }
      await generateSceneElements(visualDescription, index)
    } catch {
      applyAndSave((prev) =>
        patchScene(index, { status: 'error', error_message: 'Error generando assets' }, prev),
      )
    }
  }

  // ─── level 2: regenerate individual scene ─────────────────────────────────

  async function handleRegenerateScene(index: number, visualDescription: string) {
    applyAndSave((prev) =>
      patchScene(index, { status: 'generating_scene', visual_description: visualDescription }, prev),
    )
    try {
      await generateSceneElements(visualDescription, index)
    } catch {
      applyAndSave((prev) =>
        patchScene(index, { status: 'error', error_message: 'Regeneración fallida' }, prev),
      )
    }
  }

  // ─── render ───────────────────────────────────────────────────────────────

  const scenes = presentation?.scenes ?? []

  return (
    <div className="flex min-h-[100dvh] flex-col bg-white dark:bg-zinc-950">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-8 pb-12 pt-10">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <Layers className="h-4 w-4 text-zinc-400" strokeWidth={1.5} />
            <h1 className="text-xl font-semibold tracking-tight text-zinc-950 dark:text-white">
              Storyboard
            </h1>
          </div>
          <p className="max-w-[520px] text-sm text-zinc-500 dark:text-zinc-400">
            Describe un concepto complejo y el sistema lo dividirá en escenas educativas animadas.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="group relative">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Ej: Explica los tres primeros artículos de la Constitución española, incluyendo la forma de gobierno y los valores fundamentales del Estado."
            rows={4}
            className="w-full resize-none rounded-2xl border border-zinc-200 bg-white px-6 py-4 text-sm text-zinc-900 placeholder:text-zinc-400 shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-zinc-400 group-hover:shadow-md disabled:opacity-60 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:ring-zinc-600"
            disabled={isLoading}
          />
          <div className="absolute bottom-3 right-3 flex items-center gap-3">
            {error && (
              <p className="animate-in fade-in slide-in-from-right-2 text-xs font-medium text-red-600 dark:text-red-400">
                {error}
              </p>
            )}
            <motion.button
              type="submit"
              disabled={isLoading || !prompt.trim()}
              whileTap={{ scale: 0.97, y: 1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              className="flex items-center gap-2 rounded-xl bg-zinc-950 px-5 py-2 text-sm font-medium text-white shadow-lg transition-all hover:opacity-90 disabled:opacity-40 dark:bg-white dark:text-zinc-950"
            >
              {isLoading ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              ) : (
                <Layers className="h-4 w-4" strokeWidth={2} />
              )}
              {isLoading ? 'Analizando...' : 'Generar storyboard'}
            </motion.button>
          </div>
        </form>

        {presentation?.title && phase !== 'idle' && (
          <h2 className="text-sm font-medium tracking-tight text-zinc-700 dark:text-zinc-300">
            {presentation.title}
          </h2>
        )}

        <StoryboardView
          scenes={scenes}
          isLoading={isLoading}
          skeletonCount={3}
          canConfirm={phase === 'structure'}
          canEdit={phase === 'structure'}
          onConfirm={handleConfirm}
          onUpdateScene={handleUpdateScene}
          onMoveScene={handleMoveScene}
          onRegenerateScene={handleRegenerateScene}
          onApproveSceneAssets={handleApproveSceneAssets}
        />
      </div>
    </div>
  )
}
