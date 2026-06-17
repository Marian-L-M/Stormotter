import type { EntranceTarget, SpawnPointEntityKind } from '@otter/game-state'
import { createGameplayConditionGroup, type GameplayConditionGroup } from './gameplayConditionTypes'

export interface SpawnPointDraft {
  entityKind: SpawnPointEntityKind
  entityId: string | null
  entranceTarget: EntranceTarget
  conditions: GameplayConditionGroup
}

export function createDefaultSpawnPointDraft(mapId: string, layer: string): SpawnPointDraft {
  return {
    entityKind: 'character',
    entityId: null,
    entranceTarget: { mapId, x: 0, y: 0, layer },
    conditions: createGameplayConditionGroup('and'),
  }
}

export function spawnPointDraftIsReady(draft: SpawnPointDraft): boolean {
  if (draft.entityKind === 'entrance') return true
  return Boolean(draft.entityId)
}
