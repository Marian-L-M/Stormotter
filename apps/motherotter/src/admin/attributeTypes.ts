import {
  applyEffectTypeConstraints,
  ATTRIBUTE_TYPES,
  compileCombatStats,
  DAMAGE_STACKING_RULES,
  deriveMechanicKey,
  isActiveMechanic,
  mechanicFromLegacyBinding,
  normalizeAttributeKey,
  normalizeMechanicComposition,
  resolveCompositionToBinding,
  stackValuesByRule,
  createEmptyMechanic,
  type DamageStackingRule,
  type MechanicComposition,
  type StackingRule,
  type ValueKind,
} from '@otter/mechanics-core'

export type {
  AttributeBinding,
  AttributeBindingKind,
  CompiledCombatStats,
  DamageTypeGroup,
  MechanicBlock,
  MechanicComposition,
  DamageStackingRule,
  MechanicsRegistry,
  RegistryEntry,
  StackingRule,
  ValueKind,
} from '@otter/mechanics-core'

export {
  applyEffectTypeConstraints,
  ATTRIBUTE_TYPES,
  createEmptyMechanic,
  DAMAGE_TYPE_GROUPS,
  DEFAULT_CONDITIONS,
  DEFAULT_DAMAGE_TYPES,
  DEFAULT_MAGIC_EFFECTS,
  DEFAULT_MECHANICS_REGISTRY,
  DEFAULT_SAVE_TYPES,
  DEFAULT_STATS,
  deriveMechanicKey,
  formatMechanicComposition,
  formatCompiledCombatStats,
  getMechanicBlocks,
  isActiveMechanic,
  normalizeMechanicComposition,
  RESISTANCE_ROLES,
  resolveDamageTypeTab,
  STACKING_RULE_LABELS,
  VALUE_KIND_LABELS,
  compileCombatStats,
  DAMAGE_STACKING_RULE_LABELS,
  DAMAGE_STACKING_RULES,
} from '@otter/mechanics-core'

import { normalizeCharacterLevel } from './characterLevelTypes'
import {
  combineDiceRolls,
  formatDiceRoll,
  isEmptyDiceRoll,
  normalizeDiceRoll,
  type DiceRoll,
} from './diceTypes'

export type AttributeInputType = 'percentile' | 'number' | 'dice' | 'boolean' | 'text'

export const DAMAGE_INPUT_TYPES: AttributeInputType[] = ['percentile', 'number', 'dice']

export type AttributeSource = 'standard' | 'custom'

export interface AttributeCategory {
  id: string
  name: string
}

export interface AttributeDefinition {
  id: string
  /** Stable slug for engine export — never parse display name */
  key: string
  name: string
  inputType: AttributeInputType
  source: AttributeSource
  categoryId: string | null
  description: string
  /** Composed mechanic axes; null = narrative / display only */
  mechanic: MechanicComposition | null
  updatedAt: string
}

export type AttributeValue = number | boolean | string | DiceRoll | null

export function isDiceRollValue(value: AttributeValue | undefined): value is DiceRoll {
  if (!value || typeof value !== 'object') return false
  return 'count' in value && 'sides' in value
}

export interface LevelAttributeGrant {
  level: number
  values: Record<string, AttributeValue>
  /** Attribute definitions assigned at this level (standard and custom) */
  definitionIds: string[]
}

export interface AttributesContent {
  categories: AttributeCategory[]
  definitions: AttributeDefinition[]
  entityValues: Record<string, Record<string, AttributeValue>>
  customAssignments: Record<string, string[]>
  levelAttributeGrants: Record<string, LevelAttributeGrant[]>
}

export type AttributeDefinitionPatch = Partial<
  Pick<AttributeDefinition, 'name' | 'inputType' | 'description' | 'mechanic'>
>

export interface MechanicBuilderApplyResult {
  mechanic: MechanicComposition | null
  inputType: AttributeInputType
}

export function deriveCategoryNameForMechanic(mechanic: MechanicComposition | null | undefined): string | null {
  if (!mechanic?.effectTypeId) return null
  const entry = ATTRIBUTE_TYPES.find((type) => type.id === mechanic.effectTypeId)
  return entry?.name ?? null
}

export function defaultInputTypeForAttributeType(effectTypeId: string | null): AttributeInputType {
  switch (effectTypeId) {
    case 'damage':
      return 'percentile'
    case 'resistance':
      return 'percentile'
    case 'condition':
      return 'boolean'
    case 'modifier':
    case 'saving_throw':
    case 'magic':
      return 'number'
    default:
      return 'number'
  }
}

