import { normalizeCharacterLevel, MAX_CHARACTER_LEVEL } from './characterLevelTypes'
import type { AbilityValue } from './abilityTypes'
import type { AttributeValue } from './attributeTypes'
import type { ItemTriggerId } from './itemTypes'
import { isItemTriggerId } from './itemTypes'

export type ProgressionMode = 'fixed' | 'upgradeable'

export interface DefinitionProgression {
  mode: ProgressionMode
  maxRank: number
  /** Point cost to reach each rank (index 0 = cost for rank 1). */
  rankCosts: number[]
  /** Resolved value at each 1-based rank. */
  valueByRank: Record<number, AbilityValue | AttributeValue>
}

export interface ClassProgressionAbilityGrant {
  definitionId: string
  value: AbilityValue
  triggerId: ItemTriggerId | null
}

export interface ClassProgressionAttributeGrant {
  definitionId: string
  value: AttributeValue
}

export interface ClassProgressionRankGrant {
  definitionId: string
  rank: number
}

/** One row per class level; xpRequired is cumulative XP to reach this level. */
export interface ClassLevelProgressionEntry {
  level: number
  xpRequired: number
  abilityPointsGranted: number
  attributePointsGranted: number
  autoAbilityGrants: ClassProgressionAbilityGrant[]
  autoAttributeGrants: ClassProgressionAttributeGrant[]
  abilityRankGrants: ClassProgressionRankGrant[]
  attributeRankGrants: ClassProgressionRankGrant[]
}

export interface CharacterClassProgression {
  classId: string
  level: number
  /** Cumulative XP earned on this class track. */
  experience: number
}

export interface CharacterProgression {
  classes: CharacterClassProgression[]
  unspentAbilityPoints: number
  unspentAttributePoints: number
  /** Player-assigned ranks (upgradeable definitions only). */
  abilityRanks: Record<string, number>
  attributeRanks: Record<string, number>
}

export interface LevelUpEvent {
  classId: string
  fromLevel: number
  toLevel: number
  abilityPointsGranted: number
  attributePointsGranted: number
}

export function createEmptyCharacterProgression(
  classId: string | null = null,
  level = 1,
): CharacterProgression {
  return {
    classes: classId
      ? [{ classId, level: normalizeCharacterLevel(level), experience: 0 }]
      : [],
    unspentAbilityPoints: 0,
    unspentAttributePoints: 0,
    abilityRanks: {},
    attributeRanks: {},
  }
}

export function createDefaultDefinitionProgression(): DefinitionProgression {
  return {
    mode: 'fixed',
    maxRank: 1,
    rankCosts: [1],
    valueByRank: {},
  }
}

function clampRank(value: unknown, fallback = 1): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) return fallback
  return Math.max(1, Math.min(99, Math.round(value)))
}

function normalizeRankCosts(raw: unknown, maxRank: number): number[] {
  if (!Array.isArray(raw)) return Array.from({ length: maxRank }, () => 1)
  const costs: number[] = []
  for (let index = 0; index < maxRank; index += 1) {
    const entry = raw[index]
    costs.push(typeof entry === 'number' && entry >= 0 ? Math.round(entry) : 1)
  }
  return costs
}

function normalizeValueByRank(raw: unknown): Record<number, AbilityValue | AttributeValue> {
  if (!raw || typeof raw !== 'object') return {}
  const next: Record<number, AbilityValue | AttributeValue> = {}
  for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
    const rank = Number(key)
    if (!Number.isFinite(rank) || rank < 1) continue
    if (value === null || typeof value === 'number' || typeof value === 'boolean' || typeof value === 'string') {
      next[rank] = value as AbilityValue | AttributeValue
    } else if (typeof value === 'object' && value !== null && 'count' in value && 'sides' in value) {
      next[rank] = value as AbilityValue | AttributeValue
    }
  }
  return next
}

export function normalizeDefinitionProgression(raw: Partial<DefinitionProgression> | undefined): DefinitionProgression {
  const mode: ProgressionMode = raw?.mode === 'upgradeable' ? 'upgradeable' : 'fixed'
  const maxRank = clampRank(raw?.maxRank, mode === 'upgradeable' ? 5 : 1)
  return {
    mode,
    maxRank,
    rankCosts: normalizeRankCosts(raw?.rankCosts, maxRank),
    valueByRank: normalizeValueByRank(raw?.valueByRank),
  }
}

function normalizeAutoAbilityGrant(raw: Partial<ClassProgressionAbilityGrant>): ClassProgressionAbilityGrant {
  return {
    definitionId: typeof raw.definitionId === 'string' ? raw.definitionId : '',
    value: (raw.value ?? null) as AbilityValue,
    triggerId: raw.triggerId && isItemTriggerId(raw.triggerId) ? raw.triggerId : null,
  }
}

function normalizeAutoAttributeGrant(raw: Partial<ClassProgressionAttributeGrant>): ClassProgressionAttributeGrant {
  return {
    definitionId: typeof raw.definitionId === 'string' ? raw.definitionId : '',
    value: (raw.value ?? null) as AttributeValue,
  }
}

