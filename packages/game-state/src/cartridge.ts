import type {
  CastSlotSessionState,
  ItemCastSlotDefinition,
  ItemInstanceCastRuntimeState,
  LevelAssignableAbilityEntry,
  LevelCastSlotGrant,
  ResolvedCastSlotDefinition,
  RestZone,
  SessionRestState,
} from './castSlotTypes.js'
import { buildAssignableAbilityPool, resolveCastSlotDefinitions } from './castSlots.js'
import type { AssignableAbilityPoolEntry } from './castSlotTypes.js'

export const CARTRIDGE_VERSION = 1

export interface CartridgeClassConfig {
  castSlotGrants: LevelCastSlotGrant[]
  assignableAbilityGrants: LevelAssignableAbilityEntry[]
}

export interface CartridgeTypeConfig {
  castSlotGrants: LevelCastSlotGrant[]
  assignableAbilityGrants: LevelAssignableAbilityEntry[]
}

export interface CartridgeCharacterCastPreview {
  slots: CastSlotSessionState['characterCastState'][string]['slots']
  elapsedMinutes: number
  rest: SessionRestState
  itemInstances: Record<string, ItemInstanceCastRuntimeState>
}

export interface CartridgeCharacterConfig {
  characterId: string
  lineageTypeId: string | null
  classTracks: Array<{ classId: string; level: number }>
  totalLevel: number
  castPreview: CartridgeCharacterCastPreview
}

/** Optional runtime payload exported alongside maps for Gameotter. */
export interface GameCartridge {
  version: typeof CARTRIDGE_VERSION
  mainCharacterId: string | null
  mapRestZones: Record<string, RestZone>
  items: ItemCastSlotDefinition[]
  classes: Record<string, CartridgeClassConfig>
  types: Record<string, CartridgeTypeConfig>
  characters: Record<string, CartridgeCharacterConfig>
}

export function createEmptyCartridge(): GameCartridge {
  return {
    version: CARTRIDGE_VERSION,
    mainCharacterId: null,
    mapRestZones: {},
    items: [],
    classes: {},
    types: {},
    characters: {},
  }
}

export function resolveDefinitionsForCartridgeCharacter(
  characterId: string,
  cartridge: GameCartridge,
): ResolvedCastSlotDefinition[] {
  const config = cartridge.characters[characterId]
  if (!config) return []

  const classGrantsByClassId = Object.fromEntries(
    config.classTracks
      .map((track) => {
        const classConfig = cartridge.classes[track.classId]
        return classConfig ? [track.classId, classConfig.castSlotGrants] : null
      })
      .filter((entry): entry is [string, LevelCastSlotGrant[]] => entry !== null),
  )

  const preview = config.castPreview
  const equippedItemInstances = Object.values(preview.itemInstances)
    .filter((instance) => !instance.destroyed && instance.ownerCharacterId === characterId)
    .map((instance) => ({
      instanceId: instance.instanceId,
      definitionId: instance.definitionId,
      ownerCharacterId: characterId,
    }))

  const equippedDefinitionIds = new Set(equippedItemInstances.map((entry) => entry.definitionId))
  const equippedItemDefinitions = cartridge.items.filter((entry) =>
    equippedDefinitionIds.has(entry.itemDefinitionId),
  )

  return resolveCastSlotDefinitions({
    characterId,
    lineageTypeId: config.lineageTypeId,
    classTracks: config.classTracks,
    totalLevel: config.totalLevel,
    characterGrants: [],
    typeGrants: config.lineageTypeId ? (cartridge.types[config.lineageTypeId]?.castSlotGrants ?? []) : [],
    classGrantsByClassId,
    equippedItemDefinitions,
    equippedItemInstances,
    abilityMetadata: {},
  })
}

export function buildAssignablePoolForCartridgeCharacter(
  characterId: string,
  cartridge: GameCartridge,
): AssignableAbilityPoolEntry[] {
  const config = cartridge.characters[characterId]
  if (!config) return []
  const entries: LevelAssignableAbilityEntry[] = []
  if (config.lineageTypeId && cartridge.types[config.lineageTypeId]) {
    entries.push(...cartridge.types[config.lineageTypeId]!.assignableAbilityGrants)
  }
  for (const track of config.classTracks) {
    const classConfig = cartridge.classes[track.classId]
    if (classConfig) entries.push(...classConfig.assignableAbilityGrants)
  }
  return buildAssignableAbilityPool(
    entries,
    config.totalLevel,
    config.classTracks,
    config.totalLevel,
  )
}

export function sessionFromCartridgePreview(
  characterId: string,
  preview: CartridgeCharacterCastPreview,
): CastSlotSessionState {
  return {
    elapsedMinutes: preview.elapsedMinutes,
    rest: preview.rest,
    characterCastState: {
      [characterId]: { characterId, slots: preview.slots },
    },
    itemInstances: { ...preview.itemInstances },
  }
}

export function normalizeGameCartridge(raw: unknown): GameCartridge | null {
  if (!raw || typeof raw !== 'object') return null
  const value = raw as Partial<GameCartridge>
  if (value.version !== CARTRIDGE_VERSION) return null
  return {
    version: CARTRIDGE_VERSION,
    mainCharacterId: typeof value.mainCharacterId === 'string' ? value.mainCharacterId : null,
    mapRestZones:
      value.mapRestZones && typeof value.mapRestZones === 'object'
        ? (value.mapRestZones as Record<string, RestZone>)
        : {},
    items: Array.isArray(value.items) ? value.items : [],
    classes:
      value.classes && typeof value.classes === 'object'
        ? (value.classes as Record<string, CartridgeClassConfig>)
        : {},
    types:
      value.types && typeof value.types === 'object'
        ? (value.types as Record<string, CartridgeTypeConfig>)
        : {},
    characters:
      value.characters && typeof value.characters === 'object'
        ? (value.characters as Record<string, CartridgeCharacterConfig>)
        : {},
  }
}