export function deriveInputTypeFromMechanic(
  mechanic: MechanicComposition | null | undefined,
  fallback: AttributeInputType = 'number',
): AttributeInputType {
  if (!mechanic?.effectTypeId) return fallback
  const normalized = normalizeMechanicComposition(mechanic)
  switch (normalized.valueKind) {
    case 'ratio':
      return 'percentile'
    case 'boolean':
      return 'boolean'
    case 'text':
      return 'text'
    case 'integer':
      return 'number'
    case 'dice':
      return 'dice'
    default:
      return defaultInputTypeForAttributeType(normalized.effectTypeId)
  }
}

function findCategoryIdByName(categories: AttributeCategory[], name: string): string | null {
  const normalized = name.trim().toLowerCase()
  const match = categories.find((entry) => entry.name.toLowerCase() === normalized)
  return match?.id ?? null
}

export function ensureAttributeTypeCategories(categories: AttributeCategory[]): AttributeCategory[] {
  const next = [...categories]
  for (const type of ATTRIBUTE_TYPES) {
    if (!findCategoryIdByName(next, type.name)) {
      next.push({ id: createAttributeCategoryId(), name: type.name })
    }
  }
  return next
}

export function deriveCategoryIdForMechanic(
  categories: AttributeCategory[],
  mechanic: MechanicComposition | null | undefined,
): string | null {
  const categoryName = deriveCategoryNameForMechanic(mechanic)
  if (!categoryName) return null
  return findCategoryIdByName(categories, categoryName)
}

export function resolveDefinitionKey(
  name: string,
  mechanic: MechanicComposition | null | undefined,
  usedKeys: Set<string>,
): string {
  if (isActiveMechanic(mechanic)) {
    return normalizeAttributeKey(deriveMechanicKey(mechanic, name), name, usedKeys)
  }
  return normalizeAttributeKey(name, name, usedKeys)
}

export const ATTRIBUTE_INPUT_TYPE_LABELS: Record<AttributeInputType, string> = {
  percentile: 'Percentile',
  number: 'Number',
  dice: 'Dice',
  boolean: 'Boolean',
  text: 'Text',
}

export const ATTRIBUTE_SOURCE_LABELS: Record<AttributeSource, string> = {
  standard: 'Standard',
  custom: 'Custom',
}

export function createAttributeId(): string {
  return `attr-${crypto.randomUUID().slice(0, 8)}`
}

export function createAttributeCategoryId(): string {
  return `attr-cat-${crypto.randomUUID().slice(0, 8)}`
}

export const UNCATEGORIZED_ATTRIBUTE_CATEGORY = 'Uncategorized'

export function defaultValueForInputType(inputType: AttributeInputType): AttributeValue {
  switch (inputType) {
    case 'boolean':
      return false
    case 'text':
      return ''
    case 'dice':
      return { count: 1, sides: 6 }
    case 'number':
    case 'percentile':
      return 0
  }
}

export function valueKindForInputType(inputType: AttributeInputType): ValueKind {
  switch (inputType) {
    case 'percentile':
      return 'ratio'
    case 'boolean':
      return 'boolean'
    case 'text':
      return 'text'
    case 'dice':
      return 'dice'
    case 'number':
      return 'integer'
  }
}

export function defaultStackingForInputType(inputType: AttributeInputType): StackingRule {
  switch (inputType) {
    case 'boolean':
      return 'or'
    case 'text':
      return 'join'
    case 'number':
    case 'percentile':
    case 'dice':
      return 'add'
  }
}

function isDamageStackingRule(stacking: StackingRule): stacking is DamageStackingRule {
  return (DAMAGE_STACKING_RULES as readonly StackingRule[]).includes(stacking)
}

export function hydrateMechanicBuilderDraft(
  mechanic: MechanicComposition | null,
  inputType: AttributeInputType,
): { draft: MechanicComposition; inputType: AttributeInputType } {
  const base = mechanic ? normalizeMechanicComposition(mechanic) : createEmptyMechanic()
  const resolvedInputType = inputType
  const draft = syncMechanicWithInputType(base, resolvedInputType) ?? base
  return { draft, inputType: resolvedInputType }
}

