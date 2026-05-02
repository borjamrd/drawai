'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowRight, Film, Grid3X3 } from 'lucide-react'
import { SceneCanvas } from '@/components/SceneCanvas'
import type { Scene } from '@/lib/genkit/scene-flow'

export default function Home() {
  const [prompt, setPrompt] = useState('')
  const [scene, setScene] = useState<Scene | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showGrid, setShowGrid] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!prompt.trim()) return
    setIsLoading(true)
    setError(null)
    setScene(null)
    try {
      const res = await fetch('/api/generate-scene', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data: Scene = await res.json()
      setScene(data)
    } catch {
      setError('Algo salió mal, inténtalo de nuevo.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex flex-col md:flex-row min-h-[100dvh]">
      {/* Left panel: controls */}
      <div className="w-full md:w-[380px] shrink-0 flex flex-col gap-10 px-8 py-10 bg-white dark:bg-zinc-950 border-b md:border-b-0 md:border-r border-zinc-200 dark:border-zinc-800">
        <div className="space-y-1.5">
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-950 dark:text-white">
            Generador
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed max-w-[52ch]">
            Describe una escena y la IA la animará con los elementos de tu biblioteca.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <label
              htmlFor="prompt"
              className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
            >
              Descripción de la escena
            </label>
            <textarea
              id="prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Ej: Un soldado colonial llega al territorio, coloca un mapa en el centro y una flecha señala el norte…"
              className="h-40 resize-none rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-4 py-3 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-400 dark:focus:ring-zinc-600 transition-shadow"
              disabled={isLoading}
            />
            {error && (
              <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
            )}
          </div>

          <motion.button
            type="submit"
            disabled={isLoading || !prompt.trim()}
            whileTap={{ scale: 0.97, y: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            className="flex items-center gap-2 self-start rounded-lg bg-zinc-950 dark:bg-white px-5 py-2.5 text-sm font-medium text-white dark:text-zinc-950 disabled:opacity-40 transition-opacity"
          >
            {isLoading ? (
              <span className="h-4 w-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
            ) : (
              <ArrowRight className="h-4 w-4" />
            )}
            {isLoading ? 'Generando…' : 'Generar escena'}
          </motion.button>
        </form>

        <div className="flex flex-col gap-2">
          <p className="text-xs font-medium uppercase tracking-widest text-zinc-400 dark:text-zinc-600">
            Vista
          </p>
          <motion.button
            type="button"
            onClick={() => setShowGrid((g) => !g)}
            whileTap={{ scale: 0.97, y: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            className={`flex items-center gap-2 self-start rounded-lg px-4 py-2 text-sm font-medium border transition-colors ${
              showGrid
                ? 'bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 border-transparent'
                : 'text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800'
            }`}
          >
            <Grid3X3 className="h-4 w-4" strokeWidth={1.5} />
            Cuadrícula
          </motion.button>
        </div>
      </div>

      {/* Right panel: canvas output */}
      <div className="flex-1 flex items-center justify-center p-8 md:p-12 bg-white dark:bg-zinc-900 overflow-auto">
        <AnimatePresence mode="wait">
          {isLoading && (
            <motion.div
              key="skeleton"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col gap-3"
            >
              <div className="w-[800px] h-[450px] rounded-xl bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
              <div className="h-3.5 w-40 rounded-md bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
            </motion.div>
          )}

          {scene && !isLoading && (
            <motion.div
              key="scene"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ type: 'spring', stiffness: 100, damping: 20 }}
            >
              <SceneCanvas scene={scene} showGrid={showGrid} />
            </motion.div>
          )}

          {!scene && !isLoading && (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              <div className="w-[800px] h-[450px] rounded-xl border-2 border-dashed border-zinc-200 dark:border-zinc-700 flex flex-col items-center justify-center gap-3 text-zinc-400 dark:text-zinc-600">
                <Film className="h-8 w-8" strokeWidth={1.5} />
                <p className="text-sm">Tu escena animada aparecerá aquí</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
