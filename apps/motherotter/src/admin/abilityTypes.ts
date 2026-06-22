import {
  ATTRIBUTE_TYPES,
  deriveMechanicKey,
  isActiveAbilityMechanic,
  isActiveMechanic,
  normalizeMechanicComposition,
  type MechanicComposition,
} from '@otter/mechanics-core'
import {
  defaultValueForInputType,
  deriveCategoryIdForMechanic,
  deriveInputTypeFromMechanic,
  normalizeAttributeValue,
  resolveDefinitionKey,
  syncMechanicWithInputType,
  type AttributeInputType,
  type AttributeValue,
} from './attributeTypes'
import { normalizeCharacterLevel } from './characterLevelTypes'
import {
  isItemTriggerId,
  type ItemTriggerId,
} from './itemTypes'
import type { AnimationBinding } from './animationTypes'
import { normalizeAnimationBinding } from './animationTypes'
import {
  normalizeDefinitionProgression,
  type DefinitionProgression,
} from './progressionTypes'
import type { AdminListItem } from './types'
import type { LevelAbilityGrant } from './levelGrantTypes'

export type AbilityInputType = AttributeInputType
export type AbilityValue = AttributeValue

export interface AbilityCategory {
  id: string
  name: string
}

export interface AbilityDefinition {
  id: string
  key: string
  name: string
  inputType: AbilityInputType
  categoryId: string | null
  description: string
  mechanic: MechanicComposition | null
  progression: DefinitionProgression
  animationBindings: AnimationBinding[]
  updatedAt: string
}

export interface AbilityBinding {
  value: AbilityValue
  triggerId: ItemTriggerId | null
}

export interface LevelAbilityBindingGrant {
  level: number
  definitionIds: string[]
  bindings: Record<string, AbilityBinding>
}

export interface AbilitiesContent {
  categories: AbilityCategory[]
  definitions: AbilityDefinition[]
  levelAbilityGrants: Record<string, LevelAbilityBindingGrant[]>
}

export type AbilityDefinitionPatch = Partial<
  Pick<
    AbilityDefinition,
    'name' | 'inputType' | 'description' | 'mechanic' | 'animationBindings' | 'progression'
  >
>

export const ABILITY_INPUT_TYPE_LABELS: Record<AbilityInputType, string> = {
  percentile: 'Percentile',
  number: 'Number',
  dice: 'Dice',
  boolean: 'Boolean',
  text: 'Text',
}

export function createAbilityId(): string {
  return `ability-${crypto.randomUUID().slice(0, 8)}`
}

export function createAbilityCategoryId(): string {
  return `ability-cat-${crypto.randomUUID().slice(0, 8)}`
}

export function createEmptyAbilityBinding(inputType: AbilityInputType): AbilityBinding {
  return {
    value: defaultValueForInputType(inputType),
    triggerId: null,
  }
}

function normalizeCategoryName(name: string): string {
  return name.trim().replace(/\s+/g, ' ')
}

function findCategoryByName(categories: AbilityCategory[], name: string): AbilityCategory | undefined {
  const normalized = normalizeCategoryName(name).toLowerCase()
  return categories.find((entry) => entry.name.toLowerCase() === normalized)
}

export function ensureAbilityTypeCategories(categories: AbilityCategory[]): AbilityCategory[] {
  const next = [...categories]
  for (const type of ATTRIBUTE_TYPES) {
    if (!findCategoryByName(next, type.name)) {
      next.push({ id: createAbilityCategoryId(), name: type.name })
    }
  }
  return next
}

export function getAbilityCategoryName(
  categoryId: string | null,
  categories: AbilityCategory[],
): string {
  if (!categoryId) return 'Uncategorized'
  return categories.find((entry) => entry.id === categoryId)?.name ?? 'Uncategorized'
}

export function normalizeAbilityBinding(
  raw: Partial<AbilityBinding> | undefined,
  inputType: AbilityInputType,
): AbilityBinding {
  return {
    value: normalizeAttributeValue(inputType, raw?.value ?? null),
    triggerId:
      raw?.triggerId && isItemTriggerId(raw.triggerId) ? raw.triggerId : null,
  }
}