export function syncMechanicWithInputType(
  mechanic: MechanicComposition | null,
  inputType: AttributeInputType,
): MechanicComposition | null {
  if (!mechanic?.effectTypeId) return mechanic
  const normalized = normalizeMechanicComposition(mechanic)

  if (normalized.effectTypeId === 'damage') {
    let next: MechanicComposition = { ...normalized }
    if (inputType === 'percentile') {
      next = { ...next, valueKind: 'ratio' }
    } else if (inputType === 'number') {
      next = { ...next, valueKind: 'integer' }
    } else if (inputType === 'dice') {
      next = { ...next, valueKind: 'dice' }
    }
    if (!isDamageStackingRule(next.stacking)) {
      next = { ...next, stacking: 'add' }
    }
    return applyEffectTypeConstraints(next)
  }

  if (inputType === 'percentile' && normalized.valueKind !== 'ratio') {
    return applyEffectTypeConstraints({ ...normalized, valueKind: 'ratio', stacking: 'add' })
  }
  if (inputType === 'boolean' && normalized.valueKind !== 'boolean') {
    return applyEffectTypeConstraints({ ...normalized, valueKind: 'boolean', stacking: 'or' })
  }
  if (inputType === 'text' && normalized.valueKind !== 'text') {
    return applyEffectTypeConstraints({ ...normalized, valueKind: 'text', stacking: 'join' })
  }
  if (inputType === 'number' && normalized.valueKind === 'ratio') {
    return applyEffectTypeConstraints({ ...normalized, valueKind: 'integer', stacking: 'add' })
  }
  return normalized
}

function resolveDefinitionStackingRules(definition: AttributeDefinition): {
  valueKind: ValueKind
  stacking: StackingRule
} {
  const binding = definition.mechanic ? resolveCompositionToBinding(definition.mechanic) : null
  if (binding) {
    return { valueKind: binding.valueKind, stacking: binding.stacking }
  }
  return {
    valueKind: valueKindForInputType(definition.inputType),
    stacking: defaultStackingForInputType(definition.inputType),
  }
}

export function normalizeAttributeValue(
  inputType: AttributeInputType,
  raw: AttributeValue | undefined,
): AttributeValue {
  if (raw === null || raw === undefined) return null

  switch (inputType) {
    case 'boolean':
      return Boolean(raw)
    case 'text':
      return typeof raw === 'string' ? raw : String(raw)
    case 'dice':
      if (isDiceRollValue(raw as AttributeValue)) {
        return normalizeDiceRoll(raw as DiceRoll)
      }
      if (typeof raw === 'string' && raw.trim().length > 0) {
        return raw.trim()
      }
      return normalizeDiceRoll(null)
    case 'number':
      return typeof raw === 'number' && Number.isFinite(raw) ? raw : Number(raw) || 0
    case 'percentile': {
      const numeric = typeof raw === 'number' ? raw : Number(raw)
      if (!Number.isFinite(numeric)) return 0
      return Math.min(100, Math.max(0, Math.round(numeric)))
    }
  }
}

export function normalizeAttributeDefinition(
  raw: Partial<AttributeDefinition> & { id: string },
  usedKeys: Set<string> = new Set(),
  categories: AttributeCategory[] = [],
): AttributeDefinition {
  const name = raw.name?.trim() || 'Untitled attribute'
  let inputType = raw.inputType ?? 'number'

  let mechanic: MechanicComposition | null = null
  const rawRecord = raw as Partial<AttributeDefinition> & { binding?: unknown }
  if (rawRecord.mechanic !== undefined) {
    mechanic =
      rawRecord.mechanic === null
        ? null
        : normalizeMechanicComposition(rawRecord.mechanic)
  } else if (rawRecord.binding !== undefined && rawRecord.binding !== null) {
    mechanic = mechanicFromLegacyBinding(
      rawRecord.binding as Parameters<typeof mechanicFromLegacyBinding>[0],
    )
  }

  if (isActiveMechanic(mechanic)) {
    inputType = deriveInputTypeFromMechanic(mechanic, inputType as AttributeInputType)
    mechanic = syncMechanicWithInputType(mechanic, inputType)
  } else if (mechanic?.effectTypeId) {
    mechanic = syncMechanicWithInputType(mechanic, inputType as AttributeInputType)
  }

  const key = resolveDefinitionKey(name, mechanic, usedKeys)
  usedKeys.add(key)

  const categoryId = isActiveMechanic(mechanic)
    ? deriveCategoryIdForMechanic(categories, mechanic)
    : typeof raw.categoryId === 'string' && raw.categoryId.length > 0
      ? raw.categoryId
      : null

  return {
    id: raw.id,
    key,
    name,
    inputType:
      inputType === 'percentile' ||
      inputType === 'number' ||
      inputType === 'dice' ||
      inputType === 'boolean' ||
      inputType === 'text'
        ? inputType
        : 'number',
    source: raw.source === 'custom' ? 'custom' : 'standard',
    categoryId,
    description: raw.description ?? '',
    mechanic: isActiveMechanic(mechanic) ? mechanic : null,
    updatedAt: raw.updatedAt ?? new Date().toISOString(),
  }
}

