import type { CharacterClass } from './characterClassTypes'
import type { CharacterLineageType } from './lineageTypes'
import type { CharacterMeta } from '../store/characterMetaStore'
import type { Item } from './itemTypes'
import type { LevelAssignableAbilityEntry } from './abilityCastSlotTypes'
import { itemToCastSlotDefinition } from './abilityCastSlotTypes'
import { totalCharacterLevel } from './progressionTypes'
import type {
  AbilitySlotMetadata,
  AssignableAbilityPoolEntry,
  ItemCastSlotDefinition,
  ItemInstanceCastRuntimeState,
  ResolveCastSlotsInput,
  ResolvedCastSlotDefinition,
} from '@otter/game-state'
import {
  buildAssignableAbilityPool,
  initializeItemInstanceState,
  mergeCharacterCastState,
  resolveCastSlotDefinitions,
} from '@otter/game-state'
import type { CharacterCastPreviewState } from './abilityCastSlotTypes'
import {
  buildEquippedItemDefinitions,
  buildEquippedItemInstances,
  getCharacterItemCastLocations,
  type CharacterItemCastLocation,
} from './characterInventoryCastUtils'

export interface CastSlotCharacterContext {
  characterId: string
  meta: CharacterMeta
  lineageType: CharacterLineageType | null | undefined
  classById: Record<string, CharacterClass>
  itemLocations?: CharacterItemCastLocation[]
}

export function resolveItemLocationsForCharacter(input: {
  characterId: string
  meta: CharacterMeta
  containers: import('./containerTypes').Container[]
  items: Item[]
}): CharacterItemCastLocation[] {
  return getCharacterItemCastLocations({
    characterId: input.characterId,
    activeMainHandSlot: input.meta.activeMainHandSlot,
    activeOffHandSlot: input.meta.activeOffHandSlot,
    containers: input.containers,
    items: input.items,
  })
}

export function mergedAssignableAbilityEntries(context: CastSlotCharacterContext): LevelAssignableAbilityEntry[] {
  const entries: LevelAssignableAbilityEntry[] = []
  if (context.lineageType) {
    entries.push(...context.lineageType.assignableAbilityGrants)
  }
  for (const track of context.meta.progression.classes) {
    const characterClass = context.classById[track.classId]
    if (characterClass) {
      entries.push(...characterClass.assignableAbilityGrants)
    }
  }
  return entries
}

export function buildResolveCastSlotsInput(context: CastSlotCharacterContext): ResolveCastSlotsInput {
  const totalLevel = totalCharacterLevel(context.meta.progression)
  const classGrantsByClassId = Object.fromEntries(
    context.meta.progression.classes
      .map((track) => {
        const characterClass = context.classById[track.classId]
        return characterClass ? [track.classId, characterClass.castSlotGrants] : null
      })
      .filter((entry): entry is [string, CharacterClass['castSlotGrants']] => entry !== null),
  )

  const itemLocations = context.itemLocations ?? []
  const equippedItemDefinitions = buildEquippedItemDefinitions(itemLocations)
  const equippedItemInstances = buildEquippedItemInstances(itemLocations, context.characterId)

  return {
    characterId: context.characterId,
    lineageTypeId: context.meta.lineageTypeId,
    classTracks: context.meta.progression.classes.map((track) => ({
      classId: track.classId,
      level: track.level,
    })),
    totalLevel,
    characterGrants: [],
    typeGrants: context.lineageType?.castSlotGrants ?? [],
    classGrantsByClassId,
    equippedItemDefinitions,
    equippedItemInstances,
    abilityMetadata: {},
  }
}

export function resolveCastSlotDefinitionsForCharacter(
  context: CastSlotCharacterContext,
): ResolvedCastSlotDefinition[] {
  return resolveCastSlotDefinitions(buildResolveCastSlotsInput(context))
}

export function buildAssignablePoolForCharacter(
  context: CastSlotCharacterContext,
): AssignableAbilityPoolEntry[] {
  const entries = mergedAssignableAbilityEntries(context)
  return buildAssignableAbilityPool(
    entries,
    totalCharacterLevel(context.meta.progression),
    context.meta.progression.classes,
    totalCharacterLevel(context.meta.progression),
  )
}

