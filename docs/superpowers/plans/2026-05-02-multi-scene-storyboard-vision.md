# DrawAI — Visión a largo plazo: Storyboard multi-escena

## Context

DrawAI actualmente genera una sola escena a partir de una descripción visual explícita. La visión es convertirlo en un sistema que tome un concepto complejo (ej: los primeros artículos de la Constitución española) y produzca automáticamente un storyboard educativo animado, con múltiples escenas coordinadas por agentes AI especializados.

El objetivo es que el sistema sea autónomo pero editable: el usuario puede intervenir en la estructura narrativa y en las descripciones visuales antes de que se generen las escenas finales.

---

## Decisiones de diseño

| Decisión | Elección |
|---|---|
| Formato de output | Storyboard editable (no video lineal) |
| Assets faltantes | Generación automática + aprobación para casos ambiguos |
| Paso intermedio | Agente de descripción visual explícito (B) |
| Niveles de edición V1 | Level 1 (estructura) + Level 2 (descripción visual) |
| Persistencia V1 | localStorage |
| Pipeline de generación | Progresivo por fases (estructura primero, escenas en paralelo) |
| Output del concept splitter | Título + extracto + conceptos clave (2-3) |
| Regeneración | Individual por escena, sin cascada |

---

## Data model

```typescript
// lib/presentation.ts

type Presentation = {
  id: string
  title: string
  input: string                    // input original del usuario
  scenes: ScenePlan[]
  createdAt: number
  updatedAt: number
}

type ScenePlanStatus =
  | 'pending'
  | 'generating_description'
  | 'awaiting_asset_approval'
  | 'generating_assets'
  | 'generating_scene'
  | 'ready'
  | 'error'

type ScenePlan = {
  id: string
  title: string
  excerpt: string                  // fragmento del input original
  key_concepts: string[]           // 2-3 conceptos clave (editables en Level 1)
  visual_description?: string      // output del agente visual (editable en Level 2)
  scene?: Scene                    // SceneElement[] final
  status: ScenePlanStatus
  missing_assets?: MissingAssetProposal[]
}

type MissingAssetProposal = {
  concept: string                  // qué concepto necesita representación
  suggested_prompt: string         // prompt sugerido para generar el asset
  approved: boolean
}
```

---

## Nuevos Genkit flows

### `planPresentationFlow` — concept splitter

**Input:** string (concepto complejo del usuario)  
**Output:** `{ title: string, scenes: Pick<ScenePlan, 'title' | 'excerpt' | 'key_concepts'>[] }`

- Recibe el input completo
- Divide en N escenas pedagógicamente coherentes
- Por cada escena: extrae título, fragmento relevante del input, y 2-3 conceptos clave
- N escenas recomendado: entre 2 y 6

### `generateVisualDescriptionFlow` — agente intermedio

**Input:** `{ title: string, excerpt: string, key_concepts: string[], available_assets: SvgAsset[] }`  
**Output:** `{ visual_description: string, missing_assets: MissingAssetProposal[] }`

- Recibe la lista de assets disponibles en la biblioteca
- Genera una descripción visual explícita orientada al `generateSceneFlow` existente
- Detecta qué conceptos no tienen representación en la biblioteca actual
- Para conceptos sin asset: propone un `suggested_prompt` para generación automática
- Un asset se marca como "ambiguo" (requiere aprobación) si el concepto es abstracto o polisémico

### Flows existentes que se reutilizan sin cambios

- `generateSceneFlow` — recibe `visual_description` → devuelve `Scene` (SceneElement[])
- `generateImageOptionsFlow` — recibe prompt → genera imagen para nuevos assets

---

## Arquitectura de agentes

```
Usuario input
      │
      ▼
planPresentationFlow          ← fase 1 (una sola llamada, rápida)
      │
      ▼
[ScenePlan[] con title + excerpt + key_concepts]
      │
   PAUSA — usuario edita Level 1 (estructura), confirma
      │
      ▼
generateVisualDescriptionFlow × N   ← fase 2, en paralelo
      │
      ├─ assets conocidos → generateSceneFlow inmediato
      └─ assets faltantes automáticos → generateImageOptionsFlow → addToLibrary → generateSceneFlow
                        └─ assets ambiguos → espera aprobación del usuario → mismo flujo
      │
      ▼
Storyboard completo renderizado
```

---

## Nuevas rutas API

```
POST /api/generate-presentation     → planPresentationFlow
POST /api/generate-visual-description → generateVisualDescriptionFlow
POST /api/generate-scene            → generateSceneFlow (ya existe como stub, completar)
POST /api/generate-asset            → generateImageOptionsFlow (ya existe como stub, completar)
```

---

