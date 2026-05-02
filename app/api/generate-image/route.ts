import { generateImageOptionsFlow } from '@/lib/genkit/scene-flow'

export async function POST(request: Request) {
  const { prompt } = (await request.json()) as { prompt?: string }

  if (typeof prompt !== 'string' || !prompt.trim()) {
    return Response.json({ error: 'prompt is required' }, { status: 400 })
  }

  try {
    const options = await generateImageOptionsFlow(prompt)
    return Response.json({ options })
  } catch {
    return Response.json({ error: 'Image generation failed' }, { status: 500 })
  }
}
