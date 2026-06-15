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
  { id: 'condition', key: 'condition', name: 'Trait' },
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

export const DERIVED_STAT_MODIFIER_PREFIX = 'derived_stat:'

const REGISTRY_ID_ALIASES: Record<string, Record<string, string>> = {
  saveTypes: {
    petrification: 'stunning',
  },
}

export function migrateRegistryId(domain: keyof typeof REGISTRY_ID_ALIASES, id: string): string {
  return REGISTRY_ID_ALIASES[domain]?.[id] ?? id
}

export function isDerivedStatModifierId(statId: string | null | undefined): statId is string {
  return Boolean(statId?.startsWith(DERIVED_STAT_MODIFIER_PREFIX))
}

export function validateModifierStatId(
  raw: string | null | undefined,
  fallback: string | null = null,
): string | null {
  if (!raw) return fallback
  if (validateRegistryId(raw, DEFAULT_STATS, null)) return raw
  if (isDerivedStatModifierId(raw) && raw.length > DERIVED_STAT_MODIFIER_PREFIX.length) {
    return raw
  }
  return fallback
}

export const DEFAULT_SAVE_TYPES: RegistryEntry[] = [
  { id: 'fortitude', key: 'fortitude', name: 'Fortitude' },
  { id: 'reflex', key: 'reflex', name: 'Reflex' },
  { id: 'will', key: 'will', name: 'Will' },
  { id: 'spell', key: 'spell', name: 'Spell' },
  { id: 'breath', key: 'breath', name: 'Breath weapon' },
  { id: 'death', key: 'death', name: 'Death magic' },
  { id: 'stunning', key: 'stunning', name: 'Stunning' },
  { id: 'polymorph', key: 'polymorph', name: 'Polymorph' },
  { id: 'charisma', key: 'charisma', name: 'Charisma' },
  { id: 'luck', key: 'luck', name: 'Luck' },
]

/** Permanent passive traits — not temporary combat states (those belong in battle rules). */
export const DEFAULT_CONDITIONS: RegistryEntry[] = [
  { id: 'regeneration', key: 'regeneration', name: 'Regeneration' },
  { id: 'lifesteal', key: 'lifesteal', name: 'Lifesteal' },
  { id: 'damage_reflection', key: 'damage_reflection', name: 'Damage reflection' },
  { id: 'spell_immunity', key: 'spell_immunity', name: 'Spell immunity' },
  { id: 'disease_immunity', key: 'disease_immunity', name: 'Disease immunity' },
  { id: 'poison_immunity', key: 'poison_immunity', name: 'Poison immunity' },
  { id: 'undead', key: 'undead', name: 'Undead' },
  { id: 'incorporeal', key: 'incorporeal', name: 'Incorporeal' },
  { id: 'darkvision', key: 'darkvision', name: 'Darkvision' },
  { id: 'water_breathing', key: 'water_breathing', name: 'Water breathing' },
  { id: 'silent_casting', key: 'silent_casting', name: 'Silent casting' },
  { id: 'silent_movement', key: 'silent_movement', name: 'Silent movement' },
]

export const DEFAULT_MAGIC_EFFECTS: RegistryEntry[] = [
  { id: 'spell_power', key: 'spell_power', name: 'Spell power' },
  { id: 'divine_power', key: 'divine_power', name: 'Divine power' },
  { id: 'magic_resistance', key: 'magic_resistance', name: 'Magic resistance' },
  { id: 'magic_spell', key: 'magic_spell', name: 'Magic spell' },
  { id: 'magic_spell_slots', key: 'magic_spell_slots', name: 'Arcane spell slots' },
  { id: 'divine_spell_slots', key: 'divine_spell_slots', name: 'Divine spell slots' },
  { id: 'restore_magic_slots', key: 'restore_magic_slots', name: 'Restore arcane spell slots' },
  { id: 'restore_divine_spell_slots', key: 'restore_divine_spell_slots', name: 'Restore divine spell slots' },
  { id: 'casting_time_mod', key: 'casting_time_mod', name: 'Casting time modifier' },
  { id: 'casting_interval', key: 'casting_interval', name: 'Casting interval' },
  { id: 'thorns_aura', key: 'thorns_aura', name: 'Thorns aura' },
  { id: 'healing_aura', key: 'healing_aura', name: 'Healing aura' },
  { id: 'protection_aura', key: 'protection_aura', name: 'Protection aura' },
  { id: 'fear_aura', key: 'fear_aura', name: 'Fear aura' },
  { id: 'fire_aura', key: 'fire_aura', name: 'Fire aura' },
  { id: 'frost_aura', key: 'frost_aura', name: 'Frost aura' },
  { id: 'holy_aura', key: 'holy_aura', name: 'Holy aura' },
  { id: 'poison_aura', key: 'poison_aura', name: 'Poison aura' },
  { id: 'antimagic_aura', key: 'antimagic_aura', name: 'Antimagic aura' },
  { id: 'spell_reflect', key: 'spell_reflect', name: 'Spell reflection' },
  { id: 'dispel', key: 'dispel', name: 'Dispel magic' },
]

