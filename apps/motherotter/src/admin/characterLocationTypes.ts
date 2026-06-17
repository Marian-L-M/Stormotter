import type { EntranceTarget } from '@otter/game-state'
import {
  createGameplayConditionGroup,
  normalizeGameplayConditionGroup,
  type GameplayConditionGroup,
} from './gameplayConditionTypes'

export type MapCellReference = EntranceTarget

export interface CharacterLocationRule {
  id: string
  location: MapCellReference
  /** When null, the rule always applies. */
  conditions: GameplayConditionGroup | null
}

export function createCharacterLocationRuleId(): string {
  return `char-loc-${crypto.randomUUID().slice(0, 8)}`
}

export function createEmptyMapCellReference(mapId: string, layer: string): MapCellReference {
  return { mapId, x: 0, y: 0, layer }
}

export function createCharacterLocationRule(mapId: string, layer: string): CharacterLocationRule {
  return {
    id: createCharacterLocationRuleId(),
    location: createEmptyMapCellReference(mapId, layer),
    conditions: createGameplayConditionGroup('and'),
  }
}

export function normalizeMapCellReference(raw: Partial<MapCellReference> | null | undefined): MapCellReference | null {
  if (!raw || typeof raw.mapId !== 'string' || !raw.mapId.trim()) return null
  return {
    mapId: raw.mapId.trim(),
    x: typeof raw.x === 'number' && Number.isFinite(raw.x) ? Math.max(0, Math.floor(raw.x)) : 0,
    y: typeof raw.y === 'number' && Number.isFinite(raw.y) ? Math.max(0, Math.floor(raw.y)) : 0,
    layer: typeof raw.layer === 'string' && raw.layer.trim() ? raw.layer.trim() : 'ground',
  }
}

export function normalizeCharacterLocationRules(raw: unknown): CharacterLocationRule[] {
  if (!Array.isArray(raw)) return []
  return raw
    .map((entry) => {
      if (!entry || typeof entry !== 'object') return null
      const rule = entry as Partial<CharacterLocationRule>
      const location = normalizeMapCellReference(rule.location)
      if (!location) return null
      return {
        id: rule.id ?? createCharacterLocationRuleId(),
        location,
        conditions: rule.conditions ? normalizeGameplayConditionGroup(rule.conditions) : null,
      }
    })
    .filter((entry): entry is CharacterLocationRule => entry !== null)
}

export function formatMapCellReference(reference: MapCellReference): string {
  return `${reference.mapId} · x${reference.x + 1}, y${reference.y + 1} · ${reference.layer}`
}
