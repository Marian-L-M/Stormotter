import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import {
  applyEffectTypeConstraints,
  createAttributeCategoryId,
  createAttributeId,
  defaultValueForInputType,
  deriveCategoryIdForMechanic,
  deriveInputTypeFromMechanic,
  deriveMechanicKey,
  ensureAttributeTypeCategories,
  getNextLevelAttributeGrantLevel,
  isActiveMechanic,
  normalizeAttributeDefinition,
  normalizeAttributesContent,
  normalizeMechanicComposition,
  resolveDefinitionKey,
  sortLevelAttributeGrants,
  syncMechanicWithInputType,
  type AttributeCategory,
  type AttributeDefinition,
  type AttributeDefinitionPatch,
  type AttributeInputType,
  type AttributesContent,
  type AttributeSource,
  type AttributeValue,
  type LevelAttributeGrant,
} from '../admin/attributeTypes'
import { normalizeCharacterLevel } from '../admin/characterLevelTypes'
import { createDefaultProjectContent } from '../lib/defaultProjectContent'

function normalizeCategoryName(name: string): string {
  return name.trim().replace(/\s+/g, ' ')
}

function findCategoryByName(categories: AttributeCategory[], name: string): AttributeCategory | undefined {
  const normalized = normalizeCategoryName(name).toLowerCase()
  return categories.find((entry) => entry.name.toLowerCase() === normalized)
}

function seedDefinition(
  name: string,
  inputType: AttributeInputType,
  source: AttributeSource,
  description = '',
  categoryId: string | null = null,
): AttributeDefinition {
  const usedKeys = new Set<string>()
  return normalizeAttributeDefinition(
    {
      id: createAttributeId(),
      name,
      inputType,
      source,
      categoryId,
      description,
      mechanic: null,
      updatedAt: new Date().toISOString(),
    },
    usedKeys,
  )
}

interface AttributesState extends AttributesContent {
  addCategory: (name: string) => string | null
  updateCategory: (id: string, name: string) => void
  removeCategory: (id: string) => void
  addDefinition: (source: AttributeSource, inputType?: AttributeInputType) => string
  updateDefinition: (id: string, patch: AttributeDefinitionPatch) => void
  removeDefinition: (id: string) => void
  getDefinition: (id: string) => AttributeDefinition | undefined
  getDefinitionsBySource: (source: AttributeSource) => AttributeDefinition[]
  setEntityValue: (entityId: string, definitionId: string, value: AttributeValue) => void
  clearEntityValue: (entityId: string, definitionId: string) => void
  getEntityValue: (entityId: string, definitionId: string) => AttributeValue
  assignCustomAttribute: (entityId: string, definitionId: string) => boolean
  unassignCustomAttribute: (entityId: string, definitionId: string) => void
  getCustomAssignments: (entityId: string) => string[]
  addLevelAttributeGrant: (entityId: string, level?: number) => void
  removeLevelAttributeGrant: (entityId: string, level: number) => void
  updateLevelAttributeGrantLevel: (entityId: string, fromLevel: number, toLevel: number) => void
  setLevelAttributeValue: (
    entityId: string,
    level: number,
    definitionId: string,
    value: AttributeValue,
  ) => void
  clearLevelAttributeValue: (entityId: string, level: number, definitionId: string) => void
  assignLevelAttribute: (entityId: string, level: number, definitionId: string) => boolean
  unassignLevelAttribute: (entityId: string, level: number, definitionId: string) => void
  removeEntity: (entityId: string) => void
  replaceAll: (content: AttributesContent) => void
  getSnapshot: () => AttributesContent
}

function ensureEntityValues(
  entityValues: Record<string, Record<string, AttributeValue>>,
  entityId: string,
): Record<string, AttributeValue> {
  if (!entityValues[entityId]) {
    entityValues[entityId] = {}
  }
  return entityValues[entityId]
}

function ensureLevelGrants(
  levelAttributeGrants: Record<string, LevelAttributeGrant[]>,
  entityId: string,
): LevelAttributeGrant[] {
  if (!levelAttributeGrants[entityId]) {
    levelAttributeGrants[entityId] = []
  }
  return levelAttributeGrants[entityId]
}

