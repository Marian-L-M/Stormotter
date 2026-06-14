import type { AdminListItem } from './types'
import {
  characterSlotContainerId,
  getCharacterSlotDefinition,
  isCharacterSlotDefinitionId,
  migrateLegacyCharacterSlotKey,
  type CharacterSlotDefinition,
} from './characterSlotTypes'

// ---------------------------------------------------------------------------
// Container section tabs (within Containers mode)
// ---------------------------------------------------------------------------

export type ContainerKind = 'unique' | 'random' | 'character_slot'

export type ContainerSectionTab =
  | 'unique'
  | 'random'
  | 'character_inventories'
  | 'character_slot_definitions'

export const CONTAINER_SECTION_TABS: { id: ContainerSectionTab; label: string }[] = [
  { id: 'unique', label: 'Unique Containers' },
  { id: 'random', label: 'Random Containers' },
  { id: 'character_inventories', label: 'Character Inventories' },
  { id: 'character_slot_definitions', label: 'Slot Definitions' },
]

export type ContainerVisibility = 'public' | 'hidden'

export const CONTAINER_KIND_LABELS: Record<ContainerKind, string> = {
  unique: 'Unique container',
  random: 'Random container',
  character_slot: 'Character slot',
}

export const CONTAINER_VISIBILITY_LABELS: Record<ContainerVisibility, string> = {
  public: 'Public',
  hidden: 'Hidden',
}

export interface ContainerLootEntry {
  id: string
  genericItemId: string
  weight: number
  minQuantity: number
  maxQuantity: number
}

export interface Container {
  id: string
  name: string
  description: string
  kind: ContainerKind
  visibility: ContainerVisibility
  characterId: string | null
  slotKey: string | null
  lootEntries: ContainerLootEntry[]
  updatedAt: string
}

export type ContainerPatch = Partial<
  Pick<
    Container,
    'name' | 'description' | 'kind' | 'visibility' | 'characterId' | 'slotKey' | 'lootEntries'
  >
>

export interface ContainerListItem extends AdminListItem {
  container: Container
}

export function createContainerId(): string {
  return `container-${crypto.randomUUID().slice(0, 8)}`
}

export function createContainerLootEntryId(): string {
  return `container-loot-${crypto.randomUUID().slice(0, 8)}`
}

export function createEmptyContainer(
  name = 'Untitled container',
  kind: ContainerKind = 'unique',
): Container {
  const timestamp = new Date().toISOString()
  return {
    id: createContainerId(),
    name,
    description: '',
    kind,
    visibility: 'public',
    characterId: null,
    slotKey: null,
    lootEntries: [],
    updatedAt: timestamp,
  }
}

export function createCharacterSlotContainer(
  characterId: string,
  characterName: string,
  definition: CharacterSlotDefinition,
): Container {
  return {
    id: characterSlotContainerId(characterId, definition.slotKey),
    name: `${characterName} — ${definition.name}`,
    description: definition.description,
    kind: 'character_slot',
    visibility: definition.visibility,
    characterId,
    slotKey: definition.slotKey,
    lootEntries: [],
    updatedAt: new Date().toISOString(),
  }
}

function normalizeLootEntry(raw: Partial<ContainerLootEntry> & { id?: string }): ContainerLootEntry {
  const minQuantity =
    typeof raw.minQuantity === 'number' && raw.minQuantity >= 0 ? Math.floor(raw.minQuantity) : 1
  const maxQuantity =
    typeof raw.maxQuantity === 'number' && raw.maxQuantity >= minQuantity
      ? Math.floor(raw.maxQuantity)
      : minQuantity

  return {
    id: raw.id ?? createContainerLootEntryId(),
    genericItemId: typeof raw.genericItemId === 'string' && raw.genericItemId.length > 0 ? raw.genericItemId : '',
    weight: typeof raw.weight === 'number' && raw.weight > 0 ? raw.weight : 1,
    minQuantity,
    maxQuantity,
  }
}