export function normalizeAttributeCategory(raw: Partial<AttributeCategory> & { id: string }): AttributeCategory {
  return {
    id: raw.id,
    name: raw.name?.trim() || 'Untitled category',
  }
}

export function normalizeLevelAttributeGrant(raw: Partial<LevelAttributeGrant>): LevelAttributeGrant {
  const level = normalizeCharacterLevel(raw.level)
  const values: Record<string, AttributeValue> = {}
  for (const [definitionId, value] of Object.entries(raw.values ?? {})) {
    if (value === null || value === undefined) continue
    values[definitionId] = value
  }
  const legacy = raw as Partial<LevelAttributeGrant> & { customDefinitionIds?: string[] }
  const definitionIds = [
    ...new Set([
      ...(raw.definitionIds ?? legacy.customDefinitionIds ?? []),
      ...Object.keys(values),
    ]),
  ]
  return { level, values, definitionIds }
}

export function normalizeLevelAttributeGrants(
  raw: Partial<LevelAttributeGrant>[] | undefined,
): LevelAttributeGrant[] {
  if (!raw?.length) return []
  const byLevel = new Map<number, LevelAttributeGrant>()
  for (const entry of raw) {
    const normalized = normalizeLevelAttributeGrant(entry)
    const existing = byLevel.get(normalized.level)
    if (!existing) {
      byLevel.set(normalized.level, normalized)
      continue
    }
    existing.values = { ...existing.values, ...normalized.values }
    existing.definitionIds = [
      ...new Set([...existing.definitionIds, ...normalized.definitionIds]),
    ]
  }
  return [...byLevel.values()].sort((a, b) => a.level - b.level)
}

export function sortLevelAttributeGrants(grants: LevelAttributeGrant[]): LevelAttributeGrant[] {
  return [...grants].sort((a, b) => a.level - b.level)
}

export function getNextLevelAttributeGrantLevel(grants: LevelAttributeGrant[]): number {
  if (grants.length === 0) return 1
  return Math.min(40, Math.max(...grants.map((entry) => entry.level)) + 1)
}

export function stackDefinitionValues(
  definition: AttributeDefinition,
  values: (AttributeValue | undefined)[],
): AttributeValue {
  const defined = values.filter((value) => value !== null && value !== undefined)
  if (defined.length === 0) return null

  const { valueKind, stacking } = resolveDefinitionStackingRules(definition)

  if (valueKind === 'boolean' || valueKind === 'text' || valueKind === 'integer' || valueKind === 'ratio') {
    const stacked = stackValuesByRule(stacking, valueKind, defined as (number | boolean | string)[])
    if (stacked === null) return null
    if (valueKind === 'ratio') {
      return Math.min(100, Math.max(0, Math.round(asNumber(stacked))))
    }
    if (valueKind === 'integer') {
      return asNumber(stacked)
    }
    if (valueKind === 'boolean') {
      return Boolean(stacked)
    }
    return String(stacked)
  }

  if (valueKind === 'dice') {
    return stackDiceAttributeValues(stacking, defined)
  }

  return stackAttributeValues(definition.inputType, values)
}

function stackDiceAttributeValues(
  stacking: StackingRule,
  values: AttributeValue[],
): AttributeValue {
  const rolls = values
    .map((value) => {
      if (isDiceRollValue(value)) return normalizeDiceRoll(value)
      if (typeof value === 'string' && value.trim().length > 0) return null
      return null
    })
    .filter((roll): roll is DiceRoll => roll !== null && !isEmptyDiceRoll(roll))

  if (rolls.length === 0) {
    const expression = values.find((value) => typeof value === 'string' && value.trim().length > 0)
    return typeof expression === 'string' ? expression : null
  }

  if (stacking === 'set') {
    return rolls[rolls.length - 1] ?? null
  }

  if (stacking === 'subtract') {
    const totals = rolls.map((roll) => roll.count * roll.sides)
    const result = totals.reduce((acc, total, index) => (index === 0 ? total : acc - total))
    return normalizeDiceRoll({ count: 1, sides: Math.max(2, Math.abs(result)) })
  }

  const combined = combineDiceRolls(...rolls)
  if (combined.parts.length === 1) {
    return combined.parts[0] ?? null
  }
  return combined.expression
}