function findLevelGrant(grants: LevelAttributeGrant[], level: number): LevelAttributeGrant | undefined {
  return grants.find((entry) => entry.level === normalizeCharacterLevel(level))
}

export const useAttributesStore = create<AttributesState>()(
  immer((set, get) => ({
    ...createDefaultProjectContent().attributes,

    addCategory: (name) => {
      const label = normalizeCategoryName(name)
      if (!label) return null
      const existing = findCategoryByName(get().categories, label)
      if (existing) return existing.id

      const category: AttributeCategory = { id: createAttributeCategoryId(), name: label }
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

    addDefinition: (source, inputType = 'number') => {
      const index = get().definitions.filter((entry) => entry.source === source).length + 1
      const label = source === 'standard' ? 'Standard' : 'Custom'
      const definition = seedDefinition(`New ${label} attribute ${index}`, inputType, source)
      set((state) => {
        state.definitions.unshift(definition)
      })
      return definition.id
    },

    updateDefinition: (id, patch) => {
      set((state) => {
        const definition = state.definitions.find((entry) => entry.id === id)
        if (!definition) return

        state.categories = ensureAttributeTypeCategories(state.categories)

        if (patch.name !== undefined) definition.name = patch.name
        if (patch.description !== undefined) definition.description = patch.description

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

        if (definition.mechanic && isActiveMechanic(definition.mechanic)) {
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
        for (const entityId of Object.keys(state.entityValues)) {
          delete state.entityValues[entityId][id]
        }
        for (const entityId of Object.keys(state.customAssignments)) {
          state.customAssignments[entityId] = state.customAssignments[entityId].filter(
            (definitionId) => definitionId !== id,
          )
        }
        for (const entityId of Object.keys(state.levelAttributeGrants)) {
          for (const grant of state.levelAttributeGrants[entityId]) {
            grant.definitionIds = grant.definitionIds.filter(
              (definitionId) => definitionId !== id,
            )
            delete grant.values[id]
          }
        }
      })
    },

    getDefinition: (id) => get().definitions.find((entry) => entry.id === id),

    getDefinitionsBySource: (source) => get().definitions.filter((entry) => entry.source === source),

    setEntityValue: (entityId, definitionId, value) => {
      set((state) => {
        const definition = state.definitions.find((entry) => entry.id === definitionId)
        if (!definition) return
        const values = ensureEntityValues(state.entityValues, entityId)
        values[definitionId] = value
      })
    },

    clearEntityValue: (entityId, definitionId) => {
      set((state) => {
        if (!state.entityValues[entityId]) return
        delete state.entityValues[entityId][definitionId]
      })
    },

    getEntityValue: (entityId, definitionId) =>
      get().entityValues[entityId]?.[definitionId] ?? null,

    assignCustomAttribute: (entityId, definitionId) => {
      const definition = get().definitions.find((entry) => entry.id === definitionId)
      if (!definition || definition.source !== 'custom') return false

      const existing = get().customAssignments[entityId] ?? []
      if (existing.includes(definitionId)) return false

      set((state) => {
        if (!state.customAssignments[entityId]) {
          state.customAssignments[entityId] = []
        }
        state.customAssignments[entityId].push(definitionId)
        const values = ensureEntityValues(state.entityValues, entityId)
        if (values[definitionId] === undefined) {
          values[definitionId] = defaultValueForInputType(definition.inputType)
        }
      })
      return true
    },

    unassignCustomAttribute: (entityId, definitionId) => {
      set((state) => {
        if (state.customAssignments[entityId]) {
          state.customAssignments[entityId] = state.customAssignments[entityId].filter(
            (id) => id !== definitionId,
          )
        }
        if (state.entityValues[entityId]) {
          delete state.entityValues[entityId][definitionId]
        }
      })
    },

    getCustomAssignments: (entityId) => get().customAssignments[entityId] ?? [],

    addLevelAttributeGrant: (entityId, level) => {
      set((state) => {
        const grants = ensureLevelGrants(state.levelAttributeGrants, entityId)
        const nextLevel = normalizeCharacterLevel(
          level ?? getNextLevelAttributeGrantLevel(grants),
        )
        if (findLevelGrant(grants, nextLevel)) return
        grants.push({ level: nextLevel, values: {}, definitionIds: [] })
        state.levelAttributeGrants[entityId] = sortLevelAttributeGrants(grants)
      })
    },

    removeLevelAttributeGrant: (entityId, level) => {
      set((state) => {
        const grants = state.levelAttributeGrants[entityId]
        if (!grants) return
        const normalizedLevel = normalizeCharacterLevel(level)
        state.levelAttributeGrants[entityId] = grants.filter((entry) => entry.level !== normalizedLevel)
      })
    },

    updateLevelAttributeGrantLevel: (entityId, fromLevel, toLevel) => {
      set((state) => {
        const grants = state.levelAttributeGrants[entityId]
        if (!grants) return
        const sourceLevel = normalizeCharacterLevel(fromLevel)
        const targetLevel = normalizeCharacterLevel(toLevel)
        if (sourceLevel === targetLevel) return

        const source = grants.find((entry) => entry.level === sourceLevel)
        if (!source) return

        const withoutSource = grants.filter((entry) => entry.level !== sourceLevel)
        const existingTarget = withoutSource.find((entry) => entry.level === targetLevel)
        if (existingTarget) {
          existingTarget.values = { ...existingTarget.values, ...source.values }
          existingTarget.definitionIds = [
            ...new Set([...existingTarget.definitionIds, ...source.definitionIds]),
          ]
        } else {
          withoutSource.push({
            level: targetLevel,
            values: { ...source.values },
            definitionIds: [...source.definitionIds],
          })
        }
        state.levelAttributeGrants[entityId] = sortLevelAttributeGrants(withoutSource)
      })
    },

    setLevelAttributeValue: (entityId, level, definitionId, value) => {
      set((state) => {
        const definition = state.definitions.find((entry) => entry.id === definitionId)
        if (!definition) return
        const grants = ensureLevelGrants(state.levelAttributeGrants, entityId)
        const grant = findLevelGrant(grants, level)
        if (!grant) return
        grant.values[definitionId] = value
      })
    },

    clearLevelAttributeValue: (entityId, level, definitionId) => {
      set((state) => {
        const grant = findLevelGrant(state.levelAttributeGrants[entityId] ?? [], level)
        if (!grant) return
        delete grant.values[definitionId]
      })
    },

    assignLevelAttribute: (entityId, level, definitionId) => {
      const definition = get().definitions.find((entry) => entry.id === definitionId)
      if (!definition) return false

      set((state) => {
        const grants = ensureLevelGrants(state.levelAttributeGrants, entityId)
        let grant = findLevelGrant(grants, level)
        if (!grant) {
          grant = {
            level: normalizeCharacterLevel(level),
            values: {},
            definitionIds: [],
          }
          grants.push(grant)
        }
        if (grant.definitionIds.includes(definitionId)) return
        grant.definitionIds.push(definitionId)
        if (grant.values[definitionId] === undefined) {
          grant.values[definitionId] = defaultValueForInputType(definition.inputType)
        }
        state.levelAttributeGrants[entityId] = sortLevelAttributeGrants(grants)
      })
      return true
    },

    unassignLevelAttribute: (entityId, level, definitionId) => {
      set((state) => {
        const grant = findLevelGrant(state.levelAttributeGrants[entityId] ?? [], level)
        if (!grant) return
        grant.definitionIds = grant.definitionIds.filter((id) => id !== definitionId)
        delete grant.values[definitionId]
      })
    },

    removeEntity: (entityId) => {
      set((state) => {
        delete state.entityValues[entityId]
        delete state.customAssignments[entityId]
        delete state.levelAttributeGrants[entityId]
      })
    },

    replaceAll: (content) => {
      const normalized = normalizeAttributesContent(content)
      set((state) => {
        state.categories = normalized.categories
        state.definitions = normalized.definitions
        state.entityValues = normalized.entityValues
        state.customAssignments = normalized.customAssignments
        state.levelAttributeGrants = normalized.levelAttributeGrants
      })
    },

    getSnapshot: () => {
      const { categories, definitions, entityValues, customAssignments, levelAttributeGrants } = get()
      return {
        categories: structuredClone(categories),
        definitions: structuredClone(definitions),
        entityValues: structuredClone(entityValues),
        customAssignments: structuredClone(customAssignments),
        levelAttributeGrants: structuredClone(levelAttributeGrants),
      }
    },
  })),
)
