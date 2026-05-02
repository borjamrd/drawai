import type { Scene } from '@/lib/genkit/scene-flow'

export type ScenePlanStatus =
  | 'pending'
  | 'generating_description'
  | 'awaiting_asset_approval'
  | 'generating_assets'
  | 'generating_scene'
  | 'ready'
  | 'error'

export type MissingAssetProposal = {
  concept: string
  suggested_prompt: string
  approved: boolean
}

export type ScenePlan = {
  id: string
  title: string
  excerpt: string
  key_concepts: string[]
  visual_description?: string
  scene?: Scene
  status: ScenePlanStatus
  missing_assets?: MissingAssetProposal[]
  error_message?: string
}

export type Presentation = {
  id: string
  title: string
  input: string
  scenes: ScenePlan[]
  createdAt: number
  updatedAt: number
}
