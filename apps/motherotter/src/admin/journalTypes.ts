import {
  normalizeGameplayConditionGroup,
  type GameplayConditionGroup,
} from './gameplayConditionTypes'
import type { AdminListItem } from './types'

export type JournalSectionTab = 'entries' | 'categories'

export const JOURNAL_SECTION_TABS: { id: JournalSectionTab; label: string }[] = [
  { id: 'entries', label: 'Entries' },
  { id: 'categories', label: 'Categories' },
]

export interface JournalEntry {
  id: string
  title: string
  body: string
  categoryId: string | null
  linkedQuestId: string | null
  /** When set, the entry is shown in the journal only while gameplay state matches. */
  displayConditions: GameplayConditionGroup | null
  updatedAt: string
}

export interface JournalCategory {
  id: string
  name: string
  description: string
  updatedAt: string
}

export type JournalEntryPatch = Partial<
  Pick<JournalEntry, 'title' | 'body' | 'categoryId' | 'linkedQuestId' | 'displayConditions'>
>

export type JournalCategoryPatch = Partial<Pick<JournalCategory, 'name' | 'description'>>

export interface JournalEntryListItem extends AdminListItem {
  entry: JournalEntry
}

export interface JournalCategoryListItem extends AdminListItem {
  categoryEntity: JournalCategory
  entryCount: number
}

export function createJournalEntryId(): string {
  return `journal-${crypto.randomUUID().slice(0, 8)}`
}

export function createJournalCategoryId(): string {
  return `journal-cat-${crypto.randomUUID().slice(0, 8)}`
}

export function createEmptyJournalEntry(title = 'Untitled entry'): JournalEntry {
  const timestamp = new Date().toISOString()
  return {
    id: createJournalEntryId(),
    title,
    body: '',
    categoryId: null,
    linkedQuestId: null,
    displayConditions: null,
    updatedAt: timestamp,
  }
}

export function createEmptyJournalCategory(name = 'New category'): JournalCategory {
  const timestamp = new Date().toISOString()
  return {
    id: createJournalCategoryId(),
    name,
    description: '',
    updatedAt: timestamp,
  }
}

export function defaultJournalCategories(): JournalCategory[] {
  const timestamp = new Date().toISOString()
  return [
    {
      id: 'journal-cat-main',
      name: 'Main quest',
      description: 'Primary storyline journal notes.',
      updatedAt: timestamp,
    },
    {
      id: 'journal-cat-notes',
      name: 'Notes',
      description: 'Miscellaneous discoveries.',
      updatedAt: timestamp,
    },
  ]
}

export function normalizeJournalEntry(raw: Partial<JournalEntry> & { id: string }): JournalEntry {
  return {
    id: raw.id,
    title: raw.title?.trim() || 'Untitled entry',
    body: raw.body ?? '',
    categoryId:
      typeof raw.categoryId === 'string' && raw.categoryId.length > 0 ? raw.categoryId : null,
    linkedQuestId:
      typeof raw.linkedQuestId === 'string' && raw.linkedQuestId.length > 0
        ? raw.linkedQuestId
        : null,
    displayConditions: normalizeGameplayConditionGroup(raw.displayConditions),
    updatedAt: raw.updatedAt ?? new Date().toISOString(),
  }
}

export function normalizeJournalCategory(
  raw: Partial<JournalCategory> & { id: string },
): JournalCategory {
  return {
    id: raw.id,
    name: raw.name?.trim() || 'Untitled category',
    description: raw.description ?? '',
    updatedAt: raw.updatedAt ?? new Date().toISOString(),
  }
}

export function isJournalCategoryId(id: string, categories: readonly JournalCategory[]): boolean {
  return categories.some((entry) => entry.id === id)
}

export function getJournalCategory(
  categoryId: string | null,
  categories: readonly JournalCategory[],
): JournalCategory | undefined {
  if (!categoryId) return undefined
  return categories.find((entry) => entry.id === categoryId)
}

export function summarizeJournalDisplayConditions(entry: JournalEntry): string {
  if (!entry.displayConditions || entry.displayConditions.children.length === 0) {
    return 'Always (no state gate)'
  }
  const join = entry.displayConditions.join.toUpperCase()
  const count = entry.displayConditions.children.length
  return `${count} state check${count === 1 ? '' : 's'} (${join})`
}

export function summarizeJournalEntry(entry: JournalEntry, maxLen = 64): string {
  const text = entry.body.trim() || entry.title.trim()
  if (!text) return '(empty)'
  return text.length > maxLen ? `${text.slice(0, maxLen)}…` : text
}
