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
  stackDefinitionValues,
  type AttributeDefinition,
  type AttributeValue,
  type LevelAttributeGrant,
} from './attributeTypes'
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
  attributeDefinitions: AttributeDefinition[]
  entityValues: Record<string, Record<string, AttributeValue>>
  levelAttributeGrants: Record<string, LevelAttributeGrant[]>
  abilityDefinitions: AbilityDefinition[]
  levelAbilityGrants: Record<string, LevelAbilityBindingGrant[]>
  containers: Container[]
  items: Item[]
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

function collectStatModifiersFromEntities(
  definitions: AttributeDefinition[],
  entityIds: string[],
  entityValues: Record<string, Record<string, AttributeValue>>,
  levelAttributeGrants: Record<string, LevelAttributeGrant[]>,
  characterLevel: number,
): Record<LineageStatKey, number> {
  const totals = Object.fromEntries(LINEAGE_STAT_KEYS.map((stat) => [stat, 0])) as Record<
    LineageStatKey,
    number
  >

  for (const definition of definitions) {
    if (definition.mechanic?.effectTypeId !== 'modifier' || !definition.mechanic.statId) continue
    if (definition.mechanic.statId.startsWith(DERIVED_STAT_HANDLER_PREFIX)) continue
    const statId = definition.mechanic.statId as LineageStatKey
    if (!(statId in totals)) continue

    const values: AttributeValue[] = []
    for (const entityId of entityIds) {
      const grants = levelAttributeGrants[entityId]
      values.push(collectActiveLevelAttributeValues(grants, characterLevel, definition))
      const flat = entityValues[entityId]?.[definition.id]
      if (flat !== undefined) values.push(flat)
    }

    const stacked = stackDefinitionValues(definition, values)
    const numeric = asNumericAttributeValue(stacked)
    if (numeric !== null) totals[statId] += numeric
  }

  return totals
}

