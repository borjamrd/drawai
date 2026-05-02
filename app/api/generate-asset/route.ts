import { writeFileSync, readFileSync } from 'fs'
import { join } from 'path'
import { generateImageOptionsFlow } from '@/lib/genkit/scene-flow'
import type { SvgAsset } from '@/lib/svg-library'

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
    // Generate image
    const [base64Data] = await generateImageOptionsFlow(prompt)

    // Derive asset ID and file paths
    const id = conceptToId(concept)
    const fileName = `${id}.png`
    const publicPath = join(process.cwd(), 'public', 'assets', fileName)
    const svgPath = `/assets/${fileName}`

    // Save PNG to public/assets/
    writeFileSync(publicPath, Buffer.from(base64Data, 'base64'))

    // Append to svg-library.json (read → modify → write)
    const jsonPath = join(process.cwd(), 'data', 'svg-library.json')
    const library = JSON.parse(readFileSync(jsonPath, 'utf8')) as SvgAsset[]

    // Skip if ID already exists (idempotent)
    if (!library.some((a) => a.id === id)) {
      library.push({
        id,
        label: concept,
        description: prompt,
        svgPath,
        default_width_pct: 20,
      })
      writeFileSync(jsonPath, JSON.stringify(library, null, 2))
    }

    return Response.json({ id, svgPath })
  } catch {
    return Response.json({ error: 'Asset generation failed. Try again.' }, { status: 500 })
  }
}
