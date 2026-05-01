'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { SceneCanvas } from '@/components/SceneCanvas'
import type { Scene } from '@/lib/genkit/scene-flow'

export default function Home() {
  const [prompt, setPrompt] = useState('')
  const [scene, setScene] = useState<Scene | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

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
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col items-center py-16 px-8 gap-12">
      <header className="flex flex-col items-center gap-2 text-center">
        <h1 className="text-4xl font-bold tracking-tight">DrawAI</h1>
        <p className="text-zinc-500 text-lg">Describe una escena y la IA la animará para ti</p>
      </header>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3 w-full max-w-2xl">
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Ej: Muestra un soldado colonial que llega al territorio, coloca un mapa en el centro y una flecha que señala el norte…"
          className="w-full h-28 resize-none rounded-lg border border-zinc-200 bg-white dark:bg-zinc-900 dark:border-zinc-700 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400"
          disabled={isLoading}
        />
        <Button type="submit" disabled={isLoading} className="self-end gap-2">
          {isLoading && (
            <span className="size-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
          )}
          {isLoading ? 'Generando escena…' : 'Generar escena'}
        </Button>
      </form>

      {isLoading && (
        <div className="w-[800px] h-[450px] rounded-lg bg-zinc-200 dark:bg-zinc-800 animate-pulse flex items-center justify-center">
          <span className="text-zinc-400 text-sm">Dirigiendo la escena…</span>
        </div>
      )}

      {error && !isLoading && (
        <div className="w-full max-w-2xl rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 dark:bg-red-950/30 dark:border-red-800 dark:text-red-400">
          {error}
        </div>
      )}

      {scene && !isLoading && <SceneCanvas scene={scene} />}
    </div>
  )
}
