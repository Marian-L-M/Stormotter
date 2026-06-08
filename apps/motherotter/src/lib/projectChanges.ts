import type { ProjectContent } from './projectRecord'

/** Fields that represent authored project content (not editor UI chrome). */
export function hasProjectContentChanges(
  current: {
    gameId: string
    title: string
    mapId: string
    world: unknown
    content: ProjectContent
  },
  previous: {
    gameId: string
    title: string
    mapId: string
    world: unknown
    content: ProjectContent
  },
): boolean {
  return (
    current.gameId !== previous.gameId ||
    current.title !== previous.title ||
    current.mapId !== previous.mapId ||
    current.world !== previous.world ||
    JSON.stringify(current.content) !== JSON.stringify(previous.content)
  )
}
