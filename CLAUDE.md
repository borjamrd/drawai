# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## UI/UX rule

Before editing any file that affects the user interface or visual design — including files in `components/`, `app/` (pages, layouts), `styles/`, or any Tailwind/shadcn configuration — invoke `/design-taste-frontend` and apply its guidance to the changes.

## Commands

```bash
pnpm run dev      # Start dev server at localhost:3000
pnpm run build    # Production build
pnpm run lint     # ESLint
```

No test suite is configured yet.

## Environment

Requires `GOOGLE_GENAI_API_KEY` in `.env.local` to call Gemini via Genkit.

## Architecture

DrawAI is a Next.js 16 (App Router) app that generates animated educational scenes from natural-language prompts using AI.

**Request flow:**

1. User submits a text prompt in the UI
2. `lib/genkit/scene-flow.ts` — Genkit flow sends the prompt to Gemini 2.5 Flash, which returns a structured `Scene` JSON (title, duration, ordered list of `SceneElement`s)
3. Each `SceneElement` references a `library_id` from `lib/svg-library.ts`, plus position (x/y as % of canvas), scale, `entry_time_ms`, and `entry_effect`
4. `components/SceneCanvas.tsx` renders the scene on a fixed 800×450px canvas, revealing each element at its scheduled time using Framer Motion animations

**Key types** (defined in `lib/genkit/scene-flow.ts`):

- `Scene` — `{ title, duration_ms, elements: SceneElement[] }`
- `SceneElement` — `{ library_id, x, y, scale, entry_time_ms, entry_effect }`

**SVG asset library** (`lib/svg-library.ts`):

- Static registry of SVG assets served from `public/assets/`
- Exported as `SVG_LIBRARY` (array) and `SVG_LIBRARY_MAP` (keyed by id) — Genkit prompt uses the array to tell Gemini which IDs are valid; the canvas uses the map to resolve assets at render time
- Adding a new asset requires both a new entry in the registry and the corresponding file in `public/assets/`

**API routes** (`app/api/generate-scene/`, `app/api/assets/`) are empty stubs — not yet implemented.

## Stack

- **Next.js 16** (App Router) + **React 19** + **TypeScript**
- **Genkit 1.x** + **@genkit-ai/google-genai** (Gemini 2.5 Flash)
- **Tailwind CSS v4** + **shadcn/ui** (Radix UI primitives, `components/ui/`)
- **Framer Motion** for entry animations
- **Zod** for schema validation shared between AI output and TypeScript types
