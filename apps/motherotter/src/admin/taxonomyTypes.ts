export type TaxonomyDomain =
  | 'stories'
  | 'characters'
  | 'races'
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
  'races',
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

export function normalizeTaxonomyState(raw: TaxonomyState | undefined): TaxonomyState {
  const empty = createEmptyTaxonomyState()
  if (!raw) return empty

  const domains = { ...empty.domains }
  for (const domain of TAXONOMY_DOMAINS) {
    const fromRaw = raw.domains?.[domain]
    domains[domain] = {
      categories: structuredClone(fromRaw?.categories ?? []),
      tags: structuredClone(fromRaw?.tags ?? []),
    }
  }

  return {
    domains,
    assignments: structuredClone(raw.assignments ?? {}),
  }
}

export function editorModeToTaxonomyDomain(mode: string): TaxonomyDomain | null {
  if (mode === 'state') return 'state'
  if (TAXONOMY_DOMAINS.includes(mode as TaxonomyDomain)) {
    return mode as TaxonomyDomain
  }
  return null
}
