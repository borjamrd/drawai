import { NextResponse } from 'next/server'
import { generateImageOptionsFlow } from '@/lib/genkit/scene-flow'

export async function POST(req: Request) {
  try {
    const { prompt } = await req.json()
    if (!prompt) return NextResponse.json({ error: 'Prompt is required' }, { status: 400 })

    const options = await generateImageOptionsFlow(prompt)
    return NextResponse.json({ options })
  } catch (error) {
    console.error('Error generating image:', error)
    return NextResponse.json({ error: 'Failed to generate image' }, { status: 500 })
  }
}
