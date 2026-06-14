import type { Item } from './itemTypes'
import { getItemCategory, getItemClass } from './itemTypes'
import type { ItemSlotPlacementSettings } from './slotRules'
import { getSlotTypeKey, isInventoryStorageSlotKey } from './slotRules'

function legacyEquipSlotToTypes(equipSlot: string | null | undefined): string[] {
  if (!equipSlot) return []
  const mapped: Record<string, string> = {
    main_hand: 'equip:main_hand',
    off_hand: 'equip:off_hand',
    body: 'equip:body',
    head: 'equip:head',
    hands: 'equip:hands',
    feet: 'equip:feet',
    waist: 'equip:belt',
    belt: 'equip:belt',
    back: 'equip:cape',
    cape: 'equip:cape',
    ring: 'equip:ring_1',
    neck: 'equip:necklace',
    necklace: 'equip:necklace',
  }
  const slotType = mapped[equipSlot] ?? equipSlot
  return slotType ? [slotType] : []
}

export function defaultAllowedSlotTypesForCategory(categoryId: string): string[] {
  const category = getItemCategory(categoryId)
  return legacyEquipSlotToTypes(category?.equipSlot ?? null)
}

export function resolveItemAllowedSlotTypes(
  item: Pick<Item, 'categoryId' | 'classId' | 'allowedSlotTypes'>,
  categorySettings: ItemSlotPlacementSettings | null | undefined,
  classSettings: ItemSlotPlacementSettings | null | undefined,
): string[] {
  if (item.allowedSlotTypes && item.allowedSlotTypes.length > 0) {
    return item.allowedSlotTypes
  }
  if (classSettings?.allowedSlotTypes && classSettings.allowedSlotTypes.length > 0) {
    return classSettings.allowedSlotTypes
  }
  if (categorySettings?.allowedSlotTypes && categorySettings.allowedSlotTypes.length > 0) {
    return categorySettings.allowedSlotTypes
  }
  if (item.classId) {
    const itemClass = getItemClass(item.classId)
    if (itemClass) {
      const classDefaults = defaultAllowedSlotTypesForCategory(itemClass.categoryId)
      if (classDefaults.length > 0) return classDefaults
    }
  }
  return defaultAllowedSlotTypesForCategory(item.categoryId)
}

export function canPlaceItemInSlot(
  item: Pick<Item, 'categoryId' | 'classId' | 'allowedSlotTypes'>,
  slotKey: string,
  categorySettings?: ItemSlotPlacementSettings | null,
  classSettings?: ItemSlotPlacementSettings | null,
): boolean {
  if (isInventoryStorageSlotKey(slotKey)) return true
  const allowed = resolveItemAllowedSlotTypes(item, categorySettings, classSettings)
  if (allowed.length === 0) return false
  const slotType = getSlotTypeKey(slotKey)
  return allowed.some((entry) => entry === slotType)
}
