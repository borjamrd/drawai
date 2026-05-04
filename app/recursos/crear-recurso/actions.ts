'use server'

import fs from 'fs/promises'
import path from 'path'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db/index'
import { assets } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

const ASSETS_DIR = path.join(process.cwd(), 'public', 'assets')

export async function createResource(formData: FormData) {
  const id = formData.get('id') as string
  const label = formData.get('label') as string
  const description = formData.get('description') as string
  const imageData = formData.get('imageData') as string

  if (!id || !label || !imageData) throw new Error('Campos incompletos')

  const existing = db.select().from(assets).where(eq(assets.id, id)).get()
  if (existing) throw new Error('El ID ya existe')

  const fileName = `${id}.png`
  const filePath = path.join(ASSETS_DIR, fileName)
  await fs.writeFile(filePath, Buffer.from(imageData, 'base64'))

  db.insert(assets)
    .values({
      id,
      label,
      description,
      svgPath: `/assets/${fileName}`,
      defaultWidthPct: 20,
    })
    .run()

  revalidatePath('/recursos')
  redirect('/recursos')
}

export async function updateResource(id: string, label: string, description: string) {
  const existing = db.select().from(assets).where(eq(assets.id, id)).get()
  if (!existing) throw new Error('Recurso no encontrado')

  db.update(assets).set({ label, description }).where(eq(assets.id, id)).run()

  revalidatePath('/recursos')
}

export async function deleteResource(id: string) {
  const existing = db.select().from(assets).where(eq(assets.id, id)).get()
  if (!existing) throw new Error('Recurso no encontrado')

  db.delete(assets).where(eq(assets.id, id)).run()

  const fileName = path.basename(existing.svgPath)
  const filePath = path.join(ASSETS_DIR, fileName)
  try {
    await fs.unlink(filePath)
  } catch (e) {
    console.error('Error deleting file:', e)
  }

  revalidatePath('/recursos')
}
