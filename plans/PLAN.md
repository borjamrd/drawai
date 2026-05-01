# DrawAI — Plan de Creación Iterativo y Modular

## Context

MVP de una app web donde el usuario escribe un prompt en lenguaje natural y obtiene una "escena animada" educativa. El LLM actúa como director: decide qué SVGs usar, dónde colocarlos (x/y en %), cuándo aparecen (ms) y con qué efecto de entrada. Framer Motion ejecuta las animaciones sobre un canvas relativo. No se genera vídeo real: es orquestación espaciotemporal de SVGs estáticos.

**Decisiones de arquitectura confirmadas:**
- SVG library escalable: el prompt del sistema se genera dinámicamente desde `SVG_LIBRARY` (no hardcodeado)
- Genkit fijado a `genkit@1` + `@genkit-ai/google-genai@1` (API 1.x: `genkit({ plugins })` → objeto `ai`)
- SVGs renderizados como `<img>` (no inline SVG)
- Botón "Reproducir de nuevo" en `SceneCanvas` (estado `playKey` para resetear timers)
- Canvas desktop-only, tamaño fijo 800×450px
- API key via `.env.local` servidor-only (`GOOGLE_GENAI_API_KEY`)
- `duration_ms` presente en schema pero ignorado por el canvas en MVP
- Errores: mensaje genérico en UI
- Efectos de entrada: 6 fijos (`fade`, `slide_left`, `slide_right`, `slide_up`, `zoom`, `bounce`)
- `scene.title` mostrado encima del canvas

**Stack:**
- Next.js 16.2.4 / React 19 (App Router)
- Tailwind v4 (CSS-first, sin `tailwind.config.js`) + shadcn/ui (preset Nova)
- TypeScript strict
- Genkit 1.x + `@genkit-ai/google-genai` → Gemini 2.5 Flash
- Framer Motion 12
- Zod 3

**Schema de datos:**
```ts
Scene {
  title: string
  duration_ms: number   // presente en schema, ignorado en MVP
  elements: Array<{
    library_id: string        // ID de SVG en la librería
    x: number                 // 0-100% del ancho del canvas
    y: number                 // 0-100% del alto del canvas
    scale: number             // 1.0 = tamaño original
    entry_time_ms: number     // ms desde inicio de la escena
    entry_effect: "fade" | "slide_left" | "slide_right" | "slide_up" | "zoom" | "bounce"
  }>
}
```

---

## ✅ Fase 1 — Setup & Scaffolding

Dependencias instaladas, shadcn inicializado (preset Nova, Tailwind v4), directorios creados, `.env.local` y `env.d.ts` creados.

**Notas de implementación:**
- `@genkit-ai/googleai` estaba deprecated → se instaló `@genkit-ai/google-genai@1` en su lugar
- shadcn init con `-b radix --template next` para evitar prompts interactivos
- Button creado automáticamente por el preset Nova en el init

---

## ✅ Fase 2 — Librería de Activos (Mocks)

**Archivos creados:**
- `lib/svg-library.ts` — tipo `SvgAsset`, array `SVG_LIBRARY` (5 entradas), mapa `SVG_LIBRARY_MAP`
- `app/api/assets/route.ts` — `GET` → `Response.json(SVG_LIBRARY)`
- `public/assets/*.svg` — 5 placeholders con formas geométricas y etiquetas de texto

**Activos disponibles:**
| ID | Label |
|---|---|
| `soldier_standing` | Soldado Colonial |
| `indigenous_figure` | Figura Indígena |
| `territory_map` | Mapa de Territorio |
| `colonial_flag` | Bandera Colonial |
| `directional_arrow` | Flecha Direccional |

**Para añadir un activo nuevo:** añadir entrada en `SVG_LIBRARY` + SVG en `public/assets/`. El prompt del LLM se actualiza automáticamente.

---

## ✅ Fase 3 — Motor de IA (Backend Genkit)

**Archivos creados:**
- `lib/genkit/scene-flow.ts` — schemas Zod + `buildSystemPrompt()` dinámico + `ai.defineFlow`
- `app/api/generate-scene/route.ts` — POST handler

**Notas de implementación:**
- API Genkit 1.x: `genkit({ plugins })` → objeto `ai`; `ai.defineFlow`; `response.output` (propiedad, no método)
- Modelo: `googleAI.model('gemini-2.5-flash')` (no 2.0-flash — deprecated en esta versión del plugin)
- Plugin lee `GOOGLE_GENAI_API_KEY` env var automáticamente
- `z` importado desde `genkit` (no del paquete zod separado) para coherencia con Genkit
- Runtime Node.js por defecto — NO añadir `export const runtime = 'edge'`

---

## ✅ Fase 4 — Canvas Renderer (Frontend)

**Archivos creados:**
- `components/SceneCanvas.tsx`

**Notas de implementación:**
- Outer `div` para posicionamiento (`absolute`, `left/top %`, `translate(-50%,-50%) scale(el.scale)`)
- Inner `motion.div` para animación — evita conflicto de transforms con Framer Motion
- `playKey` en `useEffect` deps → replay reinicia timers y re-monta elementos vía `key={playKey-i}`
- `TargetAndTransition` de framer-motion para tipar `ENTRY_VARIANTS` (no `object`)

---

## ✅ Fase 5 — Integración (UI + Wiring)

**Archivos modificados:**
- `app/page.tsx` — UI completa: header, form, skeleton, error callout, SceneCanvas
- `app/layout.tsx` — metadata actualizada

---

## 🛠 Fase 6 — Sidebar & Gestión de Recursos (Local)

**Objetivo:** Añadir navegación lateral y permitir la creación de recursos SVG desde la UI con persistencia en JSON local.

**Tareas:**
1. **Infraestructura de Datos**:
   - Crear `data/svg-library.json` con los datos actuales de `lib/svg-library.ts`.
   - Refactorizar `lib/svg-library.ts` para leer del JSON.
2. **Layout & Sidebar**:
   - Crear `components/Sidebar.tsx` con Lucide Icons.
   - Actualizar `app/layout.tsx` para integrar el sidebar.
3. **Biblioteca de Recursos (`/recursos`)**:
   - Crear grid de visualización de activos.
4. **Creador de Recursos (`/recursos/crear-recurso`)**:
   - Formulario de subida con Server Action para guardar `.svg` en `public/assets/` y actualizar el JSON.

---

## Verificación End-to-End

1. `npm run dev` → abrir `http://localhost:3000`
2. Asegurarse de que `.env.local` tiene `GOOGLE_GENAI_API_KEY` real
3. Escribir: *"Muestra un soldado colonial en el lado izquierdo, seguido de un mapa que aparece en el centro y una flecha que señala el territorio"*
4. Verificar que el canvas muestra el título y anima los SVGs en secuencia
5. Hacer clic en "Reproducir de nuevo" → animación reinicia desde cero
6. Enviar nuevo prompt → canvas se resetea limpiamente
7. `GET /api/assets` → devuelve los 5 SVGs
