import type { ProjectContent } from './projectRecord'

/** Fields that represent authored project content (not editor UI chrome). */
export function hasProjectContentChanges(
  current: {
    gameId: string
    title: string
    mapId: string
    mapBackdropMediaId: string | null
    mediaMaxFileBytes: number
    mediaProjectSoftBudgetBytes: number
    world: unknown
    content: ProjectContent
  },
  previous: {
    gameId: string
    title: string
    mapId: string
    mapBackdropMediaId: string | null
    mediaMaxFileBytes: number
    mediaProjectSoftBudgetBytes: number
    world: unknown
    content: ProjectContent
  },
): boolean {
  return (
    current.gameId !== previous.gameId ||
    current.title !== previous.title ||
    current.mapId !== previous.mapId ||
    current.mapBackdropMediaId !== previous.mapBackdropMediaId ||
    current.mediaMaxFileBytes !== previous.mediaMaxFileBytes ||
    current.mediaProjectSoftBudgetBytes !== previous.mediaProjectSoftBudgetBytes ||
    current.world !== previous.world ||
    JSON.stringify(current.content) !== JSON.stringify(previous.content)
  )
}