function asNumber(value: number | boolean | string): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'boolean') return value ? 1 : 0
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

export function collectActiveLevelAttributeValues(
  grants: LevelAttributeGrant[] | undefined,
  characterLevel: number,
  definition: AttributeDefinition,
): AttributeValue {
  if (!grants?.length) return null
  const level = normalizeCharacterLevel(characterLevel)
  const values = grants
    .filter((grant) => grant.level <= level)
    .map((grant) => grant.values[definition.id])
  return stackDefinitionValues(definition, values)
}

export function collectActiveLevelDefinitionIds(
  grants: LevelAttributeGrant[] | undefined,
  characterLevel: number,
): string[] {
  if (!grants?.length) return []
  const level = normalizeCharacterLevel(characterLevel)
  const ids = new Set<string>()
  for (const grant of grants) {
    if (grant.level <= level) {
      for (const definitionId of grant.definitionIds) {
        ids.add(definitionId)
      }
    }
  }
  return [...ids]
}

/** @deprecated Use collectActiveLevelDefinitionIds */
export function collectActiveLevelCustomDefinitionIds(
  grants: LevelAttributeGrant[] | undefined,
  characterLevel: number,
): string[] {
  return collectActiveLevelDefinitionIds(grants, characterLevel)
}

export function normalizeAttributesContent(
  raw: Partial<AttributesContent> | undefined,
  options?: { levelGrantEntityIds?: Set<string> },
): AttributesContent {
  const categories = ensureAttributeTypeCategories(
    (raw?.categories ?? []).map((entry) =>
      normalizeAttributeCategory(
        entry.id ? (entry as AttributeCategory) : { ...entry, id: createAttributeCategoryId() },
      ),
    ),
  )
  const categoryIds = new Set(categories.map((entry) => entry.id))
  const usedKeys = new Set<string>()
  const definitions = (raw?.definitions ?? []).map((entry) => {
    const normalized = normalizeAttributeDefinition(entry, usedKeys, categories)
    if (normalized.categoryId && !categoryIds.has(normalized.categoryId)) {
      normalized.categoryId = deriveCategoryIdForMechanic(categories, normalized.mechanic)
    }
    return normalized
  })
  const entityValues: Record<string, Record<string, AttributeValue>> = {}

  for (const [entityId, values] of Object.entries(raw?.entityValues ?? {})) {
    entityValues[entityId] = {}
    for (const [definitionId, value] of Object.entries(values ?? {})) {
      const definition = definitions.find((entry) => entry.id === definitionId)
      if (!definition) continue
      entityValues[entityId][definitionId] = normalizeAttributeValue(definition.inputType, value)
    }
  }

  const customAssignments: Record<string, string[]> = {}
  const customIds = new Set(definitions.filter((entry) => entry.source === 'custom').map((entry) => entry.id))

  for (const [entityId, ids] of Object.entries(raw?.customAssignments ?? {})) {
    customAssignments[entityId] = [...new Set(ids.filter((id) => customIds.has(id)))]
  }

  const levelAttributeGrants: Record<string, LevelAttributeGrant[]> = {}
  for (const [entityId, grants] of Object.entries(raw?.levelAttributeGrants ?? {})) {
    levelAttributeGrants[entityId] = normalizeLevelAttributeGrants(grants).map((grant) => {
      const values: Record<string, AttributeValue> = {}
      for (const [definitionId, value] of Object.entries(grant.values)) {
        const definition = definitions.find((entry) => entry.id === definitionId)
        if (!definition) continue
        values[definitionId] = normalizeAttributeValue(definition.inputType, value)
      }
      return {
        ...grant,
        values,
        definitionIds: grant.definitionIds.filter((id) => definitions.some((entry) => entry.id === id)),
      }
    })
  }

  if (options?.levelGrantEntityIds?.size) {
    for (const entityId of options.levelGrantEntityIds) {
      const flatValues = entityValues[entityId]
      const assignedCustom = customAssignments[entityId] ?? []
      if (!flatValues && assignedCustom.length === 0) continue

      const grants = levelAttributeGrants[entityId] ?? []
      let level1 = grants.find((entry) => entry.level === 1)
      if (!level1) {
        level1 = { level: 1, values: {}, definitionIds: [] }
        grants.push(level1)
        levelAttributeGrants[entityId] = sortLevelAttributeGrants(grants)
      }

      for (const definitionId of assignedCustom) {
        if (!level1.definitionIds.includes(definitionId)) {
          level1.definitionIds.push(definitionId)
        }
      }

      if (flatValues) {
        for (const [definitionId, value] of Object.entries(flatValues)) {
          if (level1.values[definitionId] === undefined) {
            level1.values[definitionId] = value
          }
          if (!level1.definitionIds.includes(definitionId)) {
            level1.definitionIds.push(definitionId)
          }
        }
        delete entityValues[entityId]
      }

      delete customAssignments[entityId]
    }
  }

  return { categories, definitions, entityValues, customAssignments, levelAttributeGrants }
}

