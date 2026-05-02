'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Layers } from 'lucide-react'
import { StoryboardView } from '@/components/StoryboardView'
import type { ScenePlan } from '@/lib/presentation'

// Fase 1 mock — replaced with planPresentationFlow in Fase 2
const MOCK_SCENES: ScenePlan[] = [
  {
    id: '1',
    title: 'El Estado democrático',
    excerpt:
      'España se constituye en un Estado social y democrático de Derecho, que propugna como valores superiores de su ordenamiento jurídico la libertad, la justicia, la igualdad y el pluralismo político.',
    key_concepts: ['Estado social', 'democracia', 'valores constitucionales'],
    status: 'pending',
  },
  {
    id: '2',
    title: 'La soberanía popular',
    excerpt:
      'La soberanía nacional reside en el pueblo español, del que emanan los poderes del Estado.',
    key_concepts: ['soberanía', 'pueblo', 'poderes del Estado'],
    status: 'ready',
    visual_description:
      'Centra en el canvas a un grupo de personas representando al pueblo español. A los lados, coloca símbolos de los tres poderes del Estado.',
  },
  {
    id: '3',
    title: 'La Monarquía parlamentaria',
    excerpt: 'La forma política del Estado español es la Monarquía parlamentaria.',
    key_concepts: ['monarquía', 'corona', 'parlamento'],
    status: 'generating_scene',
  },
]

export default function StoryboardPage() {
  const [prompt, setPrompt] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [scenes, setScenes] = useState<ScenePlan[]>(MOCK_SCENES)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!prompt.trim()) return
    // Fase 2: replace with POST /api/generate-presentation
    setIsLoading(true)
    setScenes([])
    setTimeout(() => {
      setScenes(MOCK_SCENES)
      setIsLoading(false)
    }, 1500)
  }

  return (
    <div className="flex flex-col min-h-[100dvh] bg-white dark:bg-zinc-950">
      <div className="w-full max-w-5xl mx-auto px-8 pt-10 pb-12 flex flex-col gap-8">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <Layers className="h-4 w-4 text-zinc-400" strokeWidth={1.5} />
            <h1 className="text-xl font-semibold tracking-tight text-zinc-950 dark:text-white">
              Storyboard
            </h1>
          </div>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-[520px]">
            Describe un concepto complejo y el sistema lo dividirá en escenas educativas animadas.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="relative group">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Ej: Explica los tres primeros artículos de la Constitución española, incluyendo la forma de gobierno y los valores fundamentales del Estado."
            rows={4}
            className="w-full resize-none rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-6 py-4 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-400 dark:focus:ring-zinc-600 transition-all shadow-sm group-hover:shadow-md"
            disabled={isLoading}
          />
          <div className="absolute right-3 bottom-3">
            <motion.button
              type="submit"
              disabled={isLoading || !prompt.trim()}
              whileTap={{ scale: 0.97, y: 1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              className="flex items-center gap-2 rounded-xl bg-zinc-950 dark:bg-white px-5 py-2 text-sm font-medium text-white dark:text-zinc-950 disabled:opacity-40 transition-all hover:opacity-90 shadow-lg"
            >
              {isLoading ? (
                <span className="h-4 w-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
              ) : (
                <Layers className="h-4 w-4" strokeWidth={2} />
              )}
              {isLoading ? 'Analizando...' : 'Generar storyboard'}
            </motion.button>
          </div>
        </form>

        <StoryboardView
          scenes={scenes}
          isLoading={isLoading}
          skeletonCount={3}
          canConfirm
          onConfirm={() => {
            // Fase 3: trigger generateVisualDescriptionFlow per scene
            console.log('Estructura confirmada — lanzar generación de descripciones visuales')
          }}
        />
      </div>
    </div>
  )
}
