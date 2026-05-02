'use client'

import { useState, useTransition } from 'react'
import { SvgAsset } from '@/lib/svg-library'
import { PlusSquare, X, Save, Trash2, Check, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { updateResource, deleteResource } from '@/app/recursos/crear-recurso/actions'
import { cn } from '@/lib/utils'

interface ResourceLibraryProps {
  initialAssets: SvgAsset[]
}

export function ResourceLibrary({ initialAssets }: ResourceLibraryProps) {
  const [assets, setAssets] = useState(initialAssets)
  const [selectedAsset, setSelectedAsset] = useState<SvgAsset | null>(null)
  const [isPending, startTransition] = useTransition()
  
  // Edit state
  const [editLabel, setEditLabel] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [hasSaved, setHasSaved] = useState(false)

  const handleSelect = (asset: SvgAsset) => {
    setSelectedAsset(asset)
    setEditLabel(asset.label)
    setEditDescription(asset.description)
    setHasSaved(false)
  }

  const handleSave = async () => {
    if (!selectedAsset) return
    setIsSaving(true)
    try {
      await updateResource(selectedAsset.id, editLabel, editDescription)
      setAssets(prev => prev.map(a => a.id === selectedAsset.id ? { ...a, label: editLabel, description: editDescription } : a))
      setHasSaved(true)
      setTimeout(() => setHasSaved(false), 2000)
    } catch (error) {
      console.error('Error saving resource:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!selectedAsset) return
    if (!confirm('¿Estás seguro de que quieres eliminar este recurso?')) return
    
    startTransition(async () => {
      try {
        await deleteResource(selectedAsset.id)
        setAssets(prev => prev.filter(a => a.id !== selectedAsset.id))
        setSelectedAsset(null)
      } catch (error) {
        console.error('Error deleting resource:', error)
      }
    })
  }

  return (
    <div className="relative flex h-full min-h-screen overflow-hidden bg-zinc-50 dark:bg-zinc-950">
      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="px-8 py-10 max-w-7xl mx-auto">
          <div className="flex items-start justify-between mb-10">
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-semibold tracking-tight text-zinc-950 dark:text-white">
                  Biblioteca
                </h1>
                <span className="rounded-full bg-zinc-100 dark:bg-zinc-800 px-2.5 py-0.5 text-xs font-medium text-zinc-600 dark:text-zinc-400 tabular-nums">
                  {assets.length}
                </span>
              </div>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
                Activos disponibles para la IA al componer escenas.
              </p>
            </div>

            <Link
              href="/recursos/crear-recurso"
              className="flex items-center gap-2 rounded-lg bg-zinc-950 dark:bg-white px-4 py-2 text-sm font-medium text-white dark:text-zinc-950 transition-opacity hover:opacity-80"
            >
              <PlusSquare className="h-4 w-4" strokeWidth={1.5} />
              Nuevo recurso
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-5 gap-y-8">
            {assets.map((asset) => (
              <button
                key={asset.id}
                onClick={() => handleSelect(asset)}
                className="group flex flex-col gap-2.5 text-left transition-all"
              >
                <div className={cn(
                  "aspect-square rounded-xl flex items-center justify-center p-6 transition-all duration-200 ease-out",
                  selectedAsset?.id === asset.id 
                    ? "bg-zinc-200 dark:bg-zinc-800 ring-2 ring-zinc-950 dark:ring-white" 
                    : "bg-zinc-100 dark:bg-zinc-800/60 group-hover:scale-[1.03] group-hover:bg-zinc-200/50 dark:group-hover:bg-zinc-800"
                )}>
                  <img
                    src={asset.svgPath}
                    alt={asset.label}
                    className="max-h-full max-w-full object-contain"
                  />
                </div>
                <div className="px-0.5 space-y-0.5">
                  <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200 leading-snug">
                    {asset.label}
                  </p>
                  <code className="text-[10px] text-zinc-400 dark:text-zinc-500 font-mono">
                    {asset.id}
                  </code>
                </div>
              </button>
            ))}
          </div>

          {assets.length === 0 && (
            <div className="flex flex-col items-center justify-center py-32 gap-3 text-zinc-400 dark:text-zinc-600">
              <PlusSquare className="h-8 w-8" strokeWidth={1.5} />
              <p className="text-sm">No hay activos en la biblioteca.</p>
              <Link
                href="/recursos/crear-recurso"
                className="text-sm text-zinc-950 dark:text-white underline underline-offset-4"
              >
                Añadir el primero
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Sidebar Overlay (Mobile) */}
      <AnimatePresence>
        {selectedAsset && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedAsset(null)}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 md:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <AnimatePresence>
        {selectedAsset && (
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed md:relative top-0 right-0 h-full w-[400px] max-w-[90vw] bg-white dark:bg-zinc-950 border-l border-zinc-200 dark:border-zinc-800 z-50 shadow-2xl md:shadow-none flex flex-col"
          >
            <div className="flex items-center justify-between p-4 border-b border-zinc-100 dark:border-zinc-800">
              <h2 className="text-sm font-semibold text-zinc-900 dark:text-white uppercase tracking-wider">
                Detalles del recurso
              </h2>
              <button
                onClick={() => setSelectedAsset(null)}
                className="p-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              >
                <X className="h-4 w-4 text-zinc-500" />
              </button>
            </div>

            <div className="flex-1 overflow-auto p-6 space-y-8">
              {/* Image Preview */}
              <div className="aspect-square rounded-xl bg-zinc-50 dark:bg-zinc-900/50 flex items-center justify-center p-12 border border-zinc-100 dark:border-zinc-800">
                <img
                  src={selectedAsset.svgPath}
                  alt={selectedAsset.label}
                  className="max-h-full max-w-full object-contain"
                />
              </div>

              {/* Form */}
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
                    ID (no editable)
                  </label>
                  <code className="block w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-900 rounded-md text-sm text-zinc-400 font-mono">
                    {selectedAsset.id}
                  </code>
                </div>

                <div className="space-y-2">
                  <label htmlFor="edit-label" className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
                    Título
                  </label>
                  <input
                    id="edit-label"
                    type="text"
                    value={editLabel}
                    onChange={(e) => setEditLabel(e.target.value)}
                    className="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-4 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-400 dark:focus:ring-zinc-600 transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="edit-desc" className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
                    Descripción
                  </label>
                  <textarea
                    id="edit-desc"
                    rows={4}
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    className="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-4 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-400 dark:focus:ring-zinc-600 transition-all resize-none"
                  />
                </div>
              </div>
            </div>

            <div className="p-4 bg-zinc-50/50 dark:bg-zinc-900/30 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
              <button
                onClick={handleDelete}
                disabled={isPending}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition-colors disabled:opacity-50"
              >
                {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                Eliminar
              </button>

              <button
                onClick={handleSave}
                disabled={isSaving || (editLabel === selectedAsset.label && editDescription === selectedAsset.description)}
                className={cn(
                  "flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all",
                  hasSaved 
                    ? "bg-emerald-500 text-white" 
                    : "bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 hover:opacity-80 disabled:opacity-40"
                )}
              >
                {isSaving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : hasSaved ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                {hasSaved ? 'Guardado' : 'Guardar cambios'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
