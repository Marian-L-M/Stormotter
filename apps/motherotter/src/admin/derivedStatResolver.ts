import type { Container } from './containerTypes'
import { CHARACTER_SLOT_DEFINITIONS } from './characterSlotTypes'
import type { Item } from './itemTypes'
import type { CharacterClass } from './characterClassTypes'
import type { CharacterLineageType, CharacterStatValues, LineageStatKey } from './lineageTypes'
import { LINEAGE_STAT_KEYS } from './lineageTypes'
import type { CharacterMeta } from '../store/characterMetaStore'
import {
  collectActiveLevelAbilityValues,
  type AbilityDefinition,
  type AbilityValue,
  type LevelAbilityBindingGrant,
} from './abilityTypes'
import {
  abilityScoreModifier,
  DERIVED_STAT_DEFINITION_BY_KEY,
  DERIVED_STAT_HANDLER_PREFIX,
  DERIVED_STAT_KEYS,
  DERIVED_STAT_SAVE_TYPE_IDS,
  resolveDerivedStatKey,
  resolveDerivedStatBase,
  type DerivedStatKey,
  type DerivedStatModifierMap,
} from './derivedStatTypes'
import {
  collectActiveLevelAttributeValues,
  type AttributeDefinition,
  type AttributeValue,
  type LevelAttributeGrant,
} from './attributeTypes'
import { totalCharacterLevel } from './progressionTypes'
import {
  resolveAbilityValueForCharacter,
  resolveAttributeValueForCharacter,
} from './progressionUtils'
import type { MechanicComposition } from '@otter/mechanics-core'

const EQUIPMENT_SLOT_GROUPS = new Set(['equipment', 'quick_bar', 'quiver'])

export interface DerivedStatBreakdown {
  key: DerivedStatKey
  base: number
  statModifier: number
  typeModifier: number
  classModifier: number
  characterModifier: number
  itemModifier: number
  attributeModifier: number
  abilityModifier: number
  total: number
}

export interface ResolvedDerivedStats {
  effectiveAbilityScores: Record<LineageStatKey, number>
  abilityScoreModifiers: Record<LineageStatKey, number>
  stats: Record<DerivedStatKey, DerivedStatBreakdown>
}

export interface ResolveDerivedStatsInput {
  characterId: string
  meta: CharacterMeta
  lineageType: CharacterLineageType | undefined
  characterClass: CharacterClass | undefined
  characterClasses?: CharacterClass[]
  attributeDefinitions: AttributeDefinition[]
  entityValues: Record<string, Record<string, AttributeValue>>
  levelAttributeGrants: Record<string, LevelAttributeGrant[]>
  abilityDefinitions: AbilityDefinition[]
  levelAbilityGrants: Record<string, LevelAbilityBindingGrant[]>
  containers: Container[]
  items: Item[]
}

function buildClassById(
  characterClass: CharacterClass | undefined,
  characterClasses: CharacterClass[] | undefined,
): Record<string, CharacterClass | undefined> {
  const entries = characterClasses ?? (characterClass ? [characterClass] : [])
  return Object.fromEntries(entries.map((entry) => [entry.id, entry]))
}

function collectLegacyAbilityValues(
  definitionId: string,
  characterId: string,
  lineageTypeId: string | null,
  progression: CharacterMeta['progression'],
  totalLevel: number,
  levelAbilityGrants: Record<string, LevelAbilityBindingGrant[]>,
  itemIds: string[],
): AbilityValue[] {
  const values: AbilityValue[] = []
  if (lineageTypeId) {
    values.push(
      ...collectActiveLevelAbilityValues(levelAbilityGrants[lineageTypeId], totalLevel, definitionId),
    )
  }
  for (const track of progression.classes) {
    values.push(
      ...collectActiveLevelAbilityValues(
        levelAbilityGrants[track.classId],
        track.level,
        definitionId,
      ),
    )
  }
  values.push(
    ...collectActiveLevelAbilityValues(levelAbilityGrants[characterId], totalLevel, definitionId),
  )
  for (const itemId of itemIds) {
    values.push(...collectActiveLevelAbilityValues(levelAbilityGrants[itemId], 1, definitionId))
  }
  return values
}

