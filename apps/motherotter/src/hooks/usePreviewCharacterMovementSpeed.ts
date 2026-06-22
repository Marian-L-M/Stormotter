import { useMemo } from 'react'
import { resolveDerivedStats } from '../admin/derivedStatResolver'
import type { CharacterClass } from '../admin/characterClassTypes'
import type { CharacterLineageType } from '../admin/lineageTypes'
import {
  DEFAULT_MOVEMENT_SPEED_FT,
  movementSpeedFtToCells,
  PREVIEW_DUMMY_MAIN_ID,
} from '../admin/mapPreviewUtils'
import type { AbilityDefinition, LevelAbilityBindingGrant } from '../admin/abilityTypes'
import type { AttributeDefinition, AttributeValue, LevelAttributeGrant } from '../admin/attributeTypes'
import type { Container } from '../admin/containerTypes'
import type { Item } from '../admin/itemTypes'
import type { CharacterMeta } from '../store/characterMetaStore'
import { useAbilitiesStore } from '../store/abilitiesStore'
import { useAttributesStore } from '../store/attributesStore'
import { useCharacterClassesStore } from '../store/characterClassesStore'
import { useCharacterMetaStore } from '../store/characterMetaStore'
import { useContainersStore } from '../store/containersStore'
import { useItemsStore } from '../store/itemsStore'
import { useLineageTypesStore } from '../store/lineageTypesStore'

export interface PreviewMovementSpeed {
  movementSpeedFt: number
  movementCellsPerRound: number
}

export function resolvePreviewMovementSpeedCells(input: {
  characterId: string
  meta: CharacterMeta | undefined
  lineageTypes: CharacterLineageType[]
  characterClasses: CharacterClass[]
  attributeDefinitions: AttributeDefinition[]
  entityValues: Record<string, Record<string, AttributeValue>>
  levelAttributeGrants: Record<string, LevelAttributeGrant[]>
  abilityDefinitions: AbilityDefinition[]
  levelAbilityGrants: Record<string, LevelAbilityBindingGrant[]>
  containers: Container[]
  items: Item[]
}): PreviewMovementSpeed {
  const { characterId, meta } = input
  if (!characterId || characterId === PREVIEW_DUMMY_MAIN_ID || !meta) {
    return {
      movementSpeedFt: DEFAULT_MOVEMENT_SPEED_FT,
      movementCellsPerRound: movementSpeedFtToCells(DEFAULT_MOVEMENT_SPEED_FT),
    }
  }

  const lineageType = input.lineageTypes.find((entry) => entry.id === meta.lineageTypeId)
  const characterClass = input.characterClasses.find((entry) => entry.id === meta.classId)
  const resolved = resolveDerivedStats({
    characterId,
    meta,
    lineageType,
    characterClass,
    characterClasses: input.characterClasses,
    attributeDefinitions: input.attributeDefinitions,
    entityValues: input.entityValues,
    levelAttributeGrants: input.levelAttributeGrants,
    abilityDefinitions: input.abilityDefinitions,
    levelAbilityGrants: input.levelAbilityGrants,
    containers: input.containers,
    items: input.items,
  })

  const movementSpeedFt = Math.max(0, resolved.stats.movement_speed.total)
  return {
    movementSpeedFt,
    movementCellsPerRound: movementSpeedFtToCells(movementSpeedFt),
  }
}

export function usePreviewCharacterMovementSpeed(characterId: string | null): PreviewMovementSpeed {
  const meta = useCharacterMetaStore((state) =>
    characterId ? state.metaByCharacterId[characterId] : undefined,
  )
  const lineageTypes = useLineageTypesStore((state) => state.lineageTypes)
  const characterClasses = useCharacterClassesStore((state) => state.characterClasses)
  const attributeDefinitions = useAttributesStore((state) => state.definitions)
  const entityValues = useAttributesStore((state) => state.entityValues)
  const levelAttributeGrants = useAttributesStore((state) => state.levelAttributeGrants)
  const abilityDefinitions = useAbilitiesStore((state) => state.definitions)
  const levelAbilityGrants = useAbilitiesStore((state) => state.levelAbilityGrants)
  const containers = useContainersStore((state) => state.containers)
  const items = useItemsStore((state) => state.items)

  return useMemo(
    () =>
      resolvePreviewMovementSpeedCells({
        characterId: characterId ?? '',
        meta,
        lineageTypes,
        characterClasses,
        attributeDefinitions,
        entityValues,
        levelAttributeGrants,
        abilityDefinitions,
        levelAbilityGrants,
        containers,
        items,
      }),
    [
      abilityDefinitions,
      attributeDefinitions,
      characterClasses,
      characterId,
      containers,
      entityValues,
      items,
      levelAbilityGrants,
      levelAttributeGrants,
      lineageTypes,
      meta,
    ],
  )
}

export function usePreviewPartyMovementSpeeds(
  memberIds: readonly string[],
): Record<string, PreviewMovementSpeed> {
  const metaByCharacterId = useCharacterMetaStore((state) => state.metaByCharacterId)
  const lineageTypes = useLineageTypesStore((state) => state.lineageTypes)
  const characterClasses = useCharacterClassesStore((state) => state.characterClasses)
  const attributeDefinitions = useAttributesStore((state) => state.definitions)
  const entityValues = useAttributesStore((state) => state.entityValues)
  const levelAttributeGrants = useAttributesStore((state) => state.levelAttributeGrants)
  const abilityDefinitions = useAbilitiesStore((state) => state.definitions)
  const levelAbilityGrants = useAbilitiesStore((state) => state.levelAbilityGrants)
  const containers = useContainersStore((state) => state.containers)
  const items = useItemsStore((state) => state.items)

  return useMemo(() => {
    const speeds: Record<string, PreviewMovementSpeed> = {}
    for (const characterId of memberIds) {
      speeds[characterId] = resolvePreviewMovementSpeedCells({
        characterId,
        meta: metaByCharacterId[characterId],
        lineageTypes,
        characterClasses,
        attributeDefinitions,
        entityValues,
        levelAttributeGrants,
        abilityDefinitions,
        levelAbilityGrants,
        containers,
        items,
      })
    }
    return speeds
  }, [
    abilityDefinitions,
    attributeDefinitions,
    characterClasses,
    containers,
    entityValues,
    items,
    levelAbilityGrants,
    levelAttributeGrants,
    lineageTypes,
    memberIds,
    metaByCharacterId,
  ])
}