export function normalizeAbilityDefinition(
  raw: Partial<AbilityDefinition> & { id: string },
  usedKeys: Set<string> = new Set(),
  categories: AbilityCategory[] = [],
): AbilityDefinition {
  const name = raw.name?.trim() || 'Untitled ability'
  let inputType = raw.inputType ?? 'number'

  let mechanic: MechanicComposition | null = null
  if (raw.mechanic !== undefined) {
    mechanic =
      raw.mechanic === null ? null : normalizeMechanicComposition(raw.mechanic)
  }

  if (isActiveAbilityMechanic(mechanic)) {
    inputType = deriveInputTypeFromMechanic(mechanic, inputType as AbilityInputType)
    mechanic = syncMechanicWithInputType(mechanic, inputType)
  } else if (isActiveMechanic(mechanic)) {
    mechanic = syncMechanicWithInputType(mechanic, inputType as AbilityInputType)
  }

  const key = resolveDefinitionKey(name, mechanic, usedKeys)
  usedKeys.add(key)

  const categoryId = isActiveAbilityMechanic(mechanic)
    ? deriveCategoryIdForMechanic(categories, mechanic)
    : isActiveMechanic(mechanic)
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
    categoryId,
    description: raw.description ?? '',
    mechanic: isActiveAbilityMechanic(mechanic) ? mechanic : null,
    progression: normalizeDefinitionProgression(raw.progression),
    animationBindings: Array.isArray(raw.animationBindings)
      ? raw.animationBindings.map((entry) => normalizeAnimationBinding(entry))
      : [],
    updatedAt: raw.updatedAt ?? new Date().toISOString(),
  }
}

export function normalizeLevelAbilityBindingGrant(
  raw: Partial<LevelAbilityBindingGrant>,
  definitions: AbilityDefinition[],
): LevelAbilityBindingGrant {
  const level = normalizeCharacterLevel(raw.level)
  const definitionIds = [...new Set(raw.definitionIds ?? [])]
  const bindings: Record<string, AbilityBinding> = {}

  for (const definitionId of definitionIds) {
    const definition = definitions.find((entry) => entry.id === definitionId)
    if (!definition) continue
    bindings[definitionId] = normalizeAbilityBinding(raw.bindings?.[definitionId], definition.inputType)
  }

  return { level, definitionIds, bindings }
}

export function sortLevelAbilityBindingGrants(
  grants: LevelAbilityBindingGrant[],
): LevelAbilityBindingGrant[] {
  return [...grants].sort((a, b) => a.level - b.level)
}

export function getNextLevelAbilityGrantLevel(grants: LevelAbilityBindingGrant[]): number {
  if (grants.length === 0) return 1
  return Math.min(40, Math.max(...grants.map((entry) => entry.level)) + 1)
}

