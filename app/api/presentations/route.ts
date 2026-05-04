import { db } from '@/lib/db/index'
import { presentations, scenePlans } from '@/lib/db/schema'
import { desc, eq } from 'drizzle-orm'
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

export async function GET() {
  const presRows = db.select().from(presentations).orderBy(desc(presentations.updatedAt)).all()
  const result: Presentation[] = []

  for (const pres of presRows) {
    const sceneRows = db.select().from(scenePlans).where(eq(scenePlans.presentationId, pres.id)).all()
    result.push(buildPresentation(pres, sceneRows))
  }

  return Response.json(result)
}
