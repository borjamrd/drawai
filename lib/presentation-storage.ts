import type { Presentation } from './presentation'

const STORAGE_KEY = 'drawai_presentations'
const MAX_PRESENTATIONS = 10

export function loadPresentations(): Presentation[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as Presentation[]) : []
  } catch {
    return []
  }
}

export function savePresentation(presentation: Presentation): void {
  if (typeof window === 'undefined') return
  const others = loadPresentations().filter((p) => p.id !== presentation.id)
  others.unshift(presentation)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(others.slice(0, MAX_PRESENTATIONS)))
}

export function deletePresentation(id: string): void {
  if (typeof window === 'undefined') return
  const presentations = loadPresentations().filter((p) => p.id !== id)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(presentations))
}
