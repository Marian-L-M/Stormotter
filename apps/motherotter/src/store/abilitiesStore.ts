import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import {
  applyEffectTypeConstraints,
  deriveCategoryIdForMechanic,
  deriveInputTypeFromMechanic,
  deriveMechanicKey,
  isActiveAbilityMechanic,
  normalizeMechanicComposition,
  resolveDefinitionKey,
  syncMechanicWithInputType,
} from '../admin/attributeTypes'
import {
  createAbilityCategoryId,
  createAbilityId,
  createEmptyAbilityBinding,
  ensureAbilityTypeCategories,
  getNextLevelAbilityGrantLevel,
  normalizeAbilitiesContent,
  normalizeAbilityDefinition,
  sortLevelAbilityBindingGrants,
  type AbilityCategory,
  type AbilityDefinition,
  type AbilityDefinitionPatch,
  type AbilityInputType,
  type AbilitiesContent,
  type AbilityValue,
  type LevelAbilityBindingGrant,
} from '../admin/abilityTypes'
import { normalizeCharacterLevel } from '../admin/characterLevelTypes'
import type { ItemTriggerId } from '../admin/itemTypes'
import { createDefaultProjectContent } from '../lib/defaultProjectContent'

function normalizeCategoryName(name: string): string {
  return name.trim().replace(/\s+/g, ' ')
}

function findCategoryByName(categories: AbilityCategory[], name: string): AbilityCategory | undefined {
  const normalized = normalizeCategoryName(name).toLowerCase()
  return categories.find((entry) => entry.name.toLowerCase() === normalized)
}

function seedDefinition(
  name: string,
  inputType: AbilityInputType = 'number',
  description = '',
  categoryId: string | null = null,
): AbilityDefinition {
  const usedKeys = new Set<string>()
  return normalizeAbilityDefinition(
    {
      id: createAbilityId(),
      name,
      inputType,
      categoryId,
      description,
      mechanic: null,
      updatedAt: new Date().toISOString(),
    },
    usedKeys,
  )
}

interface AbilitiesState extends AbilitiesContent {
  addCategory: (name: string) => string | null
  updateCategory: (id: string, name: string) => void
  removeCategory: (id: string) => void
  addDefinition: (inputType?: AbilityInputType) => string
  updateDefinition: (id: string, patch: AbilityDefinitionPatch) => void
  removeDefinition: (id: string) => void
  getDefinition: (id: string) => AbilityDefinition | undefined
  addLevelAbilityGrant: (entityId: string, level?: number) => void
  removeLevelAbilityGrant: (entityId: string, level: number) => void
  updateLevelAbilityGrantLevel: (entityId: string, fromLevel: number, toLevel: number) => void
  setLevelAbilityBindingValue: (
    entityId: string,
    level: number,
    definitionId: string,
    value: AbilityValue,
  ) => void
  setLevelAbilityBindingTrigger: (
    entityId: string,
    level: number,
    definitionId: string,
    triggerId: ItemTriggerId | null,
  ) => void
  assignLevelAbility: (entityId: string, level: number, definitionId: string) => boolean
  unassignLevelAbility: (entityId: string, level: number, definitionId: string) => void
  removeEntity: (entityId: string) => void
  copyEntityAbilities: (fromEntityId: string, toEntityId: string) => void
  replaceAll: (content: AbilitiesContent) => void
  getSnapshot: () => AbilitiesContent
}

function ensureLevelGrants(
  levelAbilityGrants: Record<string, LevelAbilityBindingGrant[]>,
  entityId: string,
): LevelAbilityBindingGrant[] {
  if (!levelAbilityGrants[entityId]) {
    levelAbilityGrants[entityId] = []
  }
  return levelAbilityGrants[entityId]
}

function findLevelGrant(
  grants: LevelAbilityBindingGrant[],
  level: number,
): LevelAbilityBindingGrant | undefined {
  return grants.find((entry) => entry.level === normalizeCharacterLevel(level))
}