function collectLegacyAttributeValues(
  definition: AttributeDefinition,
  entityIds: string[],
  entityValues: Record<string, Record<string, AttributeValue>>,
  levelAttributeGrants: Record<string, LevelAttributeGrant[]>,
  levelByEntityId: Record<string, number>,
): AttributeValue[] {
  const values: AttributeValue[] = []
  for (const entityId of entityIds) {
    const level = levelByEntityId[entityId] ?? 1
    values.push(collectActiveLevelAttributeValues(levelAttributeGrants[entityId], level, definition))
    const flat = entityValues[entityId]?.[definition.id]
    if (flat !== undefined) values.push(flat)
  }
  return values
}

function resolveAbilityNumericForCharacter(
  definition: AbilityDefinition,
  characterId: string,
  meta: CharacterMeta,
  classById: Record<string, CharacterClass | undefined>,
  levelAbilityGrants: Record<string, LevelAbilityBindingGrant[]>,
  itemIds: string[],
): number | null {
  const totalLevel = totalCharacterLevel(meta.progression)
  const legacyValues = collectLegacyAbilityValues(
    definition.id,
    characterId,
    meta.lineageTypeId,
    meta.progression,
    totalLevel,
    levelAbilityGrants,
    itemIds,
  )
  const resolved = resolveAbilityValueForCharacter(
    definition,
    meta.progression,
    classById,
    legacyValues,
  )
  return asNumericAttributeValue(resolved ?? undefined)
}

function resolveAttributeNumericForCharacter(
  definition: AttributeDefinition,
  entityIds: string[],
  entityValues: Record<string, Record<string, AttributeValue>>,
  levelAttributeGrants: Record<string, LevelAttributeGrant[]>,
  levelByEntityId: Record<string, number>,
  meta: CharacterMeta,
  classById: Record<string, CharacterClass | undefined>,
): number | null {
  const legacyValues = collectLegacyAttributeValues(
    definition,
    entityIds,
    entityValues,
    levelAttributeGrants,
    levelByEntityId,
  )
  const resolved = resolveAttributeValueForCharacter(
    definition,
    meta.progression,
    classById,
    legacyValues,
  )
  return asNumericAttributeValue(resolved ?? undefined)
}

function derivedStatTargetFromMechanic(mechanic: MechanicComposition | null | undefined): DerivedStatKey | null {
  if (!mechanic) return null

  if (mechanic.effectTypeId === 'modifier' && mechanic.statId?.startsWith(DERIVED_STAT_HANDLER_PREFIX)) {
    return resolveDerivedStatKey(mechanic.statId.slice(DERIVED_STAT_HANDLER_PREFIX.length))
  }

  if (mechanic.effectTypeId !== 'magic' || !mechanic.customHandlerId) return null

  const handler = mechanic.customHandlerId
  if (handler.startsWith(DERIVED_STAT_HANDLER_PREFIX)) {
    return resolveDerivedStatKey(handler.slice(DERIVED_STAT_HANDLER_PREFIX.length))
  }

  return resolveDerivedStatKey(handler)
}

function asNumericAttributeValue(value: AttributeValue | undefined): number | null {
  if (value === null || value === undefined) return null
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'boolean') return value ? 1 : 0
  return null
}

function getEquippedItemIds(characterId: string, containers: Container[], items: Item[]): string[] {
  const equipSlotKeys = new Set(
    CHARACTER_SLOT_DEFINITIONS.filter((entry) => EQUIPMENT_SLOT_GROUPS.has(entry.group)).map(
      (entry) => entry.slotKey,
    ),
  )
  const equipContainerIds = new Set(
    containers
      .filter(
        (entry) =>
          entry.characterId === characterId &&
          entry.kind === 'character_slot' &&
          entry.slotKey &&
          equipSlotKeys.has(entry.slotKey),
      )
      .map((entry) => entry.id),
  )

  return items
    .filter((entry) => entry.containerId && equipContainerIds.has(entry.containerId))
    .map((entry) => entry.id)
}

function computeEffectiveAbilityScores(
  baseStats: CharacterStatValues,
  attributeStatModifiers: Record<LineageStatKey, number>,
): Record<LineageStatKey, number> {
  const effective = {} as Record<LineageStatKey, number>
  for (const stat of LINEAGE_STAT_KEYS) {
    const base = baseStats[stat] ?? 0
    effective[stat] = base + (attributeStatModifiers[stat] ?? 0)
  }
  return effective
}

