import { generateVisualDescriptionFlow } from '@/lib/genkit/scene-flow'

export async function POST(request: Request) {
  const body = await request.json()
  const { title, excerpt, key_concepts } = body as {
    title?: unknown
    excerpt?: unknown
    key_concepts?: unknown
  }

  if (
    typeof title !== 'string' ||
    typeof excerpt !== 'string' ||
    !Array.isArray(key_concepts) ||
    key_concepts.some((c) => typeof c !== 'string')
  ) {
    return Response.json({ error: 'title, excerpt and key_concepts are required' }, { status: 400 })
  }

  try {
    const result = await generateVisualDescriptionFlow({
      title,
      excerpt,
      key_concepts: key_concepts as string[],
    })
    return Response.json(result)
  } catch {
    return Response.json({ error: 'Visual description generation failed. Try again.' }, { status: 500 })
  }
}
