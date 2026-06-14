import type { ContainerVisibility } from './containerTypes'

export const PUBLIC_STORAGE_SLOT_COUNT = 20
export const HIDDEN_STORAGE_SLOT_COUNT = 20
export const MAIN_HAND_SLOT_COUNT = 4
export const OFF_HAND_SLOT_COUNT = 2
export const QUICK_SLOT_COUNT = 4
export const QUIVER_SLOT_COUNT = 3

export type CharacterSlotGroup =
  | 'equipment'
  | 'quick_bar'
  | 'quiver'
  | 'public_storage'
  | 'hidden_storage'

export interface CharacterSlotDefinition {
  slotKey: string
  name: string
  group: CharacterSlotGroup
  visibility: ContainerVisibility
  storageIndex: number | null
  description: string
  supportsActiveSelection: boolean
}

export const CHARACTER_SLOT_GROUP_LABELS: Record<CharacterSlotGroup, string> = {
  equipment: 'Equipment slots',
  quick_bar: 'Quick slots',
  quiver: 'Quiver',
  public_storage: 'Public inventory',
  hidden_storage: 'Hidden inventory',
}

function buildIndexedEquipmentSlots(
  family: 'main_hand' | 'off_hand',
  count: number,
  label: string,
  description: string,
): CharacterSlotDefinition[] {
  return Array.from({ length: count }, (_, index) => ({
    slotKey: `equip:${family}:${index}`,
    name: count === 1 ? label : `${label} ${index + 1}`,
    group: 'equipment' as const,
    visibility: 'public' as const,
    storageIndex: null,
    description,
    supportsActiveSelection: true,
  }))
}

const SINGLE_EQUIPMENT_SLOT_DEFINITIONS: CharacterSlotDefinition[] = [
  {
    slotKey: 'equip:body',
    name: 'Body armor',
    group: 'equipment',
    visibility: 'public',
    storageIndex: null,
    description: 'Chest and torso armor.',
    supportsActiveSelection: false,
  },
  {
    slotKey: 'equip:head',
    name: 'Head',
    group: 'equipment',
    visibility: 'public',
    storageIndex: null,
    description: 'Helmets, hoods, and headwear.',
    supportsActiveSelection: false,
  },
  {
    slotKey: 'equip:hands',
    name: 'Hands',
    group: 'equipment',
    visibility: 'public',
    storageIndex: null,
    description: 'Gloves and gauntlets.',
    supportsActiveSelection: false,
  },
  {
    slotKey: 'equip:feet',
    name: 'Feet',
    group: 'equipment',
    visibility: 'public',
    storageIndex: null,
    description: 'Boots and footwear.',
    supportsActiveSelection: false,
  },
  {
    slotKey: 'equip:belt',
    name: 'Belt',
    group: 'equipment',
    visibility: 'public',
    storageIndex: null,
    description: 'Belts and waist items.',
    supportsActiveSelection: false,
  },
  {
    slotKey: 'equip:cape',
    name: 'Cape',
    group: 'equipment',
    visibility: 'public',
    storageIndex: null,
    description: 'Cloaks, capes, and backpacks.',
    supportsActiveSelection: false,
  },
  {
    slotKey: 'equip:necklace',
    name: 'Necklace',
    group: 'equipment',
    visibility: 'public',
    storageIndex: null,
    description: 'Amulets, pendants, and holy symbols.',
    supportsActiveSelection: false,
  },
  {
    slotKey: 'equip:ring_1',
    name: 'Ring 1',
    group: 'equipment',
    visibility: 'public',
    storageIndex: null,
    description: 'First ring slot.',
    supportsActiveSelection: false,
  },
  {
    slotKey: 'equip:ring_2',
    name: 'Ring 2',
    group: 'equipment',
    visibility: 'public',
    storageIndex: null,
    description: 'Second ring slot.',
    supportsActiveSelection: false,
  },
]

function buildQuickSlots(count: number): CharacterSlotDefinition[] {
  return Array.from({ length: count }, (_, index) => ({
    slotKey: `quick:${index}`,
    name: `Quick slot ${index + 1}`,
    group: 'quick_bar' as const,
    visibility: 'public' as const,
    storageIndex: index,
    description: `Hotbar slot ${index + 1} for fast item access.`,
    supportsActiveSelection: false,
  }))
}

function buildQuiverSlots(count: number): CharacterSlotDefinition[] {
  return Array.from({ length: count }, (_, index) => ({
    slotKey: `quiver:${index}`,
    name: `Quiver ${index + 1}`,
    group: 'quiver' as const,
    visibility: 'public' as const,
    storageIndex: index,
    description: `Ammunition slot ${index + 1}.`,
    supportsActiveSelection: false,
  }))
}

