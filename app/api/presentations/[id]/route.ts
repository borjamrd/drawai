import { db } from '@/lib/db/index'
import { presentations, scenePlans } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import type { Presentation } from '@/lib/presentation'

function buildPresentation(
  pres: typeof presentations.$inferSelect,
  scenes: (typeof scenePlans.$inferSelect)[],
): Presentation {
  return {
    id: pres.id,
    title: pres.title,
    input: pres.input,
    createdAt: pres.createdAt,
    updatedAt: pres.updatedAt,
    scenes: scenes
      .sort((a, b) => a.position - b.position)
      .map((s) => ({
        id: s.id,
        title: s.title,
        excerpt: s.excerpt,
        key_concepts: JSON.parse(s.keyConcepts),
        status: s.status as Presentation['scenes'][number]['status'],
        visual_description: s.visualDescription ?? undefined,
        scene: s.scene ? JSON.parse(s.scene) : undefined,
        missing_assets: s.missingAssets ? JSON.parse(s.missingAssets) : undefined,
        error_message: s.errorMessage ?? undefined,
      })),
  }
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const pres = db.select().from(presentations).where(eq(presentations.id, id)).get()
  if (!pres) return Response.json({ error: 'Not found' }, { status: 404 })

  const sceneRows = db.select().from(scenePlans).where(eq(scenePlans.presentationId, id)).all()
  return Response.json(buildPresentation(pres, sceneRows))
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = (await req.json()) as Presentation

  db.transaction((tx) => {
    tx.insert(presentations)
      .values({
        id: body.id,
        title: body.title,
        input: body.input,
        createdAt: body.createdAt,
        updatedAt: body.updatedAt,
      })
      .onConflictDoUpdate({
        target: presentations.id,
        set: {
          title: body.title,
          input: body.input,
          updatedAt: body.updatedAt,
        },
      })
      .run()

    tx.delete(scenePlans).where(eq(scenePlans.presentationId, id)).run()

    for (const [position, scene] of body.scenes.entries()) {
      tx.insert(scenePlans)
        .values({
          id: scene.id,
          presentationId: id,
          position,
          title: scene.title,
          excerpt: scene.excerpt,
          keyConcepts: JSON.stringify(scene.key_concepts),
          status: scene.status,
          visualDescription: scene.visual_description ?? null,
          scene: scene.scene ? JSON.stringify(scene.scene) : null,
          missingAssets: scene.missing_assets ? JSON.stringify(scene.missing_assets) : null,
          errorMessage: scene.error_message ?? null,
        })
        .run()
    }
  })

  return Response.json({ ok: true })
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  db.delete(presentations).where(eq(presentations.id, id)).run()
  return Response.json({ ok: true })
}
