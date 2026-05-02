import { NextResponse } from 'next/server'
import { generateSvgOptionsFlow } from '@/lib/genkit/scene-flow'

export async function POST(req: Request) {
  try {
    const { prompt } = await req.json()
    if (!prompt) return NextResponse.json({ error: 'Prompt is required' }, { status: 400 })
    
    const options = await generateSvgOptionsFlow(prompt)
    return NextResponse.json({ options })
  } catch (error) {
    console.error('Error generating SVG:', error)
    return NextResponse.json({ error: 'Failed to generate SVG' }, { status: 500 })
  }
}
