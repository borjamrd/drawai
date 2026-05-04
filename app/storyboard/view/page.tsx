'use client'

import { useEffect, useState, startTransition } from 'react'
import { useSearchParams } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { StoryboardViewer } from '@/components/StoryboardViewer'
import { loadPresentation, loadPresentations } from '@/lib/presentation-api'
import type { Presentation } from '@/lib/presentation'

export default function StoryboardViewPage() {
  const searchParams = useSearchParams()
  const [presentation, setPresentation] = useState<Presentation | null>(null)

  useEffect(() => {
    async function load() {
      const id = searchParams.get('id')
      let pres: Presentation | null = null

      if (id) {
        pres = await loadPresentation(id)
      } else {
        const all = await loadPresentations()
        pres = all[0] ?? null
      }

      if (pres) {
        startTransition(() => {
          setPresentation(pres)
        })
      }
    }
    load()
  }, [searchParams])

  if (!presentation) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-white dark:bg-zinc-950">
        <div className="text-center space-y-3">
          <p className="text-sm text-zinc-500">No se encontró el storyboard.</p>
          <Link
            href="/storyboard"
            className="inline-flex items-center gap-2 text-xs font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Volver al editor
          </Link>
        </div>
      </div>
    )
  }

  const readyCount = presentation.scenes.filter((s) => s.status === 'ready' && s.scene).length
  const totalCount = presentation.scenes.length

  return (
    <div className="flex min-h-[100dvh] flex-col bg-white dark:bg-zinc-950">
      {/* Top bar */}
      <header className="flex items-center justify-between border-b border-zinc-100 px-6 py-3 dark:border-zinc-900">
        <div className="flex items-center gap-4">
          <Link
            href="/storyboard"
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-200 text-zinc-500 transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800"
          >
            <ArrowLeft className="h-4 w-4" strokeWidth={2} />
          </Link>
          <div>
            <h1 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              {presentation.title}
            </h1>
            <p className="text-[11px] text-zinc-400 dark:text-zinc-600">
              {readyCount} de {totalCount} escena{totalCount !== 1 ? 's' : ''} lista{readyCount !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
      </header>

      {/* Viewer */}
      <main className="flex-1 px-6 py-6">
        <StoryboardViewer scenes={presentation.scenes} title={presentation.title} />
      </main>
    </div>
  )
}