export function createEmptyAttributesContent(): AttributesContent {
  return normalizeAttributesContent(undefined)
}

export function formatAttributeValue(
  inputType: AttributeInputType,
  value: AttributeValue | undefined,
): string {
  if (value === null || value === undefined) return '—'
  switch (inputType) {
    case 'boolean':
      return value ? 'Yes' : 'No'
    case 'dice':
      if (isDiceRollValue(value)) {
        return formatDiceRoll(value)
      }
      return typeof value === 'string' && value.length > 0 ? value : '—'
    case 'percentile':
      return `${value}%`
    case 'text':
      return String(value) || '—'
    case 'number':
      return String(value)
  }
}

/** @deprecated Use stackDefinitionValues for binding-aware stacking */
export function stackAttributeValues(
  inputType: AttributeInputType,
  values: (AttributeValue | undefined)[],
): AttributeValue {
  const pseudoDefinition: AttributeDefinition = {
    id: 'stack',
    key: 'stack',
    name: 'stack',
    inputType,
    source: 'standard',
    categoryId: null,
    description: '',
    mechanic: null,
    updatedAt: '',
  }
  return stackDefinitionValues(pseudoDefinition, values)
}

export interface StackedAttributeRow {
  definition: AttributeDefinition
  typeValue: AttributeValue
  classValue: AttributeValue
  characterValue: AttributeValue
  stackedValue: AttributeValue
}

export function buildCharacterAttributeRows(
  definitions: AttributeDefinition[],
  entityValues: Record<string, Record<string, AttributeValue>>,
  characterId: string,
  lineageTypeId: string | null,
  classId: string | null,
  customAssignments: Record<string, string[]>,
  characterLevel: number,
  levelAttributeGrants: Record<string, LevelAttributeGrant[]>,
): {
  standardRows: StackedAttributeRow[]
  customRows: StackedAttributeRow[]
} {
  const typeLevelGrants = lineageTypeId ? levelAttributeGrants[lineageTypeId] : undefined
  const classLevelGrants = classId ? levelAttributeGrants[classId] : undefined
  const characterLevelGrants = levelAttributeGrants[characterId]
  const characterValues = entityValues[characterId] ?? {}

  const assignedDefinitionIds = new Set([
    ...collectActiveLevelDefinitionIds(typeLevelGrants, characterLevel),
    ...collectActiveLevelDefinitionIds(classLevelGrants, characterLevel),
    ...collectActiveLevelDefinitionIds(characterLevelGrants, characterLevel),
    ...(lineageTypeId ? customAssignments[lineageTypeId] ?? [] : []),
    ...(classId ? customAssignments[classId] ?? [] : []),
    ...(customAssignments[characterId] ?? []),
  ])

  const standardRows: StackedAttributeRow[] = []
  const customRows: StackedAttributeRow[] = []

  for (const definition of definitions) {
    const typeValue = collectActiveLevelAttributeValues(typeLevelGrants, characterLevel, definition)
    const classValue = collectActiveLevelAttributeValues(classLevelGrants, characterLevel, definition)
    const characterBaseValue = characterValues[definition.id] ?? null
    const characterLevelValue = collectActiveLevelAttributeValues(
      characterLevelGrants,
      characterLevel,
      definition,
    )
    const characterCombined = stackDefinitionValues(definition, [
      characterBaseValue,
      characterLevelValue,
    ])
    const stackedValue = stackDefinitionValues(definition, [
      typeValue,
      classValue,
      characterCombined,
    ])

    const row: StackedAttributeRow = {
      definition,
      typeValue,
      classValue,
      characterValue: characterBaseValue,
      stackedValue,
    }

    if (definition.source === 'standard') {
      if (assignedDefinitionIds.has(definition.id) || characterValues[definition.id] != null) {
        standardRows.push(row)
      }
    } else if (assignedDefinitionIds.has(definition.id)) {
      customRows.push(row)
    }
  }

  return { standardRows, customRows }
}

