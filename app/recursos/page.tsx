import { getSvgLibrary } from '@/lib/svg-library'
import Link from 'next/link'
import { PlusSquare } from 'lucide-react'

export default function RecursosPage() {
  const assets = getSvgLibrary()

  return (
    <div className="min-h-[100dvh] px-8 py-10">
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
          <div key={asset.id} className="group flex flex-col gap-2.5">
            <div className="aspect-square rounded-xl bg-zinc-100 dark:bg-zinc-800/60 flex items-center justify-center p-6 transition-transform duration-200 ease-out group-hover:scale-[1.03]">
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
          </div>
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
  )
}
