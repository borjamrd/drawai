'use client'

import { useState } from 'react'
import { createResource } from './actions'
import { Button } from '@/components/ui/button'

export default function CrearRecursoPage() {
  const [prompt, setPrompt] = useState('')
  const [options, setOptions] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedSvg, setSelectedSvg] = useState<string | null>(null)

  const handleGenerate = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/generate-asset', {
        method: 'POST',
        body: JSON.stringify({ prompt }),
      })
      const data = await res.json()
      setOptions(data.options || [])
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="py-12 px-8">
      <div className="max-w-2xl mx-auto space-y-8">
        <header>
          <h1 className="text-3xl font-bold">Nuevo Recurso AI</h1>
          <p className="text-zinc-500">Describe el recurso y la IA lo dibujará para ti.</p>
        </header>

        <div className="space-y-4">
           <div className="space-y-2">
            <label className="text-sm font-medium">Descripción para la IA (Prompt)</label>
            <div className="flex gap-2">
              <input 
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="ej: un soldado colonial, un mapa de américa, un barco..." 
                className="flex-1 rounded-md border border-zinc-200 px-3 py-2 text-sm dark:bg-zinc-950 dark:border-zinc-700" 
              />
              <Button onClick={handleGenerate} disabled={loading || !prompt}>
                {loading ? 'Generando...' : 'Dibujar'}
              </Button>
            </div>
          </div>

          {options.length > 0 && (
            <div className="grid grid-cols-3 gap-4">
              {options.map((svg, i) => (
                <div 
                  key={i}
                  onClick={() => setSelectedSvg(svg)}
                  className={`cursor-pointer p-4 border rounded-xl bg-white dark:bg-zinc-900 flex items-center justify-center aspect-square ${selectedSvg === svg ? 'border-blue-500 ring-2 ring-blue-500' : 'border-zinc-200 dark:border-zinc-800'}`}
                  dangerouslySetInnerHTML={{ __html: svg }}
                />
              ))}
            </div>
          )}
        </div>

        {selectedSvg && (
          <form action={createResource} className="space-y-6 bg-white p-8 rounded-xl border border-zinc-200 dark:bg-zinc-900 dark:border-zinc-800">
            <input type="hidden" name="svgCode" value={selectedSvg} />
            <div className="space-y-2">
              <label className="text-sm font-medium">ID único (slug)</label>
              <input name="id" required placeholder="ej: casa_colonial" className="w-full rounded-md border border-zinc-200 px-3 py-2 text-sm dark:bg-zinc-950 dark:border-zinc-700" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Nombre visible</label>
              <input name="label" required placeholder="ej: Casa Colonial" className="w-full rounded-md border border-zinc-200 px-3 py-2 text-sm dark:bg-zinc-950 dark:border-zinc-700" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Descripción</label>
              <textarea name="description" placeholder="Describe el elemento..." className="w-full h-24 rounded-md border border-zinc-200 px-3 py-2 text-sm dark:bg-zinc-950 dark:border-zinc-700" />
            </div>
            <Button type="submit" className="w-full">Guardar recurso</Button>
          </form>
        )}
      </div>
    </div>
  )
}
