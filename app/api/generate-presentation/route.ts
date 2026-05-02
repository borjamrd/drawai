import { planPresentationFlow } from '@/lib/genkit/scene-flow'

export async function POST(request: Request) {
  const body = await request.json()
  const prompt: unknown = body?.prompt

  if (!prompt || typeof prompt !== 'string') {
    return Response.json({ error: 'prompt is required' }, { status: 400 })
  }

  try {
    const plan = await planPresentationFlow(prompt)
    return Response.json(plan)
  } catch {
    return Response.json({ error: 'Presentation planning failed. Try again.' }, { status: 500 })
  }
}
