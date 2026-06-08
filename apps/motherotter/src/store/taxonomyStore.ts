import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import {
  createEmptyAssignment,
  createEmptyTaxonomyState,
  normalizeTaxonomyState,
  type DomainTaxonomy,
  type EntityTaxonomyAssignment,
  type TaxonomyDomain,
  type TaxonomyState,
  type TaxonomyTerm,
} from '../admin/taxonomyTypes'

function createTermId(kind: 'cat' | 'tag'): string {
  return `${kind}-${crypto.randomUUID().slice(0, 8)}`
}

function normalizeName(name: string): string {
  return name.trim().replace(/\s+/g, ' ')
}

interface TaxonomyStoreState {
  domains: TaxonomyState['domains']
  assignments: TaxonomyState['assignments']
  getDomain: (domain: TaxonomyDomain) => DomainTaxonomy
  getAssignment: (entityId: string) => EntityTaxonomyAssignment
  addCategory: (domain: TaxonomyDomain, name: string) => string | null
  addTag: (domain: TaxonomyDomain, name: string) => string | null
  toggleCategory: (domain: TaxonomyDomain, entityId: string, categoryId: string) => void
  toggleTag: (domain: TaxonomyDomain, entityId: string, tagId: string) => void
  removeCategory: (domain: TaxonomyDomain, categoryId: string) => void
  removeTag: (domain: TaxonomyDomain, tagId: string) => void
  removeEntity: (entityId: string) => void
  replaceAll: (state: TaxonomyState) => void
}

function findTermByName(terms: TaxonomyTerm[], name: string): TaxonomyTerm | undefined {
  const normalized = normalizeName(name).toLowerCase()
  return terms.find((term) => term.name.toLowerCase() === normalized)
}

export const useTaxonomyStore = create<TaxonomyStoreState>()(
  immer((set, get) => ({
    ...createEmptyTaxonomyState(),

    getDomain: (domain) => get().domains[domain],

    getAssignment: (entityId) => get().assignments[entityId] ?? createEmptyAssignment(),

    addCategory: (domain, name) => {
      const label = normalizeName(name)
      if (!label) return null

      const existing = findTermByName(get().domains[domain].categories, label)
      if (existing) return existing.id

      const term: TaxonomyTerm = { id: createTermId('cat'), name: label }
      set((state) => {
        state.domains[domain].categories.push(term)
      })
      return term.id
    },

    addTag: (domain, name) => {
      const label = normalizeName(name)
      if (!label) return null

      const existing = findTermByName(get().domains[domain].tags, label)
      if (existing) return existing.id

      const term: TaxonomyTerm = { id: createTermId('tag'), name: label }
      set((state) => {
        state.domains[domain].tags.push(term)
      })
      return term.id
    },

    toggleCategory: (_domain, entityId, categoryId) => {
      set((state) => {
        const current = state.assignments[entityId] ?? createEmptyAssignment()
        const nextIds = current.categoryIds.includes(categoryId)
          ? current.categoryIds.filter((id) => id !== categoryId)
          : [...current.categoryIds, categoryId]
        state.assignments[entityId] = { ...current, categoryIds: nextIds }
      })
    },

    toggleTag: (_domain, entityId, tagId) => {
      set((state) => {
        const current = state.assignments[entityId] ?? createEmptyAssignment()
        const nextIds = current.tagIds.includes(tagId)
          ? current.tagIds.filter((id) => id !== tagId)
          : [...current.tagIds, tagId]
        state.assignments[entityId] = { ...current, tagIds: nextIds }
      })
    },

    removeCategory: (domain, categoryId) => {
      set((state) => {
        state.domains[domain].categories = state.domains[domain].categories.filter(
          (term) => term.id !== categoryId,
        )
        for (const [entityId, assignment] of Object.entries(state.assignments)) {
          if (assignment.categoryIds.includes(categoryId)) {
            state.assignments[entityId] = {
              ...assignment,
              categoryIds: assignment.categoryIds.filter((id) => id !== categoryId),
            }
          }
        }
      })
    },

    removeTag: (domain, tagId) => {
      set((state) => {
        state.domains[domain].tags = state.domains[domain].tags.filter((term) => term.id !== tagId)
        for (const [entityId, assignment] of Object.entries(state.assignments)) {
          if (assignment.tagIds.includes(tagId)) {
            state.assignments[entityId] = {
              ...assignment,
              tagIds: assignment.tagIds.filter((id) => id !== tagId),
            }
          }
        }
      })
    },

    removeEntity: (entityId) => {
      set((state) => {
        delete state.assignments[entityId]
      })
    },

    replaceAll: (taxonomyState) => {
      const normalized = normalizeTaxonomyState(taxonomyState)
      set((state) => {
        state.domains = normalized.domains
        state.assignments = normalized.assignments
      })
    },
  })),
)

export function getTaxonomySnapshot(): TaxonomyState {
  const state = useTaxonomyStore.getState()
  return {
    domains: structuredClone(state.domains),
    assignments: structuredClone(state.assignments),
  }
}

export function getTaxonomySummaryForEntity(
  domain: TaxonomyDomain,
  entityId: string,
): { categories: string; tags: string } {
  const { domains, assignments } = useTaxonomyStore.getState()
  const assignment = assignments[entityId] ?? createEmptyAssignment()
  const categoryNames = assignment.categoryIds
    .map((id) => domains[domain].categories.find((term) => term.id === id)?.name)
    .filter(Boolean)
  const tagNames = assignment.tagIds
    .map((id) => domains[domain].tags.find((term) => term.id === id)?.name)
    .filter(Boolean)
  return {
    categories: categoryNames.length > 0 ? categoryNames.join(', ') : '—',
    tags: tagNames.length > 0 ? tagNames.join(', ') : '—',
  }
}
