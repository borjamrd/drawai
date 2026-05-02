'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Layers } from 'lucide-react'
import { StoryboardView } from '@/components/StoryboardView'
import type { Presentation, ScenePlan } from '@/lib/presentation'
import { loadPresentations, savePresentation } from '@/lib/presentation-storage'
import type { PresentationPlan } from '@/lib/genkit/scene-flow'

type Phase = 'idle' | 'structure'

export default function StoryboardPage() {
  const [presentation, setPresentation] = useState<Presentation | null>(() => {
    if (typeof window === 'undefined') return null
    return loadPresentations()[0] ?? null
  })
  const [prompt, setPrompt] = useState<string>(() => {
    if (typeof window === 'undefined') return ''
    return loadPresentations()[0]?.input ?? ''
  })
  const [phase, setPhase] = useState<Phase>(() => {
    if (typeof window === 'undefined') return 'idle'
    return loadPresentations().length > 0 ? 'structure' : 'idle'
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

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

  function updatePresentation(updated: Presentation) {
    setPresentation(updated)
    savePresentation(updated)
  }

  function handleUpdateScene(index: number, changes: Pick<ScenePlan, 'title' | 'key_concepts'>) {
    if (!presentation) return
    updatePresentation({
      ...presentation,
      scenes: presentation.scenes.map((s, i) => (i === index ? { ...s, ...changes } : s)),
      updatedAt: Date.now(),
    })
  }

  function handleMoveScene(fromIndex: number, toIndex: number) {
    if (!presentation) return
    const scenes = [...presentation.scenes]
    const [moved] = scenes.splice(fromIndex, 1)
    scenes.splice(toIndex, 0, moved)
    updatePresentation({ ...presentation, scenes, updatedAt: Date.now() })
  }

  function handleConfirm() {
    // Fase 3: trigger generateVisualDescriptionFlow per scene
    console.log('Estructura confirmada — Fase 3 lanzará la generación de descripciones visuales')
  }

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

        {presentation?.title && phase === 'structure' && (
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-medium tracking-tight text-zinc-700 dark:text-zinc-300">
              {presentation.title}
            </h2>
          </div>
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
        />
      </div>
    </div>
  )
}
