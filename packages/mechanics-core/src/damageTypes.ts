import type { RegistryEntry } from './registry.js'

export interface DamageTypeGroup {
  id: string
  key: string
  name: string
  types: RegistryEntry[]
}

export const DAMAGE_TYPE_GROUPS: DamageTypeGroup[] = [
  {
    id: 'physical',
    key: 'physical',
    name: 'Physical',
    types: [
      { id: 'slashing', key: 'slashing', name: 'Slashing' },
      { id: 'piercing', key: 'piercing', name: 'Piercing' },
      { id: 'blunt', key: 'blunt', name: 'Blunt' },
      { id: 'unarmed', key: 'unarmed', name: 'Unarmed' },
      { id: 'ranged_piercing', key: 'ranged_piercing', name: 'Range-piercing' },
      { id: 'ranged_crushing', key: 'ranged_crushing', name: 'Ranged crushing' },
      { id: 'ranged_slashing', key: 'ranged_slashing', name: 'Ranged slashing' },
      { id: 'finesse', key: 'finesse', name: 'Finesse' },
      { id: 'bleeding', key: 'bleeding', name: 'Bleeding' },
    ],
  },
  {
    id: 'elemental',
    key: 'elemental',
    name: 'Elemental',
    types: [
      { id: 'fire', key: 'fire', name: 'Fire' },
      { id: 'cold', key: 'cold', name: 'Cold' },
      { id: 'lightning', key: 'lightning', name: 'Lightning' },
      { id: 'acid', key: 'acid', name: 'Acid' },
      { id: 'poison', key: 'poison', name: 'Poison' },
      { id: 'sonic', key: 'sonic', name: 'Sonic' },
      { id: 'impact', key: 'impact', name: 'Impact' },
      { id: 'vitality', key: 'vitality', name: 'Vitality' },
    ],
  },
  {
    id: 'magical',
    key: 'magical',
    name: 'Magical',
    types: [
      { id: 'burning', key: 'burning', name: 'Burning' },
      { id: 'crushing', key: 'crushing', name: 'Crushing' },
      { id: 'magical_piercing', key: 'magical_piercing', name: 'Piercing' },
      { id: 'mental', key: 'mental', name: 'Mental' },
      { id: 'draining', key: 'draining', name: 'Draining' },
      { id: 'divine', key: 'divine', name: 'Divine' },
      { id: 'demonic', key: 'demonic', name: 'Demonic' },
      { id: 'necrotic', key: 'necrotic', name: 'Necrotic' },
      { id: 'chaotic', key: 'chaotic', name: 'Chaotic' },
      { id: 'heroic', key: 'heroic', name: 'Heroic' },
      { id: 'void', key: 'void', name: 'Void' },
      { id: 'pure', key: 'pure', name: 'Pure' },
    ],
  },
]

/** Flat list including group ids and all subtype ids — for validation & legacy APIs */
export const DEFAULT_DAMAGE_TYPES: RegistryEntry[] = [
  ...DAMAGE_TYPE_GROUPS.map((group) => ({ id: group.id, key: group.key, name: group.name })),
  ...DAMAGE_TYPE_GROUPS.flatMap((group) => group.types),
]

const LEGACY_DAMAGE_TYPE_IDS: Record<string, string> = {
  bludgeoning: 'blunt',
  magic: 'magical',
  necortic: 'necrotic',
}

export function migrateLegacyDamageTypeId(raw: string | null | undefined): string | null {
  if (!raw) return null
  return LEGACY_DAMAGE_TYPE_IDS[raw] ?? raw
}

export function findDamageTypeGroup(
  damageTypeId: string | null | undefined,
): DamageTypeGroup | undefined {
  if (!damageTypeId) return undefined
  const migrated = migrateLegacyDamageTypeId(damageTypeId)
  if (!migrated) return undefined

  const asGroup = DAMAGE_TYPE_GROUPS.find((group) => group.id === migrated)
  if (asGroup) return asGroup

  return DAMAGE_TYPE_GROUPS.find((group) => group.types.some((type) => type.id === migrated))
}

export function findDamageTypeEntry(damageTypeId: string | null | undefined): RegistryEntry | undefined {
  if (!damageTypeId) return undefined
  const migrated = migrateLegacyDamageTypeId(damageTypeId)
  if (!migrated) return undefined

  const group = DAMAGE_TYPE_GROUPS.find((entry) => entry.id === migrated)
  if (group) {
    return { id: group.id, key: group.key, name: group.name }
  }

  for (const damageGroup of DAMAGE_TYPE_GROUPS) {
    const type = damageGroup.types.find((entry) => entry.id === migrated)
    if (type) return type
  }

  return undefined
}

export function formatDamageTypeLabel(damageTypeId: string | null | undefined): string {
  if (!damageTypeId) return '?'
  const migrated = migrateLegacyDamageTypeId(damageTypeId)
  if (!migrated) return damageTypeId

  const group = DAMAGE_TYPE_GROUPS.find((entry) => entry.id === migrated)
  if (group) return group.name

  const parentGroup = findDamageTypeGroup(migrated)
  const type = parentGroup?.types.find((entry) => entry.id === migrated)
  if (parentGroup && type) {
    return `${parentGroup.name} · ${type.name}`
  }

  return migrated
}

export function validateDamageTypeId(
  raw: string | null | undefined,
  fallback: string | null = null,
): string | null {
  const migrated = migrateLegacyDamageTypeId(raw)
  if (!migrated) return fallback
  return findDamageTypeEntry(migrated) ? migrated : fallback
}

export function resolveDamageTypeTab(damageTypeId: string | null | undefined): string {
  return findDamageTypeGroup(damageTypeId)?.id ?? DAMAGE_TYPE_GROUPS[0]?.id ?? 'physical'
}
