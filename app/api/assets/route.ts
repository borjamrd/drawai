import { getSvgLibrary } from '@/lib/svg-library'

export async function GET() {
  return Response.json(getSvgLibrary())
}
