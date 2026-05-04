import type { Presentation } from './presentation'

export async function loadPresentations(): Promise<Presentation[]> {
  const res = await fetch('/api/presentations')
  return res.ok ? res.json() : []
}

export async function loadPresentation(id: string): Promise<Presentation | null> {
  const res = await fetch(`/api/presentations/${id}`)
  return res.ok ? res.json() : null
}

export async function savePresentation(p: Presentation): Promise<void> {
  await fetch(`/api/presentations/${p.id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(p),
  })
}

export async function deletePresentation(id: string): Promise<void> {
  await fetch(`/api/presentations/${id}`, { method: 'DELETE' })
}