function buildStorageSlots(
  visibility: 'public' | 'hidden',
  count: number,
): CharacterSlotDefinition[] {
  const group: CharacterSlotGroup = visibility === 'public' ? 'public_storage' : 'hidden_storage'
  const label = visibility === 'public' ? 'Public inventory' : 'Hidden inventory'

  return Array.from({ length: count }, (_, index) => ({
    slotKey: `storage:${visibility}:${index}`,
    name: `${label} ${index + 1}`,
    group,
    visibility,
    storageIndex: index,
    description:
      visibility === 'public'
        ? `Public inventory cell ${index + 1} of ${count}. Visible in normal character inventory UI.`
        : `Hidden inventory cell ${index + 1} of ${count}. Requires special access (pickpocket, detect magic, etc.).`,
    supportsActiveSelection: false,
  }))
}

export const CHARACTER_SLOT_DEFINITIONS: CharacterSlotDefinition[] = [
  ...buildIndexedEquipmentSlots(
    'main_hand',
    MAIN_HAND_SLOT_COUNT,
    'Main hand',
    'Primary weapon or held item.',
  ),
  ...buildIndexedEquipmentSlots(
    'off_hand',
    OFF_HAND_SLOT_COUNT,
    'Off hand',
    'Shield, secondary weapon, or off-hand item.',
  ),
  ...SINGLE_EQUIPMENT_SLOT_DEFINITIONS,
  ...buildQuickSlots(QUICK_SLOT_COUNT),
  ...buildQuiverSlots(QUIVER_SLOT_COUNT),
  ...buildStorageSlots('public', PUBLIC_STORAGE_SLOT_COUNT),
  ...buildStorageSlots('hidden', HIDDEN_STORAGE_SLOT_COUNT),
]

export const CHARACTER_SLOT_KEYS = CHARACTER_SLOT_DEFINITIONS.map((entry) => entry.slotKey)

const LEGACY_SLOT_KEY_MAP: Record<string, string> = {
  inventory: 'storage:public:0',
  main_hand: 'equip:main_hand:0',
  off_hand: 'equip:off_hand:0',
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
  'equip:main_hand': 'equip:main_hand:0',
  'equip:off_hand': 'equip:off_hand:0',
  'equip:waist': 'equip:belt',
  'equip:back': 'equip:cape',
  'equip:neck': 'equip:necklace',
}

export function migrateLegacyCharacterSlotKey(raw: string | null | undefined): string | null {
  if (!raw) return null
  if (CHARACTER_SLOT_KEYS.includes(raw)) return raw
  if (LEGACY_SLOT_KEY_MAP[raw]) return LEGACY_SLOT_KEY_MAP[raw]
  return null
}

export function isCharacterSlotDefinitionId(id: string): id is string {
  return CHARACTER_SLOT_KEYS.includes(id)
}

export function isInventoryStorageSlotKey(slotKey: string): boolean {
  return slotKey.startsWith('storage:public:') || slotKey.startsWith('storage:hidden:')
}

export function getCharacterSlotDefinition(
  slotKey: string | null | undefined,
): CharacterSlotDefinition | undefined {
  if (!slotKey) return undefined
  const migrated = migrateLegacyCharacterSlotKey(slotKey) ?? slotKey
  return CHARACTER_SLOT_DEFINITIONS.find((entry) => entry.slotKey === migrated)
}

export function characterSlotDefinitionsByGroup(): Record<CharacterSlotGroup, CharacterSlotDefinition[]> {
  const grouped: Record<CharacterSlotGroup, CharacterSlotDefinition[]> = {
    equipment: [],
    quick_bar: [],
    quiver: [],
    public_storage: [],
    hidden_storage: [],
  }
  for (const definition of CHARACTER_SLOT_DEFINITIONS) {
    grouped[definition.group].push(definition)
  }
  return grouped
}

export function characterSlotContainerId(characterId: string, slotKey: string): string {
  const migrated = migrateLegacyCharacterSlotKey(slotKey) ?? slotKey
  const encoded = migrated.replace(/:/g, '_')
  return `container-${characterId}-${encoded}`
}

export function parseCharacterSlotContainerId(
  containerId: string,
): { characterId: string; slotKey: string } | null {
  if (!containerId.startsWith('container-')) return null
  for (const definition of CHARACTER_SLOT_DEFINITIONS) {
    const expectedSuffix = characterSlotContainerId('', definition.slotKey).slice('container-'.length)
    if (containerId.endsWith(`-${expectedSuffix}`)) {
      const characterId = containerId.slice('container-'.length, containerId.length - expectedSuffix.length - 1)
      if (characterId.length > 0) {
        return { characterId, slotKey: definition.slotKey }
      }
    }
  }
  return null
}

export function getCharacterSlotLabel(slotKey: string | null | undefined): string {
  return getCharacterSlotDefinition(slotKey)?.name ?? slotKey ?? '—'
}

export function isCharacterInventoryContainer(container: {
  kind: string
  characterId: string | null
  slotKey: string | null
}): boolean {
  return container.kind === 'character_slot' && Boolean(container.characterId && container.slotKey)
}