/** @deprecated Use DEFAULT_MAGIC_EFFECTS */
export const DEFAULT_CUSTOM_HANDLERS = DEFAULT_MAGIC_EFFECTS

/** How an ability applies its effect — paired with attribute type blocks in the ability builder. */
export const ABILITY_ACTION_TYPES: RegistryEntry[] = [
  { id: 'cause', key: 'cause', name: 'Cause' },
  { id: 'buff', key: 'buff', name: 'Buff' },
  { id: 'debuff', key: 'debuff', name: 'Debuff' },
  { id: 'heal', key: 'heal', name: 'Heal' },
  { id: 'restore', key: 'restore', name: 'Restore' },
  { id: 'grant', key: 'grant', name: 'Grant' },
  { id: 'remove', key: 'remove', name: 'Remove' },
  { id: 'reflect', key: 'reflect', name: 'Reflect' },
]

/** Who or what an ability affects when it fires. */
export const ABILITY_TARGETS: RegistryEntry[] = [
  { id: 'self', key: 'self', name: 'On self' },
  { id: 'target', key: 'target', name: 'On target' },
  { id: 'selected', key: 'selected', name: 'On selected' },
  { id: 'area', key: 'area', name: 'On area' },
  { id: 'closest_enemy', key: 'closest_enemy', name: 'On closest enemy' },
  { id: 'closest_ally', key: 'closest_ally', name: 'On closest ally' },
  { id: 'all_enemies', key: 'all_enemies', name: 'On all enemies' },
  { id: 'all_allies', key: 'all_allies', name: 'On all allies' },
  { id: 'random_enemy', key: 'random_enemy', name: 'On random enemy' },
  { id: 'ground', key: 'ground', name: 'On ground' },
]

export function abilityActionsForEffectType(effectTypeId: string | null | undefined): RegistryEntry[] {
  switch (effectTypeId) {
    case 'damage':
      return ABILITY_ACTION_TYPES.filter((entry) =>
        ['cause', 'buff', 'debuff', 'reflect'].includes(entry.id),
      )
    case 'resistance':
      return ABILITY_ACTION_TYPES.filter((entry) => ['grant', 'remove', 'buff', 'debuff'].includes(entry.id))
    case 'modifier':
    case 'saving_throw':
      return ABILITY_ACTION_TYPES.filter((entry) => ['buff', 'debuff', 'grant', 'remove'].includes(entry.id))
    case 'condition':
      return ABILITY_ACTION_TYPES.filter((entry) => ['grant', 'remove'].includes(entry.id))
    case 'magic':
      return ABILITY_ACTION_TYPES.filter((entry) =>
        ['cause', 'buff', 'debuff', 'heal', 'restore', 'grant', 'remove', 'reflect'].includes(entry.id),
      )
    default:
      return ABILITY_ACTION_TYPES
  }
}

export function validateAbilityActionId(
  raw: string | null | undefined,
  effectTypeId: string | null | undefined,
  fallback: string | null = null,
): string | null {
  if (!raw) return fallback
  return validateRegistryId(raw, abilityActionsForEffectType(effectTypeId), fallback)
}

export function validateAbilityTargetId(
  raw: string | null | undefined,
  fallback: string | null = null,
): string | null {
  if (!raw) return fallback
  return validateRegistryId(raw, ABILITY_TARGETS, fallback)
}

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

export function validateSaveTypeId(
  raw: string | null | undefined,
  fallback: string | null = null,
): string | null {
  if (!raw) return fallback
  const migrated = migrateRegistryId('saveTypes', raw)
  return validateRegistryId(migrated, DEFAULT_SAVE_TYPES, fallback)
}

export function validateMagicEffectId(
  raw: string | null | undefined,
  fallback: string | null = null,
): string | null {
  if (!raw) return fallback
  const trimmed = raw.trim()
  if (!trimmed) return fallback
  const migrated = migrateRegistryId('magicEffects', trimmed)
  if (validateRegistryId(migrated, DEFAULT_MAGIC_EFFECTS, null)) return migrated
  if (trimmed.startsWith(DERIVED_STAT_MODIFIER_PREFIX)) return trimmed
  return fallback
}
