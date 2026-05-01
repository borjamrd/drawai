import { generateSceneFlow } from '@/lib/genkit/scene-flow'

export async function POST(request: Request) {
  const body = await request.json()
  const prompt: unknown = body?.prompt

  if (!prompt || typeof prompt !== 'string') {
    return Response.json({ error: 'prompt is required' }, { status: 400 })
  }

  try {
    const scene = await generateSceneFlow(prompt)
    return Response.json(scene)
  } catch {
    return Response.json({ error: 'Scene generation failed. Try again.' }, { status: 500 })
  }
}
