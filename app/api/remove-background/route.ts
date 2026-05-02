import { readFileSync, writeFileSync } from 'fs'
import { join } from 'path'
import sharp from 'sharp'

export async function POST(request: Request) {
  const { id, svgPath } = (await request.json()) as { id?: string; svgPath?: string }

  if (typeof id !== 'string' || typeof svgPath !== 'string') {
    return Response.json({ error: 'id and svgPath are required' }, { status: 400 })
  }

  const filePath = join(process.cwd(), 'public', svgPath)

  try {
    const original = readFileSync(filePath)
    const transparent = await sharp(original).unflatten().png().toBuffer()
    writeFileSync(filePath, transparent)

    return Response.json({ id, svgPath })
  } catch {
    return Response.json({ error: 'Background removal failed' }, { status: 500 })
  }
}