export const useAbilitiesStore = create<AbilitiesState>()(
  immer((set, get) => ({
    ...createDefaultProjectContent().abilities,

    addCategory: (name) => {
      const label = normalizeCategoryName(name)
      if (!label) return null
      const existing = findCategoryByName(get().categories, label)
      if (existing) return existing.id

      const category: AbilityCategory = { id: createAbilityCategoryId(), name: label }
      set((state) => {
        state.categories.push(category)
      })
      return category.id
    },

    updateCategory: (id, name) => {
      const label = normalizeCategoryName(name)
      if (!label) return
      set((state) => {
        const category = state.categories.find((entry) => entry.id === id)
        if (!category) return
        category.name = label
      })
    },

    removeCategory: (id) => {
      set((state) => {
        state.categories = state.categories.filter((entry) => entry.id !== id)
        for (const definition of state.definitions) {
          if (definition.categoryId === id) {
            definition.categoryId = null
          }
        }
      })
    },

    addDefinition: (inputType = 'number') => {
      const index = get().definitions.length + 1
      const definition = seedDefinition(`New ability ${index}`, inputType)
      set((state) => {
        state.definitions.unshift(definition)
      })
      return definition.id
    },

    updateDefinition: (id, patch) => {
      set((state) => {
        const definition = state.definitions.find((entry) => entry.id === id)
        if (!definition) return

        state.categories = ensureAbilityTypeCategories(state.categories)

        if (patch.name !== undefined) definition.name = patch.name
        if (patch.description !== undefined) definition.description = patch.description
        if (patch.animationBindings !== undefined) {
          definition.animationBindings = patch.animationBindings.map((entry) => ({ ...entry }))
        }

        const nextInputType = patch.inputType ?? definition.inputType

        if (patch.inputType !== undefined) {
          definition.inputType = patch.inputType
        }

        if (patch.mechanic !== undefined) {
          definition.mechanic =
            patch.mechanic === null
              ? null
              : syncMechanicWithInputType(
                  normalizeMechanicComposition(applyEffectTypeConstraints(patch.mechanic)),
                  nextInputType,
                )
        } else if (patch.inputType !== undefined && definition.mechanic) {
          definition.mechanic = syncMechanicWithInputType(definition.mechanic, nextInputType)
        }

        if (definition.mechanic && isActiveAbilityMechanic(definition.mechanic)) {
          const resolvedInputType = patch.inputType ?? deriveInputTypeFromMechanic(definition.mechanic, nextInputType)
          definition.inputType = resolvedInputType
          definition.mechanic = syncMechanicWithInputType(definition.mechanic, definition.inputType)
          definition.categoryId = deriveCategoryIdForMechanic(state.categories, definition.mechanic)
          definition.key = deriveMechanicKey(definition.mechanic, definition.name)
        } else if (patch.mechanic === null) {
          definition.categoryId = null
        }

        if (patch.name !== undefined) {
          const usedKeys = new Set(
            state.definitions.filter((entry) => entry.id !== id).map((entry) => entry.key),
          )
          definition.key = resolveDefinitionKey(definition.name, definition.mechanic, usedKeys)
        }

        definition.updatedAt = new Date().toISOString()
      })
    },

    removeDefinition: (id) => {
      set((state) => {
        state.definitions = state.definitions.filter((entry) => entry.id !== id)
        for (const entityId of Object.keys(state.levelAbilityGrants)) {
          for (const grant of state.levelAbilityGrants[entityId]) {
            grant.definitionIds = grant.definitionIds.filter((definitionId) => definitionId !== id)
            delete grant.bindings[id]
          }
        }
      })
    },

    getDefinition: (id) => get().definitions.find((entry) => entry.id === id),

    addLevelAbilityGrant: (entityId, level) => {
      set((state) => {
        const grants = ensureLevelGrants(state.levelAbilityGrants, entityId)
        const nextLevel = normalizeCharacterLevel(level ?? getNextLevelAbilityGrantLevel(grants))
        if (findLevelGrant(grants, nextLevel)) return
        grants.push({ level: nextLevel, definitionIds: [], bindings: {} })
        state.levelAbilityGrants[entityId] = sortLevelAbilityBindingGrants(grants)
      })
    },

    removeLevelAbilityGrant: (entityId, level) => {
      set((state) => {
        const grants = state.levelAbilityGrants[entityId]
        if (!grants) return
        const normalizedLevel = normalizeCharacterLevel(level)
        state.levelAbilityGrants[entityId] = grants.filter((entry) => entry.level !== normalizedLevel)
      })
    },

    updateLevelAbilityGrantLevel: (entityId, fromLevel, toLevel) => {
      set((state) => {
        const grants = state.levelAbilityGrants[entityId]
        if (!grants) return
        const sourceLevel = normalizeCharacterLevel(fromLevel)
        const targetLevel = normalizeCharacterLevel(toLevel)
        if (sourceLevel === targetLevel) return

        const source = grants.find((entry) => entry.level === sourceLevel)
        if (!source) return

        const withoutSource = grants.filter((entry) => entry.level !== sourceLevel)
        const existingTarget = withoutSource.find((entry) => entry.level === targetLevel)
        if (existingTarget) {
          existingTarget.bindings = { ...existingTarget.bindings, ...source.bindings }
          existingTarget.definitionIds = [
            ...new Set([...existingTarget.definitionIds, ...source.definitionIds]),
          ]
        } else {
          withoutSource.push({
            level: targetLevel,
            bindings: { ...source.bindings },
            definitionIds: [...source.definitionIds],
          })
        }
        state.levelAbilityGrants[entityId] = sortLevelAbilityBindingGrants(withoutSource)
      })
    },

    setLevelAbilityBindingValue: (entityId, level, definitionId, value) => {
      set((state) => {
        const definition = state.definitions.find((entry) => entry.id === definitionId)
        if (!definition) return
        const grants = ensureLevelGrants(state.levelAbilityGrants, entityId)
        const grant = findLevelGrant(grants, level)
        if (!grant) return
        if (!grant.bindings[definitionId]) {
          grant.bindings[definitionId] = createEmptyAbilityBinding(definition.inputType)
        }
        grant.bindings[definitionId].value = value
      })
    },

    setLevelAbilityBindingTrigger: (entityId, level, definitionId, triggerId) => {
      set((state) => {
        const definition = state.definitions.find((entry) => entry.id === definitionId)
        if (!definition) return
        const grants = ensureLevelGrants(state.levelAbilityGrants, entityId)
        const grant = findLevelGrant(grants, level)
        if (!grant) return
        if (!grant.bindings[definitionId]) {
          grant.bindings[definitionId] = createEmptyAbilityBinding(definition.inputType)
        }
        grant.bindings[definitionId].triggerId = triggerId
      })
    },

    assignLevelAbility: (entityId, level, definitionId) => {
      const definition = get().definitions.find((entry) => entry.id === definitionId)
      if (!definition) return false

      set((state) => {
        const grants = ensureLevelGrants(state.levelAbilityGrants, entityId)
        let grant = findLevelGrant(grants, level)
        if (!grant) {
          grant = {
            level: normalizeCharacterLevel(level),
            definitionIds: [],
            bindings: {},
          }
          grants.push(grant)
        }
        if (grant.definitionIds.includes(definitionId)) return
        grant.definitionIds.push(definitionId)
        grant.bindings[definitionId] = createEmptyAbilityBinding(definition.inputType)
        state.levelAbilityGrants[entityId] = sortLevelAbilityBindingGrants(grants)
      })
      return true
    },

    unassignLevelAbility: (entityId, level, definitionId) => {
      set((state) => {
        const grant = findLevelGrant(state.levelAbilityGrants[entityId] ?? [], level)
        if (!grant) return
        grant.definitionIds = grant.definitionIds.filter((id) => id !== definitionId)
        delete grant.bindings[definitionId]
      })
    },

    removeEntity: (entityId) => {
      set((state) => {
        delete state.levelAbilityGrants[entityId]
      })
    },

    copyEntityAbilities: (fromEntityId, toEntityId) => {
      set((state) => {
        const grants = state.levelAbilityGrants[fromEntityId]
        if (grants) {
          state.levelAbilityGrants[toEntityId] = structuredClone(grants)
        }
      })
    },

    replaceAll: (content) => {
      const normalized = normalizeAbilitiesContent(content)
      set((state) => {
        state.categories = normalized.categories
        state.definitions = normalized.definitions
        state.levelAbilityGrants = normalized.levelAbilityGrants
      })
    },

    getSnapshot: () => {
      const { categories, definitions, levelAbilityGrants } = get()
      return {
        categories: structuredClone(categories),
        definitions: structuredClone(definitions),
        levelAbilityGrants: structuredClone(levelAbilityGrants),
      }
    },
  })),
)
