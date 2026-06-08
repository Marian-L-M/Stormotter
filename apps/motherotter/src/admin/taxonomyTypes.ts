export type TaxonomyDomain =
  | 'stories'
  | 'characters'
  | 'character-types'
  | 'character-classes'
  | 'media'
  | 'audio-profiles'
  | 'items'
  | 'containers'
  | 'abilities'
  | 'rules'
  | 'state'

export interface TaxonomyTerm {
  id: string
  name: string
}

export interface DomainTaxonomy {
  categories: TaxonomyTerm[]
  tags: TaxonomyTerm[]
}

export interface EntityTaxonomyAssignment {
  categoryIds: string[]
  tagIds: string[]
}

export interface TaxonomyState {
  domains: Record<TaxonomyDomain, DomainTaxonomy>
  assignments: Record<string, EntityTaxonomyAssignment>
}

export const TAXONOMY_DOMAINS: TaxonomyDomain[] = [
  'stories',
  'characters',
  'character-types',
  'character-classes',
  'media',
  'audio-profiles',
  'items',
  'containers',
  'abilities',
  'rules',
  'state',
]

export function createEmptyDomainTaxonomy(): DomainTaxonomy {
  return { categories: [], tags: [] }
}

export const EMPTY_DOMAIN_TAXONOMY: DomainTaxonomy = {
  categories: [],
  tags: [],
}

export function createEmptyTaxonomyState(): TaxonomyState {
  return {
    domains: Object.fromEntries(
      TAXONOMY_DOMAINS.map((domain) => [domain, createEmptyDomainTaxonomy()]),
    ) as Record<TaxonomyDomain, DomainTaxonomy>,
    assignments: {},
  }
}

export function createEmptyAssignment(): EntityTaxonomyAssignment {
  return { categoryIds: [], tagIds: [] }
}

export const EMPTY_TAXONOMY_ASSIGNMENT: EntityTaxonomyAssignment = {
  categoryIds: [],
  tagIds: [],
}

function mergeDomainTaxonomy(a: DomainTaxonomy, b: DomainTaxonomy | undefined): DomainTaxonomy {
  if (!b) return structuredClone(a)
  return {
    categories: [...structuredClone(a.categories), ...structuredClone(b.categories)],
    tags: [...structuredClone(a.tags), ...structuredClone(b.tags)],
  }
}

function migrateLegacyEntityId(id: string): string {
  if (id.startsWith('lineage-') || id.startsWith('cclass-')) return id
  if (id.startsWith('race-')) return `lineage-${id.slice(5)}`
  if (id.startsWith('class-')) return `lineage-${id.slice(6)}`
  return id
}

export function normalizeTaxonomyState(raw: TaxonomyState | undefined): TaxonomyState {
  const empty = createEmptyTaxonomyState()
  if (!raw) return empty

  const rawDomains = raw.domains as Record<string, DomainTaxonomy | undefined>
  const domains = { ...empty.domains }
  for (const domain of TAXONOMY_DOMAINS) {
    const fromRaw = rawDomains[domain]
    domains[domain] = {
      categories: structuredClone(fromRaw?.categories ?? []),
      tags: structuredClone(fromRaw?.tags ?? []),
    }
  }

  if (rawDomains.races) {
    domains['character-types'] = mergeDomainTaxonomy(domains['character-types'], rawDomains.races)
  }
  if (rawDomains.classes) {
    domains['character-types'] = mergeDomainTaxonomy(domains['character-types'], rawDomains.classes)
  }

  const assignments: Record<string, EntityTaxonomyAssignment> = {}
  for (const [entityId, assignment] of Object.entries(raw.assignments ?? {})) {
    const migratedId = migrateLegacyEntityId(entityId)
    assignments[migratedId] = structuredClone(assignment)
  }

  return { domains, assignments }
}

export function editorModeToTaxonomyDomain(mode: string): TaxonomyDomain | null {
  if (mode === 'state') return 'state'
  if (mode === 'races' || mode === 'classes') return 'character-types'
  if (mode === 'character-types' || mode === 'character-classes' || mode === 'media' || mode === 'audio-profiles') return mode
  if (TAXONOMY_DOMAINS.includes(mode as TaxonomyDomain)) {
    return mode as TaxonomyDomain
  }
  return null
}