function computeStatModifierContribution(
  key: DerivedStatKey,
  effectiveScores: Record<LineageStatKey, number>,
): number {
  const definition = DERIVED_STAT_DEFINITION_BY_KEY[key]
  if (!definition.statContribution || definition.linkedStats.length === 0) return 0

  const contributions = definition.linkedStats.map((stat) => {
    const score = effectiveScores[stat]
    if (definition.statContribution === 'modifier') {
      return abilityScoreModifier(score)
    }
    if (definition.statContribution === 'score_multiplier') {
      const effectiveScore = Number.isFinite(score) ? score : 0
      return effectiveScore * definition.scoreMultiplier
    }
    return 0
  })

  switch (definition.statCombination) {
    case 'sum_modifiers':
      return contributions.reduce((sum, value) => sum + value, 0)
    case 'max_modifier':
      return contributions.length > 0 ? Math.max(...contributions) : 0
    case 'single':
    default:
      return contributions[0] ?? 0
  }
}

export function resolveDerivedStats(input: ResolveDerivedStatsInput): ResolvedDerivedStats {
  const {
    characterId,
    meta,
    lineageType,
    characterClass,
    characterClasses,
    attributeDefinitions,
    entityValues,
    levelAttributeGrants,
    abilityDefinitions,
    levelAbilityGrants,
    containers,
    items,
  } = input

  const totalLevel = totalCharacterLevel(meta.progression)
  const typeId = meta.lineageTypeId
  const classById = buildClassById(characterClass, characterClasses)

  const attributeEntityIds = [
    ...(typeId ? [typeId] : []),
    ...meta.progression.classes.map((track) => track.classId),
    ...(meta.classId && !meta.progression.classes.some((track) => track.classId === meta.classId)
      ? [meta.classId]
      : []),
    characterId,
  ]

  const levelByEntityId: Record<string, number> = {
    [characterId]: totalLevel,
  }
  if (typeId) levelByEntityId[typeId] = totalLevel
  for (const track of meta.progression.classes) {
    levelByEntityId[track.classId] = track.level
  }
  if (meta.classId && levelByEntityId[meta.classId] === undefined) {
    levelByEntityId[meta.classId] = totalLevel
  }

  const itemIds = getEquippedItemIds(characterId, containers, items)
  for (const itemId of itemIds) {
    levelByEntityId[itemId] = 1
  }

  const attributeStatModifiers = Object.fromEntries(
    LINEAGE_STAT_KEYS.map((stat) => [stat, 0]),
  ) as Record<LineageStatKey, number>

  for (const definition of attributeDefinitions) {
    if (definition.mechanic?.effectTypeId !== 'modifier' || !definition.mechanic.statId) continue
    if (definition.mechanic.statId.startsWith(DERIVED_STAT_HANDLER_PREFIX)) continue
    const statId = definition.mechanic.statId as LineageStatKey
    if (!(statId in attributeStatModifiers)) continue

    const coreNumeric = resolveAttributeNumericForCharacter(
      definition,
      [...attributeEntityIds, ...itemIds],
      entityValues,
      levelAttributeGrants,
      levelByEntityId,
      meta,
      classById,
    )
    if (coreNumeric !== null) attributeStatModifiers[statId] += coreNumeric
  }

  for (const definition of abilityDefinitions) {
    if (definition.mechanic?.effectTypeId !== 'modifier' || !definition.mechanic.statId) continue
    if (definition.mechanic.statId.startsWith(DERIVED_STAT_HANDLER_PREFIX)) continue
    const statId = definition.mechanic.statId as LineageStatKey
    if (!(statId in attributeStatModifiers)) continue

    const numeric = resolveAbilityNumericForCharacter(
      definition,
      characterId,
      meta,
      classById,
      levelAbilityGrants,
      itemIds,
    )
    if (numeric !== null) attributeStatModifiers[statId] += numeric
  }

  const effectiveAbilityScores = computeEffectiveAbilityScores(meta.stats, attributeStatModifiers)
  const abilityScoreModifiers = Object.fromEntries(
    LINEAGE_STAT_KEYS.map((stat) => [stat, abilityScoreModifier(effectiveAbilityScores[stat])]),
  ) as Record<LineageStatKey, number>

  const typeBases = lineageType?.derivedStatBases ?? {}
  const classBases = characterClass?.derivedStatBases ?? {}
  const characterBases = meta.derivedStatBases ?? {}

  const typeModifiers = lineageType?.derivedStatModifiers ?? {}
  const classModifiers = characterClass?.derivedStatModifiers ?? {}
  const characterModifiers = meta.derivedStatModifiers ?? {}

  const attributeDerivedFromCore: DerivedStatModifierMap = {}
  for (const definition of attributeDefinitions) {
    const target = derivedStatTargetFromMechanic(definition.mechanic)
    if (!target) continue
    const numeric = resolveAttributeNumericForCharacter(
      definition,
      attributeEntityIds,
      entityValues,
      levelAttributeGrants,
      levelByEntityId,
      meta,
      classById,
    )
    if (numeric === null) continue
    attributeDerivedFromCore[target] = (attributeDerivedFromCore[target] ?? 0) + numeric
  }

  const itemDerived: DerivedStatModifierMap = {}
  for (const definition of attributeDefinitions) {
    const target = derivedStatTargetFromMechanic(definition.mechanic)
    if (!target) continue
    const numeric = resolveAttributeNumericForCharacter(
      definition,
      itemIds,
      entityValues,
      levelAttributeGrants,
      levelByEntityId,
      meta,
      classById,
    )
    if (numeric === null) continue
    itemDerived[target] = (itemDerived[target] ?? 0) + numeric
  }

  const abilityDerived: DerivedStatModifierMap = {}
  for (const definition of abilityDefinitions) {
    const target = derivedStatTargetFromMechanic(definition.mechanic)
    if (!target) continue
    const numeric = resolveAbilityNumericForCharacter(
      definition,
      characterId,
      meta,
      classById,
      levelAbilityGrants,
      itemIds,
    )
    if (numeric === null) continue
    abilityDerived[target] = (abilityDerived[target] ?? 0) + numeric
  }

  const saveBonusesFromAttributes: Record<string, number> = {}
  for (const definition of attributeDefinitions) {
    if (definition.mechanic?.effectTypeId !== 'saving_throw' || !definition.mechanic.saveTypeId) {
      continue
    }
    const saveTypeId = definition.mechanic.saveTypeId
    const numeric = resolveAttributeNumericForCharacter(
      definition,
      [...attributeEntityIds, ...itemIds],
      entityValues,
      levelAttributeGrants,
      levelByEntityId,
      meta,
      classById,
    )
    if (numeric === null) continue
    saveBonusesFromAttributes[saveTypeId] = (saveBonusesFromAttributes[saveTypeId] ?? 0) + numeric
  }

  const saveBonusesFromAbilities: Record<string, number> = {}
  for (const definition of abilityDefinitions) {
    if (definition.mechanic?.effectTypeId !== 'saving_throw' || !definition.mechanic.saveTypeId) {
      continue
    }
    const saveTypeId = definition.mechanic.saveTypeId
    const numeric = resolveAbilityNumericForCharacter(
      definition,
      characterId,
      meta,
      classById,
      levelAbilityGrants,
      itemIds,
    )
    if (numeric === null) continue
    saveBonusesFromAbilities[saveTypeId] = (saveBonusesFromAbilities[saveTypeId] ?? 0) + numeric
  }

  const stats = {} as Record<DerivedStatKey, DerivedStatBreakdown>

  for (const key of DERIVED_STAT_KEYS) {
    const base = resolveDerivedStatBase(key, characterBases, classBases, typeBases)
    const statModifier = computeStatModifierContribution(key, effectiveAbilityScores)
    const typeModifier = typeModifiers[key] ?? 0
    const classModifier = classModifiers[key] ?? 0
    const characterModifier = characterModifiers[key] ?? 0
    const itemModifier = itemDerived[key] ?? 0
    let attributeModifier = attributeDerivedFromCore[key] ?? 0
    const saveTypeId = DERIVED_STAT_SAVE_TYPE_IDS[key]
    if (saveTypeId) {
      attributeModifier += saveBonusesFromAttributes[saveTypeId] ?? 0
      attributeModifier += saveBonusesFromAbilities[saveTypeId] ?? 0
    }
    const abilityModifier = abilityDerived[key] ?? 0

    const total =
      base +
      statModifier +
      typeModifier +
      classModifier +
      characterModifier +
      itemModifier +
      attributeModifier +
      abilityModifier

    stats[key] = {
      key,
      base,
      statModifier,
      typeModifier,
      classModifier,
      characterModifier,
      itemModifier,
      attributeModifier,
      abilityModifier,
      total,
    }
  }

  return {
    effectiveAbilityScores,
    abilityScoreModifiers,
    stats,
  }
}