function collectDerivedStatModifiersFromEntities(
  definitions: AttributeDefinition[],
  entityIds: string[],
  entityValues: Record<string, Record<string, AttributeValue>>,
  levelAttributeGrants: Record<string, LevelAttributeGrant[]>,
  characterLevel: number,
): DerivedStatModifierMap {
  const totals: DerivedStatModifierMap = {}

  for (const definition of definitions) {
    const target = derivedStatTargetFromMechanic(definition.mechanic)
    if (!target) continue

    const values: AttributeValue[] = []
    for (const entityId of entityIds) {
      const grants = levelAttributeGrants[entityId]
      values.push(collectActiveLevelAttributeValues(grants, characterLevel, definition))
      const flat = entityValues[entityId]?.[definition.id]
      if (flat !== undefined) values.push(flat)
    }

    const stacked = stackDefinitionValues(definition, values)
    const numeric = asNumericAttributeValue(stacked)
    if (numeric === null) continue
    totals[target] = (totals[target] ?? 0) + numeric
  }

  return totals
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

function stackAbilityValues(
  definition: AbilityDefinition,
  values: (AbilityValue | undefined)[],
): AbilityValue {
  return stackDefinitionValues(definition as unknown as AttributeDefinition, values)
}

function collectStatModifiersFromAbilities(
  definitions: AbilityDefinition[],
  grantSources: Array<{ grants: LevelAbilityBindingGrant[] | undefined; level: number }>,
): Record<LineageStatKey, number> {
  const totals = Object.fromEntries(LINEAGE_STAT_KEYS.map((stat) => [stat, 0])) as Record<
    LineageStatKey,
    number
  >

  for (const definition of definitions) {
    if (definition.mechanic?.effectTypeId !== 'modifier' || !definition.mechanic.statId) continue
    if (definition.mechanic.statId.startsWith(DERIVED_STAT_HANDLER_PREFIX)) continue
    const statId = definition.mechanic.statId as LineageStatKey
    if (!(statId in totals)) continue

    const values: AbilityValue[] = []
    for (const source of grantSources) {
      values.push(...collectActiveLevelAbilityValues(source.grants, source.level, definition.id))
    }

    const stacked = stackAbilityValues(definition, values)
    const numeric = asNumericAttributeValue(stacked)
    if (numeric !== null) totals[statId] += numeric
  }

  return totals
}

function collectDerivedStatModifiersFromAbilities(
  definitions: AbilityDefinition[],
  grantSources: Array<{ grants: LevelAbilityBindingGrant[] | undefined; level: number }>,
): DerivedStatModifierMap {
  const totals: DerivedStatModifierMap = {}

  for (const definition of definitions) {
    const target = derivedStatTargetFromMechanic(definition.mechanic)
    if (!target) continue

    const values: AbilityValue[] = []
    for (const source of grantSources) {
      values.push(...collectActiveLevelAbilityValues(source.grants, source.level, definition.id))
    }

    const stacked = stackAbilityValues(definition, values)
    const numeric = asNumericAttributeValue(stacked)
    if (numeric === null) continue
    totals[target] = (totals[target] ?? 0) + numeric
  }

  return totals
}

function collectSaveBonusesFromAbilities(
  definitions: AbilityDefinition[],
  grantSources: Array<{ grants: LevelAbilityBindingGrant[] | undefined; level: number }>,
): Record<string, number> {
  const totals: Record<string, number> = {}

  for (const definition of definitions) {
    if (definition.mechanic?.effectTypeId !== 'saving_throw' || !definition.mechanic.saveTypeId) {
      continue
    }
    const saveTypeId = definition.mechanic.saveTypeId

    const values: AbilityValue[] = []
    for (const source of grantSources) {
      values.push(...collectActiveLevelAbilityValues(source.grants, source.level, definition.id))
    }

    const stacked = stackAbilityValues(definition, values)
    const numeric = asNumericAttributeValue(stacked)
    if (numeric === null) continue
    totals[saveTypeId] = (totals[saveTypeId] ?? 0) + numeric
  }

  return totals
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

function collectSaveBonusesFromAttributes(
  definitions: AttributeDefinition[],
  entityIds: string[],
  entityValues: Record<string, Record<string, AttributeValue>>,
  levelAttributeGrants: Record<string, LevelAttributeGrant[]>,
  characterLevel: number,
): Record<string, number> {
  const totals: Record<string, number> = {}

  for (const definition of definitions) {
    if (definition.mechanic?.effectTypeId !== 'saving_throw' || !definition.mechanic.saveTypeId) {
      continue
    }
    const saveTypeId = definition.mechanic.saveTypeId

    const values: AttributeValue[] = []
    for (const entityId of entityIds) {
      const grants = levelAttributeGrants[entityId]
      values.push(collectActiveLevelAttributeValues(grants, characterLevel, definition))
      const flat = entityValues[entityId]?.[definition.id]
      if (flat !== undefined) values.push(flat)
    }

    const stacked = stackDefinitionValues(definition, values)
    const numeric = asNumericAttributeValue(stacked)
    if (numeric === null) continue
    totals[saveTypeId] = (totals[saveTypeId] ?? 0) + numeric
  }

  return totals
}

export function resolveDerivedStats(input: ResolveDerivedStatsInput): ResolvedDerivedStats {
  const {
    characterId,
    meta,
    lineageType,
    characterClass,
    attributeDefinitions,
    entityValues,
    levelAttributeGrants,
    abilityDefinitions,
    levelAbilityGrants,
    containers,
    items,
  } = input

  const characterLevel = meta.level
  const typeId = meta.lineageTypeId
  const classId = meta.classId

  const attributeEntityIds = [
    ...(typeId ? [typeId] : []),
    ...(classId ? [classId] : []),
    characterId,
  ]

  const itemIds = getEquippedItemIds(characterId, containers, items)

  const abilityGrantSources = [
    ...(typeId
      ? [{ grants: levelAbilityGrants[typeId], level: characterLevel }]
      : []),
    ...(classId
      ? [{ grants: levelAbilityGrants[classId], level: characterLevel }]
      : []),
    { grants: levelAbilityGrants[characterId], level: characterLevel },
    ...itemIds.map((itemId) => ({ grants: levelAbilityGrants[itemId], level: 1 })),
  ]

  const attributeStatModifiers = collectStatModifiersFromEntities(
    attributeDefinitions,
    [...attributeEntityIds, ...itemIds],
    entityValues,
    levelAttributeGrants,
    characterLevel,
  )
  const abilityStatModifiers = collectStatModifiersFromAbilities(
    abilityDefinitions,
    abilityGrantSources,
  )
  for (const stat of LINEAGE_STAT_KEYS) {
    attributeStatModifiers[stat] += abilityStatModifiers[stat] ?? 0
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

  const attributeDerivedFromCore = collectDerivedStatModifiersFromEntities(
    attributeDefinitions,
    attributeEntityIds,
    entityValues,
    levelAttributeGrants,
    characterLevel,
  )
  const itemDerived = collectDerivedStatModifiersFromEntities(
    attributeDefinitions,
    itemIds,
    entityValues,
    levelAttributeGrants,
    1,
  )
  const abilityDerived = collectDerivedStatModifiersFromAbilities(
    abilityDefinitions,
    abilityGrantSources,
  )

  const saveBonusEntityIds = [...attributeEntityIds, ...itemIds]
  const saveBonusesFromAttributes = collectSaveBonusesFromAttributes(
    attributeDefinitions,
    saveBonusEntityIds,
    entityValues,
    levelAttributeGrants,
    characterLevel,
  )
  const saveBonusesFromAbilities = collectSaveBonusesFromAbilities(
    abilityDefinitions,
    abilityGrantSources,
  )

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
