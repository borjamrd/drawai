import { getSvgLibrary } from '@/lib/svg-library'
import { ResourceLibrary } from '@/components/ResourceLibrary'

export default function RecursosPage() {
  const assets = getSvgLibrary()

  return <ResourceLibrary initialAssets={assets} />
}
