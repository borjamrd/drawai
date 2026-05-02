'use server'

import fs from 'fs/promises'
import path from 'path'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { SvgAsset } from '@/lib/svg-library'

const JSON_PATH = path.join(process.cwd(), 'data', 'svg-library.json')
const ASSETS_DIR = path.join(process.cwd(), 'public', 'assets')

export async function createResource(formData: FormData) {
  const id = formData.get('id') as string
  const label = formData.get('label') as string
  const description = formData.get('description') as string
  const svgCode = formData.get('svgCode') as string

  if (!id || !label || !svgCode) throw new Error('Campos incompletos')

  // 1. Save SVG file from string
  const fileName = `${id}.svg`
  const filePath = path.join(ASSETS_DIR, fileName)
  await fs.writeFile(filePath, svgCode)

  // 2. Update JSON
  const rawData = await fs.readFile(JSON_PATH, 'utf8')
  const library: SvgAsset[] = JSON.parse(rawData)

  if (library.some(a => a.id === id)) throw new Error('El ID ya existe')

  const newAsset: SvgAsset = {
    id,
    label,
    description,
    svgPath: `/assets/${fileName}`
  }

  library.push(newAsset)
  await fs.writeFile(JSON_PATH, JSON.stringify(library, null, 2))

  revalidatePath('/recursos')
  redirect('/recursos')
}