## Componentes UI nuevos

### `PresentationInput` (`components/PresentationInput.tsx`)
- Textarea para input largo (concepto complejo)
- Reemplaza o extiende el prompt input actual de `app/page.tsx`
- Botón "Generar storyboard"

### `StoryboardView` (`components/StoryboardView.tsx`)
- Grid de `ScenePlanCard` con scroll horizontal
- Estado de carga global por fases
- Botón "Confirmar estructura" visible en fase 1

### `ScenePlanCard` (`components/ScenePlanCard.tsx`)
- Muestra: título, conceptos clave (editables inline), estado
- Fase 1: solo título y conceptos — botones para fusionar/dividir/reordenar escenas
- Fase 2: muestra `visual_description` con textarea editable + botón "Regenerar escena"
- Fase 3: miniatura del `SceneCanvas` con el resultado final

### `MissingAssetApproval` (`components/MissingAssetApproval.tsx`)
- Modal o panel lateral que aparece si hay `missing_assets` con `approved: false`
- Muestra concepto + prompt sugerido, permite editar prompt y aprobar
- "Aprobar todo" para el caso común

---

## Persistencia (localStorage)

```typescript
// lib/presentation-storage.ts
const STORAGE_KEY = 'drawai_presentations'

function savePresentations(presentations: Presentation[]): void
function loadPresentations(): Presentation[]
function savePresentation(p: Presentation): void
function deletePresentation(id: string): void
```

- Cada vez que un `ScenePlan` cambia de status → `savePresentation` automático
- Máximo recomendado en V1: 10 presentaciones almacenadas

---

## Fases de implementación V1

### Fase 1 — Data model + shell UI
- Crear `lib/presentation.ts` con types
- Crear `lib/presentation-storage.ts` con helpers localStorage
- Crear `StoryboardView` y `ScenePlanCard` con datos mock
- Nuevo `app/storyboard/page.tsx` o extender `app/page.tsx`

### Fase 2 — Concept splitter
- Implementar `planPresentationFlow` en `lib/genkit/scene-flow.ts`
- Completar stub `app/api/generate-presentation/route.ts` (crear)
- Conectar `PresentationInput` → API → `StoryboardView` con estructura editable
- Edición Level 1: conceptos clave editables inline, reordenar con drag

### Fase 3 — Generación progresiva de escenas
- Implementar `generateVisualDescriptionFlow`
- Completar stub `app/api/generate-scene/route.ts`
- Botón "Confirmar estructura" dispara generación en paralelo
- `ScenePlanCard` muestra progress states y `SceneCanvas` al completar

### Fase 4 — Gestión de assets faltantes
- Lógica de detección de assets faltantes en `generateVisualDescriptionFlow`
- Completar stub `app/api/generate-asset/route.ts`
- `MissingAssetApproval` component para casos ambiguos
- Auto-add de assets generados a `data/svg-library.json`

---

## Archivos críticos

| Archivo | Acción |
|---|---|
| `lib/genkit/scene-flow.ts` | Añadir `planPresentationFlow` y `generateVisualDescriptionFlow` |
| `lib/presentation.ts` | Crear — types del data model |
| `lib/presentation-storage.ts` | Crear — helpers localStorage |
| `app/page.tsx` | Extender con entrada de modo storyboard o redirigir a nueva ruta |
| `components/StoryboardView.tsx` | Crear |
| `components/ScenePlanCard.tsx` | Crear |
| `components/MissingAssetApproval.tsx` | Crear (Fase 4) |
| `app/api/generate-presentation/route.ts` | Crear |
| `app/api/generate-scene/route.ts` | Completar stub existente |
| `app/api/generate-asset/route.ts` | Completar stub existente |
| `data/svg-library.json` | Extensión automática vía API en Fase 4 |

---

## Verificación end-to-end

1. `pnpm run dev` → abrir `localhost:3000`
2. Introducir: *"Explica los tres primeros artículos de la Constitución española"*
3. Verificar fase 1: aparecen 3 `ScenePlanCard` con título, extracto y conceptos clave en <3s
4. Editar Level 1: renombrar "Artículo 2" → "La soberanía popular", confirmar
5. Pulsar "Confirmar estructura" → las 3 escenas pasan a `generating_description`
6. Verificar que assets faltantes (pueblo, poderes del Estado) disparan generación o modal
7. Verificar que cada `ScenePlanCard` muestra el `SceneCanvas` final al completar
8. Editar Level 2 de la Escena 1 → cambiar descripción visual → pulsar "Regenerar escena"
9. Verificar que solo la Escena 1 se regenera, las demás no cambian
10. Recargar página → verificar que el storyboard persiste desde localStorage
