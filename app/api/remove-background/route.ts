import { readFileSync, writeFileSync, existsSync } from 'fs'
import { join } from 'path'
import sharp from 'sharp'

export async function POST(request: Request) {
  const { id, svgPath } = (await request.json()) as { id?: string; svgPath?: string }

  if (typeof id !== 'string' || typeof svgPath !== 'string') {
    return Response.json({ error: 'id and svgPath are required' }, { status: 400 })
  }

  // Strip any query params (cache busters) and leading slash for safe join
  const cleanPath = svgPath.split('?')[0].replace(/^\//, '')
  const filePath = join(process.cwd(), 'public', cleanPath)

  if (!existsSync(filePath)) {
    return Response.json({ error: `File not found: ${cleanPath}` }, { status: 404 })
  }

  try {
    const original = readFileSync(filePath)
    const transparent = await sharp(original).unflatten().png().toBuffer()
    writeFileSync(filePath, transparent)

    return Response.json({ id, svgPath: `/${cleanPath}` })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('[remove-background] Error:', message)
    return Response.json({ error: `Background removal failed: ${message}` }, { status: 500 })
  }
}