export function buildAbilityMetadataFromPool(
  pool: AssignableAbilityPoolEntry[],
): Record<string, AbilitySlotMetadata> {
  const metadata: Record<string, AbilitySlotMetadata> = {}
  for (const entry of pool) {
    metadata[entry.definitionId] = { slotCategories: entry.categories }
  }
  return metadata
}

export function classIdsForCharacter(context: CastSlotCharacterContext): string[] {
  return context.meta.progression.classes.map((track) => track.classId)
}

function mergeItemInstanceRuntime(
  existing: ItemInstanceCastRuntimeState | undefined,
  instanceId: string,
  definitionId: string,
  ownerCharacterId: string,
  itemDefinition: ItemCastSlotDefinition,
  slotDefinitions: ResolvedCastSlotDefinition[],
): ItemInstanceCastRuntimeState {
  const initialized = initializeItemInstanceState(
    instanceId,
    definitionId,
    ownerCharacterId,
    itemDefinition,
    slotDefinitions,
  )

  if (!existing || existing.destroyed) {
    return initialized
  }

  const previousSlots = new Map(existing.slots.map((entry) => [entry.slotId, entry]))
  return {
    ...initialized,
    itemChargesRemaining:
      existing.itemChargesRemaining !== null ? existing.itemChargesRemaining : initialized.itemChargesRemaining,
    slots: initialized.slots.map((slot) => {
      const previous = previousSlots.get(slot.slotId)
      if (!previous) return slot
      const definition = slotDefinitions.find((entry) => entry.slotId === slot.slotId)
      return {
        slotId: slot.slotId,
        assignedAbilityId: definition?.fixedAbilityId ?? previous.assignedAbilityId,
        usesRemaining: Math.min(previous.usesRemaining, slot.usesRemaining),
        hasBeenFilled: previous.hasBeenFilled || slot.hasBeenFilled,
      }
    }),
    destroyed: false,
  }
}

function syncItemInstancesForCharacter(
  context: CastSlotCharacterContext,
  preview: CharacterCastPreviewState | undefined,
  definitions: ResolvedCastSlotDefinition[],
): Record<string, ItemInstanceCastRuntimeState> {
  const locations = context.itemLocations ?? []
  const next: Record<string, ItemInstanceCastRuntimeState> = {}
  const activeInstanceIds = new Set(locations.map((entry) => entry.instanceId))

  for (const location of locations) {
    const itemDefinition = itemToCastSlotDefinition(location.item)
    const itemSlotDefinitions = definitions.filter(
      (entry) =>
        entry.owner.type === 'item' &&
        entry.owner.itemInstanceId === location.instanceId &&
        entry.owner.characterId === context.characterId,
    )
    next[location.instanceId] = mergeItemInstanceRuntime(
      preview?.itemInstances[location.instanceId],
      location.instanceId,
      location.definitionId,
      context.characterId,
      itemDefinition,
      itemSlotDefinitions,
    )
  }

  for (const [instanceId, existing] of Object.entries(preview?.itemInstances ?? {})) {
    if (activeInstanceIds.has(instanceId) || existing.destroyed) continue
    if (existing.ownerCharacterId !== context.characterId) continue
  }

  return next
}

export function syncCharacterCastPreviewState(
  context: CastSlotCharacterContext,
  preview: CharacterCastPreviewState | undefined,
): CharacterCastPreviewState {
  const definitions = resolveCastSlotDefinitionsForCharacter(context)
  const merged = mergeCharacterCastState(
    preview?.slots.length
      ? { characterId: context.characterId, slots: preview.slots }
      : undefined,
    definitions,
  )
  const itemInstances = syncItemInstancesForCharacter(context, preview, definitions)
  return {
    slots: merged.slots,
    elapsedMinutes: preview?.elapsedMinutes ?? 0,
    rest: preview?.rest ?? { lastCombatEndedAtMs: null, isInCombat: false },
    itemInstances,
  }
}

export function slotDefinitionById(
  definitions: ResolvedCastSlotDefinition[],
  slotId: string,
): ResolvedCastSlotDefinition | undefined {
  return definitions.find((entry) => entry.slotId === slotId)
}

export function runtimeEntryForSlot(
  preview: CharacterCastPreviewState,
  slotId: string,
) {
  return preview.slots.find((entry) => entry.slotId === slotId)
}
