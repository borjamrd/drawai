import { NextResponse } from 'next/server'
import { enrichPromptFlow } from '@/lib/genkit/scene-flow'

export async function POST(req: Request) {
  try {
    const { prompt } = await req.json()
    if (!prompt) return NextResponse.json({ error: 'Prompt required' }, { status: 400 })
    const enriched = await enrichPromptFlow(prompt)
    return NextResponse.json({ enriched })
  } catch (error) {
    console.error('Error enriching prompt:', error)
    return NextResponse.json({ error: 'Failed to enrich prompt' }, { status: 500 })
  }
}
