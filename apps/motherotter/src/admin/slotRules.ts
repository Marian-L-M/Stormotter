import {
  CHARACTER_SLOT_DEFINITIONS,
  getCharacterSlotDefinition,
  migrateLegacyCharacterSlotKey,
  type CharacterSlotDefinition,
} from './characterSlotTypes'
import type { CharacterClass } from './characterClassTypes'
import type { CharacterLineageType } from './lineageTypes'

export type SlotRuleValue = boolean | null

export interface SlotRulesMap {
  [slotKeyOrType: string]: SlotRuleValue
}

export interface ItemSlotPlacementSettings {
  allowedSlotTypes: string[] | null
}

export const PLACEMENT_SLOT_TYPES: { id: string; label: string }[] = [
  { id: 'equip:main_hand', label: 'Main hand' },
  { id: 'equip:off_hand', label: 'Off hand' },
  { id: 'equip:body', label: 'Body armor' },
  { id: 'equip:head', label: 'Head' },
  { id: 'equip:hands', label: 'Hands' },
  { id: 'equip:feet', label: 'Feet' },
  { id: 'equip:belt', label: 'Belt' },
  { id: 'equip:cape', label: 'Cape' },
  { id: 'equip:necklace', label: 'Necklace' },
  { id: 'equip:ring_1', label: 'Ring 1' },
  { id: 'equip:ring_2', label: 'Ring 2' },
  { id: 'quick', label: 'Quick slots' },
  { id: 'quiver', label: 'Quiver' },
]

const PLACEMENT_SLOT_TYPE_IDS = PLACEMENT_SLOT_TYPES.map((entry) => entry.id)

export { isInventoryStorageSlotKey } from './characterSlotTypes'

export function getSlotTypeKey(slotKey: string): string {
  const migrated = migrateLegacyCharacterSlotKey(slotKey) ?? slotKey
  if (migrated.startsWith('equip:main_hand:')) return 'equip:main_hand'
  if (migrated.startsWith('equip:off_hand:')) return 'equip:off_hand'
  if (migrated.startsWith('quick:')) return 'quick'
  if (migrated.startsWith('quiver:')) return 'quiver'
  return migrated
}

export function slotKeyMatchesType(slotKey: string, slotType: string): boolean {
  return getSlotTypeKey(slotKey) === slotType
}

export function normalizeSlotRules(raw: SlotRulesMap | null | undefined): SlotRulesMap {
  if (!raw) return {}
  const next: SlotRulesMap = {}
  for (const [key, value] of Object.entries(raw)) {
    if (value !== true && value !== false && value !== null) continue
    const migrated = migrateLegacyCharacterSlotKey(key) ?? key
    next[migrated] = value
  }
  return next
}

export function resolveSlotRule(
  slotKey: string,
  classRules: SlotRulesMap,
  typeRules: SlotRulesMap,
  characterRules: SlotRulesMap,
): boolean {
  const candidates = [slotKey, getSlotTypeKey(slotKey)]
  for (const rules of [characterRules, typeRules, classRules]) {
    for (const candidate of candidates) {
      const value = rules[candidate]
      if (value === true || value === false) return value
    }
  }
  return true
}

export function resolveHiddenInventoryActivatesUnequipped(
  classValue: boolean | null | undefined,
  typeValue: boolean | null | undefined,
  characterValue: boolean | null | undefined,
): boolean {
  if (characterValue !== null && characterValue !== undefined) return characterValue
  if (typeValue !== null && typeValue !== undefined) return typeValue
  if (classValue !== null && classValue !== undefined) return classValue
  return false
}

export function normalizeAllowedSlotTypes(raw: string[] | null | undefined): string[] | null {
  if (!raw || raw.length === 0) return null
  const normalized = raw
    .map((entry) => migrateLegacyCharacterSlotKey(entry) ?? entry)
    .map((entry) => getSlotTypeKey(entry))
    .filter((entry) => PLACEMENT_SLOT_TYPE_IDS.includes(entry))
  return normalized.length > 0 ? [...new Set(normalized)] : null
}

export function resolveCharacterSlotEnabled(
  slotKey: string,
  lineageType: CharacterLineageType | null | undefined,
  characterClass: CharacterClass | null | undefined,
  characterRules: SlotRulesMap,
): boolean {
  return resolveSlotRule(
    slotKey,
    normalizeSlotRules(characterClass?.slotRules),
    normalizeSlotRules(lineageType?.slotRules),
    normalizeSlotRules(characterRules),
  )
}

export function slotRuleOptions(): CharacterSlotDefinition[] {
  return CHARACTER_SLOT_DEFINITIONS.filter((entry) => entry.group !== 'public_storage' && entry.group !== 'hidden_storage')
}

export function findFirstFilledHandSlot(
  handPrefix: 'equip:main_hand' | 'equip:off_hand',
  count: number,
  items: { scope: string; containerId: string | null }[],
  containerIdForSlot: (slotKey: string) => string | undefined,
): number | null {
  for (let index = 0; index < count; index += 1) {
    const slotKey = `${handPrefix}:${index}`
    const containerId = containerIdForSlot(slotKey)
    if (!containerId) continue
    if (items.some((entry) => entry.scope === 'unique' && entry.containerId === containerId)) {
      return index
    }
  }
  return null
}

export function effectiveActiveHandSlot(
  handPrefix: 'equip:main_hand' | 'equip:off_hand',
  count: number,
  storedIndex: number,
  items: { scope: string; containerId: string | null }[],
  containerIdForSlot: (slotKey: string) => string | undefined,
): number {
  const firstFilled = findFirstFilledHandSlot(handPrefix, count, items, containerIdForSlot)
  if (firstFilled !== null) return firstFilled
  return Math.min(Math.max(storedIndex, 0), count - 1)
}

export function getPlacementSlotTypeLabel(slotType: string): string {
  return PLACEMENT_SLOT_TYPES.find((entry) => entry.id === slotType)?.label ?? slotKeyLabel(slotType)
}

function slotKeyLabel(slotType: string): string {
  return getCharacterSlotDefinition(slotType)?.name ?? slotType
}
