# AI SVG Resource Generation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the manual SVG upload process in the "Crear Recurso" page with an AI-driven generation process that creates "hand-drawn" (handraw) style SVGs using Gemini and Genkit.

**Architecture:** A new Genkit flow will generate 3 SVG variants based on a prompt. A new API route will serve these variants to the frontend. The "Crear Recurso" page will be updated to allow the user to enter a prompt, pick a variant, and save it. The server action will be updated to save the raw SVG code as a file.

**Tech Stack:** Next.js, Genkit, Gemini 2.5 Flash, TypeScript, Tailwind CSS.

---

### Task 1: Add SVG Generation Flow to Genkit

**Files:**
- Modify: `lib/genkit/scene-flow.ts`

- [ ] **Step 1: Add `generateSvgOptionsFlow`**

```typescript
export const generateSvgOptionsFlow = ai.defineFlow(
  {
    name: 'generateSvgOptions',
    inputSchema: z.string(),
    outputSchema: z.array(z.string()),
  },
  async (prompt) => {
    const { output } = await ai.generate({
      prompt: `You are a professional minimalist illustrator specializing in "hand-drawn" (handraw) sketches.
Your style:
- Black and white only.
- Transparent background.
- Minimalist, single-stroke feel where possible.
- Irregular, slightly wobbly lines to look like a human drawing.
- Standard viewBox="0 0 100 100".
- Clean SVG code without comments or extra tags.

Generate 3 distinct visual variants for the user's prompt: ${prompt}.
Return ONLY a JSON array of 3 SVG strings.`,
      output: { schema: z.array(z.string()) },
    })
    return output!
  }
)
```

- [ ] **Step 2: Commit changes**

```bash
git add lib/genkit/scene-flow.ts
git commit -m "feat: add generateSvgOptionsFlow to Genkit"
```

### Task 2: Create API Route for SVG Generation

**Files:**
- Create: `app/api/generate-asset/route.ts`

- [ ] **Step 1: Implement the POST handler**

```typescript
import { NextResponse } from 'next/server'
import { generateSvgOptionsFlow } from '@/lib/genkit/scene-flow'

export async function POST(req: Request) {
  try {
    const { prompt } = await req.json()
    if (!prompt) return NextResponse.json({ error: 'Prompt is required' }, { status: 400 })
    
    const options = await generateSvgOptionsFlow(prompt)
    return NextResponse.json({ options })
  } catch (error) {
    console.error('Error generating SVG:', error)
    return NextResponse.json({ error: 'Failed to generate SVG' }, { status: 500 })
  }
}
```

- [ ] **Step 2: Commit changes**

```bash
git add app/api/generate-asset/route.ts
git commit -m "feat: add /api/generate-asset route"
```

### Task 3: Update Server Action to Accept SVG Code

**Files:**
- Modify: `app/recursos/crear-recurso/actions.ts`

- [ ] **Step 1: Update `createResource` to accept `svgCode`**

```typescript
export async function createResource(formData: FormData) {
  const id = formData.get('id') as string
  const label = formData.get('label') as string
  const description = formData.get('description') as string
  const svgCode = formData.get('svgCode') as string // Changed from 'file'

  if (!id || !label || !svgCode) throw new Error('Campos incompletos')

  // 1. Save SVG file from string
  const fileName = `${id}.svg`
  const filePath = path.join(ASSETS_DIR, fileName)
  await fs.writeFile(filePath, svgCode) // Write string directly

  // 2. Update JSON
  const rawData = await fs.readFile(JSON_PATH, 'utf8')
  const library: SvgAsset[] = JSON.parse(rawData)

  if (library.some(a => a.id === id)) throw new Error('El ID ya existe')

  const newAsset: SvgAsset = {
    id,
    label,
    description,
    svgPath: `/assets/${fileName}`
  }

  library.push(newAsset)
  await fs.writeFile(JSON_PATH, JSON.stringify(library, null, 2))

  revalidatePath('/recursos')
  redirect('/recursos')
}
```

- [ ] **Step 2: Commit changes**

```bash
git add app/recursos/crear-recurso/actions.ts
git commit -m "feat: update createResource to handle raw SVG code"
```

### Task 4: Update UI to Support AI Generation Flow

**Files:**
- Modify: `app/recursos/crear-recurso/page.tsx`

- [ ] **Step 1: Implement AI generation UI with preview and selection**

```tsx
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
```

- [ ] **Step 2: Commit changes**

```bash
git add app/recursos/crear-recurso/page.tsx
git commit -m "feat: implementation of AI SVG generation UI"
```
