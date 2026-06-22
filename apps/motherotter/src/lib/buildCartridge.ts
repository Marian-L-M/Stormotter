import {
  CARTRIDGE_VERSION,
  type GameCartridge,
} from '@otter/game-state'
import { characterHasMainFlag, normalizeCharacterCategory } from '../admin/characterTypes'
import { itemToCastSlotDefinition } from '../admin/abilityCastSlotTypes'
import {
  syncCharacterCastPreviewState,
  resolveItemLocationsForCharacter,
} from '../admin/castSlotResolveUtils'
import { totalCharacterLevel } from '../admin/progressionTypes'
import type { EditorMapEntry } from './projectRepository'
import { useCharacterClassesStore } from '../store/characterClassesStore'
import { useCharacterMetaStore } from '../store/characterMetaStore'
import { useContentCatalogStore } from '../store/contentCatalogStore'
import { useContainersStore } from '../store/containersStore'
import { useItemsStore } from '../store/itemsStore'
import { useLineageTypesStore } from '../store/lineageTypesStore'

/** Build runtime cartridge payload from live editor stores for otterfile export. */
export function buildCartridgeFromStores(maps: EditorMapEntry[]): GameCartridge {
  const characters = useContentCatalogStore.getState().stubs.characters
  const metaByCharacterId = useCharacterMetaStore.getState().metaByCharacterId
  const characterClasses = useCharacterClassesStore.getState().characterClasses
  const lineageTypes = useLineageTypesStore.getState().lineageTypes
  const items = useItemsStore.getState().items
  const containers = useContainersStore.getState().containers

  const classById = Object.fromEntries(characterClasses.map((entry) => [entry.id, entry]))
  const typeById = Object.fromEntries(lineageTypes.map((entry) => [entry.id, entry]))

  const mainCharacter =
    characters.find((character) => {
      const meta = metaByCharacterId[character.id]
      if (!meta?.isMain) return false
      return characterHasMainFlag(normalizeCharacterCategory(character.category))
    }) ?? null

  const itemDefinitions = items
    .filter((item) => item.castSlots.length > 0 || item.consumable || item.maxItemCharges)
    .map((item) => itemToCastSlotDefinition(item))

  const classes = Object.fromEntries(
    characterClasses.map((entry) => [
      entry.id,
      {
        castSlotGrants: entry.castSlotGrants,
        assignableAbilityGrants: entry.assignableAbilityGrants,
      },
    ]),
  )

  const types = Object.fromEntries(
    lineageTypes.map((entry) => [
      entry.id,
      {
        castSlotGrants: entry.castSlotGrants,
        assignableAbilityGrants: entry.assignableAbilityGrants,
      },
    ]),
  )

  const characterConfigs: GameCartridge['characters'] = {}
  for (const character of characters) {
    const meta = metaByCharacterId[character.id]
    if (!meta || (!meta.isMain && !meta.isInGroup)) continue
    const lineageType = meta.lineageTypeId ? typeById[meta.lineageTypeId] : null
    const itemLocations = resolveItemLocationsForCharacter({
      characterId: character.id,
      meta,
      containers,
      items,
    })
    const preview = syncCharacterCastPreviewState(
      { characterId: character.id, meta, lineageType, classById, itemLocations },
      meta.castSlotPreview,
    )
    characterConfigs[character.id] = {
      characterId: character.id,
      lineageTypeId: meta.lineageTypeId,
      classTracks: meta.progression.classes.map((track) => ({
        classId: track.classId,
        level: track.level,
      })),
      totalLevel: totalCharacterLevel(meta.progression),
      castPreview: {
        slots: preview.slots,
        elapsedMinutes: preview.elapsedMinutes,
        rest: preview.rest,
        itemInstances: preview.itemInstances,
      },
    }
  }

  return {
    version: CARTRIDGE_VERSION,
    mainCharacterId: mainCharacter?.id ?? null,
    mapRestZones: Object.fromEntries(maps.map((map) => [map.id, map.restZone ?? 'none'])),
    items: itemDefinitions,
    classes,
    types,
    characters: characterConfigs,
  }
}
