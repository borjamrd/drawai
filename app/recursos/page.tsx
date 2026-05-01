import { SVG_LIBRARY } from '@/lib/svg-library'

export default function RecursosPage() {
  return (
    <div className="py-12 px-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <header>
          <h1 className="text-3xl font-bold">Biblioteca de Recursos</h1>
          <p className="text-zinc-500">Visualiza y gestiona los activos disponibles para la IA.</p>
        </header>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {SVG_LIBRARY.map((asset) => (
            <div key={asset.id} className="group rounded-xl border border-zinc-200 bg-white p-4 transition-all hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900">
              <div className="aspect-square relative mb-4 rounded-lg bg-zinc-50 flex items-center justify-center p-6 dark:bg-zinc-950">
                <img src={asset.svgPath} alt={asset.label} className="max-h-full max-w-full object-contain" />
              </div>
              <h3 className="font-semibold text-sm">{asset.label}</h3>
              <code className="text-[10px] text-zinc-400 block mb-2">{asset.id}</code>
              <p className="text-xs text-zinc-500 line-clamp-2">{asset.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
