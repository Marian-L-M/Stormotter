import type { AbilityDefinition, AbilityValue } from './abilityTypes'
import type { AttributeDefinition, AttributeValue } from './attributeTypes'
import type { CharacterClass } from './characterClassTypes'
import { normalizeCharacterLevel, MAX_CHARACTER_LEVEL } from './characterLevelTypes'
import {
  type CharacterClassProgression,
  type CharacterProgression,
  type ClassLevelProgressionEntry,
  type DefinitionProgression,
  type LevelUpEvent,
  totalCharacterLevel,
} from './progressionTypes'

export interface ApplyExperienceResult {
  progression: CharacterProgression
  level: number
  events: LevelUpEvent[]
}

export function getClassProgressionEntry(
  characterClass: CharacterClass | undefined,
  level: number,
): ClassLevelProgressionEntry | undefined {
  if (!characterClass?.levelProgression?.length) return undefined
  const normalized = normalizeCharacterLevel(level)
  return characterClass.levelProgression.find((entry) => entry.level === normalized)
}

export function xpRequiredForClassLevel(
  characterClass: CharacterClass | undefined,
  level: number,
): number {
  const entry = getClassProgressionEntry(characterClass, level)
  return entry?.xpRequired ?? 0
}

export function nextClassLevelXpRequired(
  characterClass: CharacterClass | undefined,
  currentLevel: number,
): number | null {
  const nextLevel = currentLevel + 1
  if (nextLevel > MAX_CHARACTER_LEVEL) return null
  const entry = getClassProgressionEntry(characterClass, nextLevel)
  if (!entry) return null
  return entry.xpRequired
}

export function canClassLevelUp(
  characterClass: CharacterClass | undefined,
  classTrack: CharacterClassProgression,
): boolean {
  const nextXp = nextClassLevelXpRequired(characterClass, classTrack.level)
  if (nextXp === null) return false
  return classTrack.experience >= nextXp
}

function applyClassLevelUpRewards(
  progression: CharacterProgression,
  characterClass: CharacterClass,
  _classId: string,
  newLevel: number,
): CharacterProgression {
  const entry = getClassProgressionEntry(characterClass, newLevel)
  if (!entry) return progression

  const next: CharacterProgression = {
    ...progression,
    unspentAbilityPoints: progression.unspentAbilityPoints + entry.abilityPointsGranted,
    unspentAttributePoints: progression.unspentAttributePoints + entry.attributePointsGranted,
    abilityRanks: { ...progression.abilityRanks },
    attributeRanks: { ...progression.attributeRanks },
  }

  for (const grant of entry.abilityRankGrants) {
    if (!grant.definitionId) continue
    const current = next.abilityRanks[grant.definitionId] ?? 0
    next.abilityRanks[grant.definitionId] = Math.max(current, grant.rank)
  }

  for (const grant of entry.attributeRankGrants) {
    if (!grant.definitionId) continue
    const current = next.attributeRanks[grant.definitionId] ?? 0
    next.attributeRanks[grant.definitionId] = Math.max(current, grant.rank)
  }

  return next
}

export function applyExperienceToClass(
  progression: CharacterProgression,
  classId: string,
  amount: number,
  classById: Record<string, CharacterClass | undefined>,
): ApplyExperienceResult {
  if (amount <= 0) {
    return { progression, level: totalCharacterLevel(progression), events: [] }
  }

  let next: CharacterProgression = {
    ...progression,
    classes: progression.classes.map((entry) => ({ ...entry })),
    abilityRanks: { ...progression.abilityRanks },
    attributeRanks: { ...progression.attributeRanks },
  }

  let track = next.classes.find((entry) => entry.classId === classId)
  if (!track) {
    track = { classId, level: 1, experience: 0 }
    next.classes.push(track)
  }

  track.experience += Math.round(amount)
  const events: LevelUpEvent[] = []
  const characterClass = classById[classId]

  while (canClassLevelUp(characterClass, track)) {
    const fromLevel = track.level
    const toLevel = fromLevel + 1
    track.level = toLevel
    next = applyClassLevelUpRewards(next, characterClass!, classId, toLevel)
    events.push({
      classId,
      fromLevel,
      toLevel,
      abilityPointsGranted:
        getClassProgressionEntry(characterClass, toLevel)?.abilityPointsGranted ?? 0,
      attributePointsGranted:
        getClassProgressionEntry(characterClass, toLevel)?.attributePointsGranted ?? 0,
    })
  }

  return {
    progression: next,
    level: totalCharacterLevel(next),
    events,
  }
}

export function getEffectiveAbilityRank(
  definitionId: string,
  progression: CharacterProgression,
  classProgressions: CharacterClassProgression[],
  classById: Record<string, CharacterClass | undefined>,
): number {
  let rank = progression.abilityRanks[definitionId] ?? 0

  for (const track of classProgressions) {
    const characterClass = classById[track.classId]
    if (!characterClass) continue
    for (let level = 1; level <= track.level; level += 1) {
      const entry = getClassProgressionEntry(characterClass, level)
      for (const grant of entry?.abilityRankGrants ?? []) {
        if (grant.definitionId === definitionId) {
          rank = Math.max(rank, grant.rank)
        }
      }
    }
  }

  return rank
}

export function getEffectiveAttributeRank(
  definitionId: string,
  progression: CharacterProgression,
  classProgressions: CharacterClassProgression[],
  classById: Record<string, CharacterClass | undefined>,
): number {
  let rank = progression.attributeRanks[definitionId] ?? 0

  for (const track of classProgressions) {
    const characterClass = classById[track.classId]
    if (!characterClass) continue
    for (let level = 1; level <= track.level; level += 1) {
      const entry = getClassProgressionEntry(characterClass, level)
      for (const grant of entry?.attributeRankGrants ?? []) {
        if (grant.definitionId === definitionId) {
          rank = Math.max(rank, grant.rank)
        }
      }
    }
  }

  return rank
}

