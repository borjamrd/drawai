import { writeFileSync } from 'fs'
import { join } from 'path'
import sharp from 'sharp'
import { generateImageOptionsFlow } from '@/lib/genkit/scene-flow'
import { db } from '@/lib/db/index'
import { assets } from '@/lib/db/schema'

function conceptToId(concept: string): string {
  return concept
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

export async function POST(request: Request) {
  const body = await request.json()
  const { concept, prompt } = body as { concept?: unknown; prompt?: unknown }

  if (typeof concept !== 'string' || typeof prompt !== 'string') {
    return Response.json({ error: 'concept and prompt are required' }, { status: 400 })
  }

  try {
    const [base64Data] = await generateImageOptionsFlow(prompt)

    const id = conceptToId(concept)
    const fileName = `${id}.png`
    const publicPath = join(process.cwd(), 'public', 'assets', fileName)
    const svgPath = `/assets/${fileName}`

    const rawBuffer = Buffer.from(base64Data, 'base64')
    const transparentBuffer = await sharp(rawBuffer).unflatten().png().toBuffer()
    writeFileSync(publicPath, transparentBuffer)

    db.insert(assets)
      .values({
        id,
        label: concept,
        description: prompt,
        svgPath,
        defaultWidthPct: 20,
      })
      .onConflictDoNothing()
      .run()

    return Response.json({ id, svgPath })
  } catch {
    return Response.json({ error: 'Asset generation failed. Try again.' }, { status: 500 })
  }
}
