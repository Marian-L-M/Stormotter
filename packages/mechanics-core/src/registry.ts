export interface RegistryEntry {
  id: string
  key: string
  name: string
}

export interface DamageTypeGroup {
  id: string
  key: string
  name: string
  types: RegistryEntry[]
}

export interface MechanicsRegistry {
  attributeTypes: RegistryEntry[]
  damageTypes: RegistryEntry[]
  damageTypeGroups: DamageTypeGroup[]
  resistanceRoles: RegistryEntry[]
  stats: RegistryEntry[]
  saveTypes: RegistryEntry[]
  conditions: RegistryEntry[]
  magicEffects: RegistryEntry[]
}

/** Top-level attribute builder types */
export const ATTRIBUTE_TYPES: RegistryEntry[] = [
  { id: 'damage', key: 'damage', name: 'Damage' },
  { id: 'resistance', key: 'resistance', name: 'Resistance' },
  { id: 'modifier', key: 'modifier', name: 'Modifier' },
  { id: 'condition', key: 'condition', name: 'Condition' },
  { id: 'saving_throw', key: 'saving_throw', name: 'Saving Throw' },
  { id: 'magic', key: 'magic', name: 'Magic' },
]

/** @deprecated Use ATTRIBUTE_TYPES */
export const EFFECT_TYPES = ATTRIBUTE_TYPES

export const RESISTANCE_ROLES: RegistryEntry[] = [
  { id: 'resistance', key: 'resistance', name: 'Resistance' },
  { id: 'vulnerability', key: 'vulnerability', name: 'Vulnerability' },
  { id: 'immunity', key: 'immunity', name: 'Immunity' },
  { id: 'absorption', key: 'absorption', name: 'Absorption' },
]

export const DEFAULT_STATS: RegistryEntry[] = [
  { id: 'strength', key: 'strength', name: 'Strength' },
  { id: 'dexterity', key: 'dexterity', name: 'Dexterity' },
  { id: 'constitution', key: 'constitution', name: 'Constitution' },
  { id: 'intelligence', key: 'intelligence', name: 'Intelligence' },
  { id: 'wisdom', key: 'wisdom', name: 'Wisdom' },
  { id: 'perception', key: 'perception', name: 'Perception' },
  { id: 'charisma', key: 'charisma', name: 'Charisma' },
  { id: 'luck', key: 'luck', name: 'Luck' },
]

export const DEFAULT_SAVE_TYPES: RegistryEntry[] = [
  { id: 'spell', key: 'spell', name: 'Spell' },
  { id: 'breath', key: 'breath', name: 'Breath weapon' },
  { id: 'death', key: 'death', name: 'Death magic' },
  { id: 'petrification', key: 'petrification', name: 'Stunning' },
  { id: 'polymorph', key: 'polymorph', name: 'Polymorph' },
  { id: 'charisma', key: 'charisma', name: 'Charisma' },
  { id: 'luck', key: 'luck', name: 'Luck' },
]

export const DEFAULT_CONDITIONS: RegistryEntry[] = [
  { id: 'stunned', key: 'stunned', name: 'Stunned' },
  { id: 'poisoned', key: 'poisoned', name: 'Poisoned' },
  { id: 'bleeding', key: 'bleeding', name: 'Bleeding' },
  { id: 'feared', key: 'feared', name: 'Feared' },
  { id: 'charmed', key: 'charmed', name: 'Charmed' },
  { id: 'invisible', key: 'invisible', name: 'Invisible' },
]

export const DEFAULT_MAGIC_EFFECTS: RegistryEntry[] = [
  { id: 'spell_power', key: 'spell_power', name: 'Spell power' },
  { id: 'magic_resistance', key: 'magic_resistance', name: 'Magic resistance' },
  { id: 'thorns_aura', key: 'thorns_aura', name: 'Thorns aura' },
  { id: 'regeneration', key: 'regeneration', name: 'Regeneration' },
  { id: 'spell_reflect', key: 'spell_reflect', name: 'Spell reflection' },
  { id: 'dispel', key: 'dispel', name: 'Dispel magic' },
]

/** @deprecated Use DEFAULT_MAGIC_EFFECTS */
export const DEFAULT_CUSTOM_HANDLERS = DEFAULT_MAGIC_EFFECTS

export {
  DAMAGE_TYPE_GROUPS,
  DEFAULT_DAMAGE_TYPES,
  findDamageTypeEntry,
  findDamageTypeGroup,
  formatDamageTypeLabel,
  migrateLegacyDamageTypeId,
  resolveDamageTypeTab,
  validateDamageTypeId,
} from './damageTypes.js'

import {
  DAMAGE_TYPE_GROUPS,
  DEFAULT_DAMAGE_TYPES,
} from './damageTypes.js'

export const DEFAULT_MECHANICS_REGISTRY: MechanicsRegistry = {
  attributeTypes: ATTRIBUTE_TYPES,
  damageTypes: DEFAULT_DAMAGE_TYPES,
  damageTypeGroups: DAMAGE_TYPE_GROUPS,
  resistanceRoles: RESISTANCE_ROLES,
  stats: DEFAULT_STATS,
  saveTypes: DEFAULT_SAVE_TYPES,
  conditions: DEFAULT_CONDITIONS,
  magicEffects: DEFAULT_MAGIC_EFFECTS,
}

export function findRegistryEntry(
  entries: RegistryEntry[],
  id: string | undefined | null,
): RegistryEntry | undefined {
  if (!id) return undefined
  return entries.find((entry) => entry.id === id)
}

export function validateRegistryId(
  raw: string | null | undefined,
  entries: RegistryEntry[],
  fallback: string | null = null,
): string | null {
  if (!raw) return fallback
  return findRegistryEntry(entries, raw) ? raw : fallback
}