export function resolveRankValue<T extends AbilityValue | AttributeValue>(
  progressionMeta: DefinitionProgression,
  rank: number,
): T | null {
  if (rank <= 0) return null
  const capped = Math.min(rank, progressionMeta.maxRank)
  const value = progressionMeta.valueByRank[capped]
  return (value ?? progressionMeta.valueByRank[rank] ?? null) as T | null
}

export function rankPointCost(progressionMeta: DefinitionProgression, targetRank: number): number {
  if (targetRank <= 0) return 0
  const index = targetRank - 1
  return progressionMeta.rankCosts[index] ?? progressionMeta.rankCosts.at(-1) ?? 1
}

export function spendAbilityPoint(
  progression: CharacterProgression,
  definition: AbilityDefinition,
  classById: Record<string, CharacterClass | undefined>,
): CharacterProgression | null {
  if (definition.progression.mode !== 'upgradeable') return null
  const currentRank = getEffectiveAbilityRank(definition.id, progression, progression.classes, classById)
  const nextRank = currentRank + 1
  if (nextRank > definition.progression.maxRank) return null
  const cost = rankPointCost(definition.progression, nextRank)
  if (progression.unspentAbilityPoints < cost) return null

  return {
    ...progression,
    unspentAbilityPoints: progression.unspentAbilityPoints - cost,
    abilityRanks: {
      ...progression.abilityRanks,
      [definition.id]: Math.max(progression.abilityRanks[definition.id] ?? 0, nextRank),
    },
  }
}

export function spendAttributePoint(
  progression: CharacterProgression,
  definition: AttributeDefinition,
  classById: Record<string, CharacterClass | undefined>,
): CharacterProgression | null {
  if (definition.progression.mode !== 'upgradeable') return null
  const currentRank = getEffectiveAttributeRank(definition.id, progression, progression.classes, classById)
  const nextRank = currentRank + 1
  if (nextRank > definition.progression.maxRank) return null
  const cost = rankPointCost(definition.progression, nextRank)
  if (progression.unspentAttributePoints < cost) return null

  return {
    ...progression,
    unspentAttributePoints: progression.unspentAttributePoints - cost,
    attributeRanks: {
      ...progression.attributeRanks,
      [definition.id]: Math.max(progression.attributeRanks[definition.id] ?? 0, nextRank),
    },
  }
}

export function classLevelForGrants(
  progression: CharacterProgression,
  classId: string | null,
  totalLevel: number,
): number {
  if (!classId) return totalLevel
  const track = progression.classes.find((entry) => entry.classId === classId)
  return track ? track.level : totalLevel
}

export function collectClassAutoAbilityValues(
  progression: CharacterProgression,
  definitionId: string,
  classById: Record<string, CharacterClass | undefined>,
): AbilityValue[] {
  const values: AbilityValue[] = []
  for (const track of progression.classes) {
    const characterClass = classById[track.classId]
    if (!characterClass) continue
    for (let level = 1; level <= track.level; level += 1) {
      const entry = getClassProgressionEntry(characterClass, level)
      for (const grant of entry?.autoAbilityGrants ?? []) {
        if (grant.definitionId === definitionId) values.push(grant.value)
      }
    }
  }
  return values
}

export function collectClassAutoAttributeValues(
  progression: CharacterProgression,
  definitionId: string,
  classById: Record<string, CharacterClass | undefined>,
): AttributeValue[] {
  const values: AttributeValue[] = []
  for (const track of progression.classes) {
    const characterClass = classById[track.classId]
    if (!characterClass) continue
    for (let level = 1; level <= track.level; level += 1) {
      const entry = getClassProgressionEntry(characterClass, level)
      for (const grant of entry?.autoAttributeGrants ?? []) {
        if (grant.definitionId === definitionId) values.push(grant.value)
      }
    }
  }
  return values
}

/** When multiple grants exist for the same ability, use the highest rank value only (no stacking). */
export function resolveAbilityValueForCharacter(
  definition: AbilityDefinition,
  progression: CharacterProgression,
  classById: Record<string, CharacterClass | undefined>,
  legacyGrantValues: AbilityValue[],
): AbilityValue | null {
  const rank = getEffectiveAbilityRank(definition.id, progression, progression.classes, classById)
  const rankValue = rank > 0 ? resolveRankValue<AbilityValue>(definition.progression, rank) : null
  if (rankValue !== null) return rankValue

  const autoValues = collectClassAutoAbilityValues(progression, definition.id, classById)
  if (autoValues.length > 0) return autoValues.at(-1) ?? null

  if (legacyGrantValues.length === 0) return null
  return legacyGrantValues.at(-1) ?? null
}

export function resolveAttributeValueForCharacter(
  definition: AttributeDefinition,
  progression: CharacterProgression,
  classById: Record<string, CharacterClass | undefined>,
  legacyGrantValues: AttributeValue[],
): AttributeValue | null {
  const rank = getEffectiveAttributeRank(definition.id, progression, progression.classes, classById)
  const rankValue = rank > 0 ? resolveRankValue<AttributeValue>(definition.progression, rank) : null
  if (rankValue !== null) return rankValue

  const autoValues = collectClassAutoAttributeValues(progression, definition.id, classById)
  if (autoValues.length > 0) return autoValues.at(-1) ?? null

  if (legacyGrantValues.length === 0) return null
  return legacyGrantValues.at(-1) ?? null
}

export function syncLegacyLevelFields(
  progression: CharacterProgression,
): { level: number; classId: string | null } {
  return {
    level: totalCharacterLevel(progression),
    classId: progression.classes[0]?.classId ?? null,
  }
}
