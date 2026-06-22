import type { CastFromLocation } from '@otter/game-state'
import type { Item } from './itemTypes'
import type { Container } from './containerTypes'
import {
  CHARACTER_SLOT_DEFINITIONS,
  characterSlotDefinitionsByGroup,
} from './characterSlotTypes'
import { effectiveActiveHandSlot } from './slotRules'
import { itemToCastSlotDefinition } from './abilityCastSlotTypes'
import type { ItemCastSlotDefinition } from '@otter/game-state'

export type CharacterItemCastLocationKind = 'equipped' | 'quick' | 'inventory'

export interface CharacterItemCastLocation {
  instanceId: string
  definitionId: string
  item: Item
  location: CharacterItemCastLocationKind
  slotKey: string
  castFrom: CastFromLocation | null
}

function containerIdForSlot(
  containers: Container[],
  characterId: string,
  slotKey: string,
): string | undefined {
  return containers.find(
    (entry) =>
      entry.kind === 'character_slot' &&
      entry.characterId === characterId &&
      entry.slotKey === slotKey,
  )?.id
}

function firstItemInSlot(
  items: Item[],
  containerId: string | undefined,
): Item | undefined {
  if (!containerId) return undefined
  return items.find((entry) => entry.scope === 'unique' && entry.containerId === containerId)
}

function itemHasCastFeatures(item: Item): boolean {
  return (
    item.castSlots.length > 0 ||
    item.consumable !== null ||
    (item.maxItemCharges !== null && item.maxItemCharges > 0)
  )
}

/** Resolve equipped gear, quick-slot, and inventory items relevant to casting. */
export function getCharacterItemCastLocations(input: {
  characterId: string
  activeMainHandSlot: number
  activeOffHandSlot: number
  containers: Container[]
  items: Item[]
}): CharacterItemCastLocation[] {
  const { characterId, containers, items } = input
  const containerIdFor = (slotKey: string) => containerIdForSlot(containers, characterId, slotKey)

  const resolvedMainHand = effectiveActiveHandSlot(
    'equip:main_hand',
    4,
    input.activeMainHandSlot,
    items,
    containerIdFor,
  )
  const resolvedOffHand = effectiveActiveHandSlot(
    'equip:off_hand',
    2,
    input.activeOffHandSlot,
    items,
    containerIdFor,
  )

  const activeHandSlots = new Set([
    `equip:main_hand:${resolvedMainHand}`,
    `equip:off_hand:${resolvedOffHand}`,
  ])

  const locations: CharacterItemCastLocation[] = []
  const seen = new Set<string>()

  function addLocation(
    item: Item,
    slotKey: string,
    location: CharacterItemCastLocationKind,
    castFrom: CastFromLocation | null,
  ) {
    if (!itemHasCastFeatures(item)) return
    if (seen.has(item.id)) return
    seen.add(item.id)
    locations.push({
      instanceId: item.id,
      definitionId: item.id,
      item,
      location,
      slotKey,
      castFrom,
    })
  }

  const grouped = characterSlotDefinitionsByGroup()

  for (const definition of grouped.equipment) {
    const slotKey = definition.slotKey
    const isIndexedHand =
      slotKey.startsWith('equip:main_hand:') || slotKey.startsWith('equip:off_hand:')
    if (isIndexedHand && !activeHandSlots.has(slotKey)) continue

    const item = firstItemInSlot(items, containerIdFor(slotKey))
    if (item) addLocation(item, slotKey, 'equipped', null)
  }

  for (const definition of grouped.quick_bar) {
    const item = firstItemInSlot(items, containerIdFor(definition.slotKey))
    if (item) addLocation(item, definition.slotKey, 'quick', 'quick')
  }

  for (const definition of [...grouped.public_storage, ...grouped.hidden_storage]) {
    const item = firstItemInSlot(items, containerIdFor(definition.slotKey))
    if (item?.consumable?.castFrom.includes('inventory')) {
      addLocation(item, definition.slotKey, 'inventory', 'inventory')
    }
  }

  return locations
}

export function equippedItemCastLocations(
  locations: CharacterItemCastLocation[],
): CharacterItemCastLocation[] {
  return locations.filter((entry) => entry.location === 'equipped')
}

export function consumableItemCastLocations(
  locations: CharacterItemCastLocation[],
): CharacterItemCastLocation[] {
  return locations.filter((entry) => entry.item.consumable !== null)
}

export function buildEquippedItemDefinitions(
  locations: CharacterItemCastLocation[],
): ItemCastSlotDefinition[] {
  const byId = new Map<string, ItemCastSlotDefinition>()
  for (const entry of equippedItemCastLocations(locations)) {
    if (!byId.has(entry.definitionId)) {
      byId.set(entry.definitionId, itemToCastSlotDefinition(entry.item))
    }
  }
  return [...byId.values()]
}

export function buildEquippedItemInstances(
  locations: CharacterItemCastLocation[],
  characterId: string,
): Array<{ instanceId: string; definitionId: string; ownerCharacterId: string }> {
  return equippedItemCastLocations(locations).map((entry) => ({
    instanceId: entry.instanceId,
    definitionId: entry.definitionId,
    ownerCharacterId: characterId,
  }))
}

/** Slot keys that can hold cast-capable items (for UI hints). */
export const CAST_RELEVANT_SLOT_KEYS = CHARACTER_SLOT_DEFINITIONS.filter(
  (entry) =>
    entry.group === 'equipment' ||
    entry.group === 'quick_bar' ||
    entry.group === 'public_storage' ||
    entry.group === 'hidden_storage',
).map((entry) => entry.slotKey)