export function normalizeContainer(raw: Partial<Container> & { id: string; kind?: string }): Container {
  const legacyKind = raw.kind as string | undefined
  const kind: ContainerKind =
    legacyKind === 'random' || legacyKind === 'character_slot' || legacyKind === 'unique'
      ? legacyKind
      : legacyKind === 'character'
        ? 'character_slot'
        : 'unique'

  const visibility = raw.visibility === 'hidden' ? 'hidden' : 'public'

  const migratedSlotKey =
    kind === 'character_slot'
      ? migrateLegacyCharacterSlotKey(raw.slotKey) ??
        (legacyKind === 'character' ? 'storage:public:0' : null)
      : null
  const slotKey =
    migratedSlotKey && isCharacterSlotDefinitionId(migratedSlotKey) ? migratedSlotKey : null
  const slotDefinition = slotKey ? getCharacterSlotDefinition(slotKey) : undefined

  return {
    id: raw.id,
    name: raw.name?.trim() || 'Untitled container',
    description: raw.description ?? slotDefinition?.description ?? '',
    kind,
    visibility: kind === 'character_slot' ? (slotDefinition?.visibility ?? visibility) : 'public',
    characterId: typeof raw.characterId === 'string' && raw.characterId.length > 0 ? raw.characterId : null,
    slotKey,
    lootEntries: (raw.lootEntries ?? []).map((entry) => normalizeLootEntry(entry)),
    updatedAt: raw.updatedAt ?? new Date().toISOString(),
  }
}

export function containerKindUsesVisibility(kind: ContainerKind): boolean {
  return kind === 'character_slot'
}

export function containerKindUsesCharacter(kind: ContainerKind): boolean {
  return kind === 'character_slot'
}

export function containerKindUsesLootTable(kind: ContainerKind): boolean {
  return kind === 'random'
}

export function containerKindUsesUniqueItems(kind: ContainerKind): boolean {
  return kind === 'unique' || kind === 'character_slot'
}

export function summarizeContainerLoot(entries: ContainerLootEntry[]): string {
  if (entries.length === 0) return 'None'
  return `${entries.length} entr${entries.length === 1 ? 'y' : 'ies'}`
}

export function migrateStubToContainer(stub: AdminListItem): Container {
  return normalizeContainer({
    id: stub.id.startsWith('container-') ? stub.id : createContainerId(),
    name: stub.title,
    description: stub.subtitle ?? '',
    kind: 'unique',
    updatedAt: stub.updatedAt,
  })
}

export { getCharacterSlotLabel } from './characterSlotTypes'

export function migrateLegacyContainers(containers: Container[]): {
  containers: Container[]
  containerIdMap: Map<string, string>
} {
  const containerIdMap = new Map<string, string>()
  const mergedById = new Map<string, Container>()

  for (const raw of containers) {
    const normalized = normalizeContainer(raw)

    if (normalized.kind !== 'character_slot' || !normalized.characterId || !normalized.slotKey) {
      mergedById.set(normalized.id, normalized)
      continue
    }

    const slotKey = migrateLegacyCharacterSlotKey(normalized.slotKey) ?? normalized.slotKey
    if (!isCharacterSlotDefinitionId(slotKey)) {
      continue
    }

    const canonicalId = characterSlotContainerId(normalized.characterId, slotKey)
    if (normalized.id !== canonicalId) {
      containerIdMap.set(normalized.id, canonicalId)
    }

    const definition = getCharacterSlotDefinition(slotKey)!
    const characterName = normalized.name.includes(' — ')
      ? normalized.name.split(' — ')[0]
      : normalized.characterId
    const next = createCharacterSlotContainer(normalized.characterId, characterName, definition)
    const existing = mergedById.get(canonicalId)

    mergedById.set(canonicalId, existing ? { ...next, updatedAt: existing.updatedAt } : next)
  }

  return {
    containers: [...mergedById.values()],
    containerIdMap,
  }
}
