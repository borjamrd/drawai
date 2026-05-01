# Sidebar & Local Resource Management Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Introduce a sidebar for navigation and a JSON-based local resource management system.

**Architecture:** Use a shared layout for the sidebar, a JSON file for metadata persistence, and Server Actions for asset management.

**Tech Stack:** Next.js 16, Lucide React, Tailwind CSS v4, fs/promises.

---

### Task 1: Data Infrastructure & JSON Migration

**Files:**
- Create: `data/svg-library.json`
- Modify: `lib/svg-library.ts`

- [ ] **Step 1: Create the initial JSON file**
Initialize with existing mock data.

```json
[
  {
    "id": "soldier_standing",
    "label": "Soldado Colonial",
    "description": "A standing colonial soldier in uniform, holding a rifle",
    "svgPath": "/assets/soldier_standing.svg"
  },
  {
    "id": "indigenous_figure",
    "label": "Figura Indígena",
    "description": "A standing indigenous person in traditional clothing",
    "svgPath": "/assets/indigenous_figure.svg"
  },
  {
    "id": "territory_map",
    "label": "Mapa de Territorio",
    "description": "A simple map outline showing a territory or region",
    "svgPath": "/assets/territory_map.svg"
  },
  {
    "id": "colonial_flag",
    "label": "Bandera Colonial",
    "description": "A flag on a pole representing a colonial power",
    "svgPath": "/assets/colonial_flag.svg"
  },
  {
    "id": "directional_arrow",
    "label": "Flecha Direccional",
    "description": "A bold arrow indicating movement or direction",
    "svgPath": "/assets/directional_arrow.svg"
  }
]
```

- [ ] **Step 2: Update `lib/svg-library.ts` to read from JSON**

```typescript
import fs from 'fs'
import path from 'path'

export type SvgAsset = {
  id: string
  label: string
  description: string
  svgPath: string
}

const JSON_PATH = path.join(process.cwd(), 'data', 'svg-library.json')

function getRawLibrary(): SvgAsset[] {
  try {
    const data = fs.readFileSync(JSON_PATH, 'utf8')
    return JSON.parse(data)
  } catch (e) {
    console.error('Error reading svg-library.json', e)
    return []
  }
}

export const SVG_LIBRARY: SvgAsset[] = getRawLibrary()

export const SVG_LIBRARY_MAP: Record<string, SvgAsset> = Object.fromEntries(
  SVG_LIBRARY.map((a) => [a.id, a])
)
```

- [ ] **Step 3: Commit**
`git add data/svg-library.json lib/svg-library.ts && git commit -m "data: migrate svg library to local JSON"`

---

### Task 2: Sidebar Component & Global Layout

**Files:**
- Create: `components/Sidebar.tsx`
- Modify: `app/layout.tsx`

- [ ] **Step 1: Create Sidebar component**

```tsx
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Library, PlusSquare } from 'lucide-react'
import { cn } from '@/lib/utils'

const navigation = [
  { name: 'Generador', href: '/', icon: LayoutDashboard },
  { name: 'Biblioteca', href: '/recursos', icon: Library },
  { name: 'Nuevo Recurso', href: '/recursos/crear-recurso', icon: PlusSquare },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <div className="flex h-full w-64 flex-col border-r border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
      <div className="flex h-16 items-center px-6">
        <span className="text-xl font-bold tracking-tight">DrawAI</span>
      </div>
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navigation.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'group flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-white'
                  : 'text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-white'
              )}
            >
              <item.icon className="mr-3 h-5 w-5 flex-shrink-0" aria-hidden="true" />
              {item.name}
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
```

- [ ] **Step 2: Update `app/layout.tsx`**

```tsx
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/Sidebar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "DrawAI",
  description: "Generate animated educational scenes from natural-language prompts",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex h-full bg-zinc-50 dark:bg-zinc-950">
        <Sidebar />
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </body>
    </html>
  );
}
```

- [ ] **Step 3: Commit**
`git add components/Sidebar.tsx app/layout.tsx && git commit -m "ui: add global sidebar layout"`

---

### Task 3: Resource Library Page (`/recursos`)

**Files:**
- Create: `app/recursos/page.tsx`

- [ ] **Step 1: Create the gallery page**

```tsx
import { SVG_LIBRARY } from '@/lib/svg-library'
import Image from 'next/image'

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
```

- [ ] **Step 2: Commit**
`git add app/recursos/page.tsx && git commit -m "feat: add resource library gallery"`

---

### Task 4: Resource Creation Form & Action

**Files:**
- Create: `app/recursos/crear-recurso/page.tsx`
- Create: `app/recursos/crear-recurso/actions.ts`

- [ ] **Step 1: Create Server Action for persistence**

```typescript
'use server'

import fs from 'fs/promises'
import path from 'path'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { SvgAsset } from '@/lib/svg-library'

const JSON_PATH = path.join(process.cwd(), 'data', 'svg-library.json')
const ASSETS_DIR = path.join(process.cwd(), 'public', 'assets')

export async function createResource(formData: FormData) {
  const id = formData.get('id') as string
  const label = formData.get('label') as string
  const description = formData.get('description') as string
  const file = formData.get('file') as File

  if (!id || !label || !file) throw new Error('Campos incompletos')

  // 1. Save SVG file
  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)
  const fileName = `${id}.svg`
  const filePath = path.join(ASSETS_DIR, fileName)
  await fs.writeFile(filePath, buffer)

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

- [ ] **Step 2: Create the form page**

```tsx
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
```

- [ ] **Step 3: Commit**
`git add app/recursos/crear-recurso/ && git commit -m "feat: add resource creation form and action"`