export function compileCharacterCombatStats(
  definitions: AttributeDefinition[],
  entityValues: Record<string, Record<string, AttributeValue>>,
  characterId: string,
  lineageTypeId: string | null,
  classId: string | null,
  customAssignments: Record<string, string[]>,
  characterLevel: number,
  levelAttributeGrants: Record<string, LevelAttributeGrant[]>,
) {
  const { standardRows, customRows } = buildCharacterAttributeRows(
    definitions,
    entityValues,
    characterId,
    lineageTypeId,
    classId,
    customAssignments,
    characterLevel,
    levelAttributeGrants,
  )

  const stackedValues: Record<string, AttributeValue> = {}
  for (const row of [...standardRows, ...customRows]) {
    if (row.stackedValue === null || row.stackedValue === undefined) continue
    stackedValues[row.definition.id] = row.stackedValue
  }

  return compileCombatStats(definitions, toEngineStackedValues(stackedValues))
}

function toEngineStackedValues(
  values: Record<string, AttributeValue>,
): Record<string, number | boolean | string> {
  const result: Record<string, number | boolean | string> = {}
  for (const [definitionId, value] of Object.entries(values)) {
    if (value === null || value === undefined) continue
    if (isDiceRollValue(value)) {
      result[definitionId] = formatDiceRoll(value)
      continue
    }
    result[definitionId] = value
  }
  return result
}

export function getAttributeCategoryName(
  categoryId: string | null,
  categories: AttributeCategory[],
): string {
  if (!categoryId) return UNCATEGORIZED_ATTRIBUTE_CATEGORY
  return categories.find((entry) => entry.id === categoryId)?.name ?? UNCATEGORIZED_ATTRIBUTE_CATEGORY
}

export interface AttributeCategoryGroup {
  categoryId: string | null
  categoryName: string
  definitions: AttributeDefinition[]
}

export function groupDefinitionsByCategory(
  definitions: AttributeDefinition[],
  categories: AttributeCategory[],
): AttributeCategoryGroup[] {
  const groups = new Map<string | null, AttributeDefinition[]>()

  for (const definition of definitions) {
    const key = definition.categoryId
    const bucket = groups.get(key) ?? []
    bucket.push(definition)
    groups.set(key, bucket)
  }

  const orderedCategoryIds = categories.map((entry) => entry.id)
  const result: AttributeCategoryGroup[] = []

  for (const categoryId of orderedCategoryIds) {
    const bucket = groups.get(categoryId)
    if (!bucket?.length) continue
    result.push({
      categoryId,
      categoryName: getAttributeCategoryName(categoryId, categories),
      definitions: bucket,
    })
    groups.delete(categoryId)
  }

  const uncategorized = groups.get(null)
  if (uncategorized?.length) {
    result.push({
      categoryId: null,
      categoryName: UNCATEGORIZED_ATTRIBUTE_CATEGORY,
      definitions: uncategorized,
    })
  }

  for (const [categoryId, bucket] of groups.entries()) {
    if (!bucket.length || categoryId === null) continue
    result.push({
      categoryId,
      categoryName: getAttributeCategoryName(categoryId, categories),
      definitions: bucket,
    })
  }

  return result
}

export interface StackedAttributeCategoryGroup {
  categoryId: string | null
  categoryName: string
  rows: StackedAttributeRow[]
}

export function groupStackedRowsByCategory(
  rows: StackedAttributeRow[],
  categories: AttributeCategory[],
): StackedAttributeCategoryGroup[] {
  const definitions = rows.map((row) => row.definition)
  const groups = groupDefinitionsByCategory(definitions, categories)
  return groups.map((group) => ({
    categoryId: group.categoryId,
    categoryName: group.categoryName,
    rows: rows.filter((row) => group.definitions.some((entry) => entry.id === row.definition.id)),
  }))
}