function normalizeRankGrant(raw: Partial<ClassProgressionRankGrant>): ClassProgressionRankGrant {
  return {
    definitionId: typeof raw.definitionId === 'string' ? raw.definitionId : '',
    rank: clampRank(raw.rank, 1),
  }
}

export function normalizeClassLevelProgressionEntry(
  raw: Partial<ClassLevelProgressionEntry> | undefined,
  fallbackLevel: number,
): ClassLevelProgressionEntry {
  const level = normalizeCharacterLevel(raw?.level ?? fallbackLevel)
  return {
    level,
    xpRequired: typeof raw?.xpRequired === 'number' && raw.xpRequired >= 0 ? Math.round(raw.xpRequired) : 0,
    abilityPointsGranted:
      typeof raw?.abilityPointsGranted === 'number' && raw.abilityPointsGranted >= 0
        ? Math.round(raw.abilityPointsGranted)
        : 0,
    attributePointsGranted:
      typeof raw?.attributePointsGranted === 'number' && raw.attributePointsGranted >= 0
        ? Math.round(raw.attributePointsGranted)
        : 0,
    autoAbilityGrants: Array.isArray(raw?.autoAbilityGrants)
      ? raw.autoAbilityGrants.map((entry) => normalizeAutoAbilityGrant(entry))
      : [],
    autoAttributeGrants: Array.isArray(raw?.autoAttributeGrants)
      ? raw.autoAttributeGrants.map((entry) => normalizeAutoAttributeGrant(entry))
      : [],
    abilityRankGrants: Array.isArray(raw?.abilityRankGrants)
      ? raw.abilityRankGrants.map((entry) => normalizeRankGrant(entry))
      : [],
    attributeRankGrants: Array.isArray(raw?.attributeRankGrants)
      ? raw.attributeRankGrants.map((entry) => normalizeRankGrant(entry))
      : [],
  }
}

export function createDefaultClassLevelProgression(maxLevel = MAX_CHARACTER_LEVEL): ClassLevelProgressionEntry[] {
  return Array.from({ length: maxLevel }, (_, index) => {
    const level = index + 1
    return normalizeClassLevelProgressionEntry(
      {
        level,
        xpRequired: level === 1 ? 0 : (level - 1) * (level - 1) * 100,
        abilityPointsGranted: level > 1 && level % 2 === 0 ? 1 : 0,
        attributePointsGranted: level > 1 && level % 3 === 0 ? 1 : 0,
      },
      level,
    )
  })
}

export function normalizeClassLevelProgression(
  raw: Partial<ClassLevelProgressionEntry>[] | undefined,
): ClassLevelProgressionEntry[] {
  if (!Array.isArray(raw) || raw.length === 0) return []
  const entries = raw.map((entry, index) => normalizeClassLevelProgressionEntry(entry, index + 1))
  const byLevel = new Map<number, ClassLevelProgressionEntry>()
  for (const entry of entries) {
    byLevel.set(entry.level, entry)
  }
  return [...byLevel.values()].sort((left, right) => left.level - right.level)
}

export function normalizeCharacterClassProgression(
  raw: Partial<CharacterClassProgression> | undefined,
): CharacterClassProgression | null {
  if (!raw?.classId) return null
  return {
    classId: raw.classId,
    level: normalizeCharacterLevel(raw.level),
    experience: typeof raw.experience === 'number' && raw.experience >= 0 ? Math.round(raw.experience) : 0,
  }
}

export function normalizeCharacterProgression(
  raw: Partial<CharacterProgression> | undefined,
  legacyClassId: string | null,
  legacyLevel: number,
): CharacterProgression {
  if (raw && Array.isArray(raw.classes) && raw.classes.length > 0) {
    const classes = raw.classes
      .map((entry) => normalizeCharacterClassProgression(entry))
      .filter((entry): entry is CharacterClassProgression => Boolean(entry))
    return {
      classes,
      unspentAbilityPoints:
        typeof raw.unspentAbilityPoints === 'number' && raw.unspentAbilityPoints >= 0
          ? Math.round(raw.unspentAbilityPoints)
          : 0,
      unspentAttributePoints:
        typeof raw.unspentAttributePoints === 'number' && raw.unspentAttributePoints >= 0
          ? Math.round(raw.unspentAttributePoints)
          : 0,
      abilityRanks: normalizeRankMap(raw.abilityRanks),
      attributeRanks: normalizeRankMap(raw.attributeRanks),
    }
  }

  return createEmptyCharacterProgression(legacyClassId, legacyLevel)
}

function normalizeRankMap(raw: Record<string, number> | undefined): Record<string, number> {
  if (!raw) return {}
  const next: Record<string, number> = {}
  for (const [definitionId, rank] of Object.entries(raw)) {
    if (!definitionId.trim()) continue
    next[definitionId] = clampRank(rank, 1)
  }
  return next
}

export function totalCharacterLevel(progression: CharacterProgression): number {
  if (progression.classes.length === 0) return 1
  return Math.max(
    1,
    progression.classes.reduce((sum, entry) => sum + normalizeCharacterLevel(entry.level), 0),
  )
}

export function primaryClassId(progression: CharacterProgression, fallback: string | null): string | null {
  return progression.classes[0]?.classId ?? fallback
}
