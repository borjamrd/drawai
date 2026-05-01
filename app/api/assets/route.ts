import { SVG_LIBRARY } from '@/lib/svg-library'

export async function GET() {
  return Response.json(SVG_LIBRARY)
}
