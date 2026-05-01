import { createResource } from './actions'
import { Button } from '@/components/ui/button'

export default function CrearRecursoPage() {
  return (
    <div className="py-12 px-8">
      <div className="max-w-2xl mx-auto space-y-8">
        <header>
          <h1 className="text-3xl font-bold">Nuevo Recurso</h1>
          <p className="text-zinc-500">Sube un nuevo SVG a la biblioteca.</p>
        </header>

        <form action={createResource} className="space-y-6 bg-white p-8 rounded-xl border border-zinc-200 dark:bg-zinc-900 dark:border-zinc-800">
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
            <textarea name="description" placeholder="Describe el elemento para que la IA sepa cuándo usarlo..." className="w-full h-24 rounded-md border border-zinc-200 px-3 py-2 text-sm dark:bg-zinc-950 dark:border-zinc-700" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Archivo SVG</label>
            <input name="file" type="file" accept=".svg" required className="w-full text-sm" />
          </div>
          <Button type="submit" className="w-full">Guardar recurso</Button>
        </form>
      </div>
    </div>
  )
}
