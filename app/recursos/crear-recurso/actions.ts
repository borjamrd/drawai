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
  const imageData = formData.get('imageData') as string

  if (!id || !label || !imageData) throw new Error('Campos incompletos')

  // 1. Save PNG file from base64
  const fileName = `${id}.png`
  const filePath = path.join(ASSETS_DIR, fileName)
  await fs.writeFile(filePath, Buffer.from(imageData, 'base64'))

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

export async function updateResource(id: string, label: string, description: string) {
  const rawData = await fs.readFile(JSON_PATH, 'utf8')
  const library: SvgAsset[] = JSON.parse(rawData)

  const index = library.findIndex(a => a.id === id)
  if (index === -1) throw new Error('Recurso no encontrado')

  library[index] = {
    ...library[index],
    label,
    description
  }

  await fs.writeFile(JSON_PATH, JSON.stringify(library, null, 2))
  revalidatePath('/recursos')
}

export async function deleteResource(id: string) {
  const rawData = await fs.readFile(JSON_PATH, 'utf8')
  const library: SvgAsset[] = JSON.parse(rawData)

  const index = library.findIndex(a => a.id === id)
  if (index === -1) throw new Error('Recurso no encontrado')

  const asset = library[index]
  
  // Remove from JSON
  library.splice(index, 1)
  await fs.writeFile(JSON_PATH, JSON.stringify(library, null, 2))

  // Optionally delete the file
  const fileName = path.basename(asset.svgPath)
  const filePath = path.join(ASSETS_DIR, fileName)
  try {
    await fs.unlink(filePath)
  } catch (e) {
    console.error('Error deleting file:', e)
  }

  revalidatePath('/recursos')
}
