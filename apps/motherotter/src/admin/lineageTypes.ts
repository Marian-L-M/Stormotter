export const LINEAGE_STAT_KEYS = [
  'strength',
  'dexterity',
  'constitution',
  'intelligence',
  'wisdom',
  'charisma',
  'luck',
] as const

export type LineageStatKey = (typeof LINEAGE_STAT_KEYS)[number]

export const LINEAGE_STAT_LABELS: Record<LineageStatKey, string> = {
  strength: 'Strength',
  dexterity: 'Dexterity',
  constitution: 'Constitution',
  intelligence: 'Intelligence',
  wisdom: 'Wisdom',
  charisma: 'Charisma',
  luck: 'Luck',
}

export interface StatRange {
  min: number
  max: number
}

export type LineageStatRanges = Record<LineageStatKey, StatRange>

export type CharacterStatValues = Record<LineageStatKey, number | null>

import { createEmptyBonusDice, normalizeDiceRoll, type DiceRoll } from './diceTypes'
import { normalizeLevelAbilityGrants, type LevelAbilityGrant } from './levelGrantTypes'

export interface CharacterLineageType {
  id: string
  name: string
  description: string
  statRanges: LineageStatRanges
  /** Extra hit dice added on top of class hit die (0 dice = none) */
  hitPointBonusDice: DiceRoll
  /** Abilities granted at specific levels */
  levelAbilities: LevelAbilityGrant[]
  updatedAt: string
}

export interface LineageTypeListItem {
  id: string
  title: string
  category: string
  updatedAt: string
  subtitle?: string
  lineageType: CharacterLineageType
}

export type LineageTypePatch = Partial<
  Pick<
    CharacterLineageType,
    'name' | 'description' | 'statRanges' | 'hitPointBonusDice' | 'levelAbilities'
  >
>

export function normalizeLineageType(
  raw: Partial<CharacterLineageType> & { abilityIds?: string[] },
): CharacterLineageType {
  return {
    id: raw.id ?? '',
    name: raw.name ?? '',
    description: raw.description ?? '',
    statRanges: normalizeStatRanges(raw.statRanges),
    hitPointBonusDice: normalizeDiceRoll(raw.hitPointBonusDice ?? createEmptyBonusDice()),
    levelAbilities: normalizeLevelAbilityGrants(raw.levelAbilities, raw.abilityIds),
    updatedAt: raw.updatedAt ?? new Date().toISOString(),
  }
}

export function createDefaultStatRanges(): LineageStatRanges {
  return {
    strength: { min: 3, max: 18 },
    dexterity: { min: 3, max: 18 },
    constitution: { min: 3, max: 18 },
    intelligence: { min: 3, max: 18 },
    wisdom: { min: 3, max: 18 },
    charisma: { min: 3, max: 18 },
    luck: { min: 3, max: 18 },
  }
}

export function normalizeStatRanges(raw: Partial<LineageStatRanges> | undefined): LineageStatRanges {
  const defaults = createDefaultStatRanges()
  if (!raw) return defaults

  const normalized = { ...defaults }
  for (const stat of LINEAGE_STAT_KEYS) {
    const fromRaw = raw[stat]
    if (!fromRaw) continue
    const min = Number.isFinite(fromRaw.min) ? fromRaw.min : defaults[stat].min
    const max = Number.isFinite(fromRaw.max) ? fromRaw.max : defaults[stat].max
    normalized[stat] = { min: Math.min(min, max), max: Math.max(min, max) }
  }
  return normalized
}

export function formatStatRangesSummary(ranges: LineageStatRanges): string {
  const summaries = LINEAGE_STAT_KEYS.map((stat) => `${ranges[stat].min}–${ranges[stat].max}`)
  const unique = new Set(summaries)
  if (unique.size === 1) return summaries[0]!
  return 'Mixed ranges'
}

export function formatStatRange(range: StatRange): string {
  return `${range.min}–${range.max}`
}

export function createEmptyCharacterStats(): CharacterStatValues {
  return {
    strength: null,
    dexterity: null,
    constitution: null,
    intelligence: null,
    wisdom: null,
    charisma: null,
    luck: null,
  }
}

export function normalizeCharacterStats(raw: Partial<CharacterStatValues> | undefined): CharacterStatValues {
  const empty = createEmptyCharacterStats()
  if (!raw) return empty

  const normalized = { ...empty }
  for (const stat of LINEAGE_STAT_KEYS) {
    const value = raw[stat]
    normalized[stat] = value === null || value === undefined || !Number.isFinite(value) ? null : value
  }
  return normalized
}

export function isStatOutsideRange(value: number | null, range: StatRange): boolean {
  if (value === null) return false
  return value < range.min || value > range.max
}

export function migrateLegacyLineageId(id: string): string {
  if (id.startsWith('lineage-')) return id
  if (id.startsWith('race-')) return `lineage-${id.slice(5)}`
  if (id.startsWith('class-')) return `lineage-${id.slice(6)}`
  return id
}