export function getActiveAbilityDefinitionIds(
  grants: LevelAbilityBindingGrant[] | undefined,
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

export function collectActiveLevelAbilityValues(
  grants: LevelAbilityBindingGrant[] | undefined,
  characterLevel: number,
  definitionId: string,
): AbilityValue[] {
  if (!grants?.length) return []
  const level = normalizeCharacterLevel(characterLevel)
  const values: AbilityValue[] = []
  for (const grant of grants) {
    if (grant.level <= level && grant.definitionIds.includes(definitionId)) {
      const binding = grant.bindings[definitionId]
      if (binding) values.push(binding.value)
    }
  }
  return values
}

export function collectActiveLevelAbilityBindings(
  grants: LevelAbilityBindingGrant[] | undefined,
  characterLevel: number,
  definitionId: string,
): AbilityBinding[] {
  if (!grants?.length) return []
  const level = normalizeCharacterLevel(characterLevel)
  const bindings: AbilityBinding[] = []
  for (const grant of grants) {
    if (grant.level <= level && grant.definitionIds.includes(definitionId)) {
      const binding = grant.bindings[definitionId]
      if (binding) bindings.push(binding)
    }
  }
  return bindings
}

export function getActiveAbilityDefinitionIdsForCharacter(options: {
  characterId: string
  lineageTypeId: string | null
  classes: Array<{ classId: string; level: number }>
  totalLevel: number
  levelAbilityGrants: Record<string, LevelAbilityBindingGrant[]>
}): string[] {
  const ids = new Set<string>()
  if (options.lineageTypeId) {
    for (const id of getActiveAbilityDefinitionIds(
      options.levelAbilityGrants[options.lineageTypeId],
      options.totalLevel,
    )) {
      ids.add(id)
    }
  }
  for (const track of options.classes) {
    for (const id of getActiveAbilityDefinitionIds(
      options.levelAbilityGrants[track.classId],
      track.level,
    )) {
      ids.add(id)
    }
  }
  for (const id of getActiveAbilityDefinitionIds(
    options.levelAbilityGrants[options.characterId],
    options.totalLevel,
  )) {
    ids.add(id)
  }
  return [...ids]
}

export function summarizeLevelAbilityBindingGrants(grants: LevelAbilityBindingGrant[]): string {
  if (grants.length === 0) return '—'
  return grants
    .map((entry) => `Lv ${entry.level}: ${entry.definitionIds.length}`)
    .join(', ')
}

export function abilityDefinitionFromStub(stub: AdminListItem): AbilityDefinition {
  const usedKeys = new Set<string>()
  return normalizeAbilityDefinition(
    {
      id: stub.id,
      name: stub.title,
      description: stub.subtitle ?? '',
      inputType: 'number',
      mechanic: null,
      updatedAt: stub.updatedAt || new Date().toISOString(),
    },
    usedKeys,
  )
}

export function migrateLegacyLevelAbilityGrants(
  legacy: LevelAbilityGrant[] | undefined,
  definitions: AbilityDefinition[],
): LevelAbilityBindingGrant[] {
  if (!legacy?.length) return []
  return sortLevelAbilityBindingGrants(
    legacy.map((entry) =>
      normalizeLevelAbilityBindingGrant(
        {
          level: entry.level,
          definitionIds: entry.abilityIds,
          bindings: Object.fromEntries(
            entry.abilityIds.map((id) => {
              const definition = definitions.find((def) => def.id === id)
              return [
                id,
                createEmptyAbilityBinding(definition?.inputType ?? 'number'),
              ] as const
            }),
          ),
        },
        definitions,
      ),
    ),
  )
}

export function normalizeAbilitiesContent(
  raw: Partial<AbilitiesContent> | undefined,
  options?: {
    legacyStubAbilities?: AdminListItem[]
    legacyLevelGrantsByEntity?: Record<string, LevelAbilityGrant[] | undefined>
  },
): AbilitiesContent {
  const categories = ensureAbilityTypeCategories(
    (raw?.categories ?? []).map((entry) => ({
      id: entry.id || createAbilityCategoryId(),
      name: entry.name?.trim() || 'Untitled category',
    })),
  )

  const usedKeys = new Set<string>()
  let definitions = (raw?.definitions ?? []).map((entry) =>
    normalizeAbilityDefinition(entry, usedKeys, categories),
  )

  if (definitions.length === 0 && options?.legacyStubAbilities?.length) {
    definitions = options.legacyStubAbilities.map((stub) => abilityDefinitionFromStub(stub))
  }

  const definitionIds = new Set(definitions.map((entry) => entry.id))
  const levelAbilityGrants: Record<string, LevelAbilityBindingGrant[]> = {}

  for (const [entityId, grants] of Object.entries(raw?.levelAbilityGrants ?? {})) {
    levelAbilityGrants[entityId] = sortLevelAbilityBindingGrants(
      grants.map((grant) => normalizeLevelAbilityBindingGrant(grant, definitions)),
    )
  }

  if (options?.legacyLevelGrantsByEntity) {
    for (const [entityId, legacyGrants] of Object.entries(options.legacyLevelGrantsByEntity)) {
      if (levelAbilityGrants[entityId]?.length) continue
      const migrated = migrateLegacyLevelAbilityGrants(legacyGrants, definitions)
      if (migrated.length > 0) {
        levelAbilityGrants[entityId] = migrated
      }
    }
  }

  for (const grants of Object.values(levelAbilityGrants)) {
    for (const grant of grants) {
      grant.definitionIds = grant.definitionIds.filter((id) => definitionIds.has(id))
      for (const definitionId of Object.keys(grant.bindings)) {
        if (!definitionIds.has(definitionId)) {
          delete grant.bindings[definitionId]
        }
      }
    }
  }

  return { categories, definitions, levelAbilityGrants }
}

export function createEmptyAbilitiesContent(): AbilitiesContent {
  return normalizeAbilitiesContent(undefined)
}

export function formatAbilityValue(inputType: AbilityInputType, value: AbilityValue | undefined): string {
  if (value === null || value === undefined) return '—'
  switch (inputType) {
    case 'boolean':
      return value ? 'Yes' : 'No'
    case 'percentile':
      return `${value}%`
    case 'text':
      return String(value) || '—'
    case 'dice':
      return typeof value === 'string' ? value : JSON.stringify(value)
    case 'number':
      return String(value)
  }
}

export interface AbilityCategoryGroup {
  categoryId: string | null
  categoryName: string
  definitions: AbilityDefinition[]
}

export function groupAbilityDefinitionsByCategory(
  definitions: AbilityDefinition[],
  categories: AbilityCategory[],
): AbilityCategoryGroup[] {
  const groups = new Map<string | null, AbilityDefinition[]>()
  for (const definition of definitions) {
    const bucket = groups.get(definition.categoryId) ?? []
    bucket.push(definition)
    groups.set(definition.categoryId, bucket)
  }

  const result: AbilityCategoryGroup[] = []
  for (const category of categories) {
    const bucket = groups.get(category.id)
    if (!bucket?.length) continue
    result.push({
      categoryId: category.id,
      categoryName: category.name,
      definitions: bucket,
    })
    groups.delete(category.id)
  }

  const uncategorized = groups.get(null)
  if (uncategorized?.length) {
    result.push({
      categoryId: null,
      categoryName: 'Uncategorized',
      definitions: uncategorized,
    })
  }

  for (const [categoryId, bucket] of groups.entries()) {
    if (!bucket.length || categoryId === null) continue
    result.push({
      categoryId,
      categoryName: getAbilityCategoryName(categoryId, categories),
      definitions: bucket,
    })
  }

  return result
}

export function deriveAbilityKey(name: string, mechanic: MechanicComposition | null): string {
  if (isActiveMechanic(mechanic)) {
    return deriveMechanicKey(mechanic, name)
  }
  return resolveDefinitionKey(name, null, new Set())
}
