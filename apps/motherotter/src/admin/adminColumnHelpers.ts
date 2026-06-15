import type { AdminColumn, AdminListItem } from './types'

export const ADMIN_TABLE_ALL = 'All'

export function enrichAdminColumns<T extends AdminListItem>(columns: AdminColumn<T>[]): AdminColumn<T>[] {
  return columns.map((column) => {
    const enriched: AdminColumn<T> = { ...column }

    if (enriched.primaryLink === undefined) {
      enriched.primaryLink = column.id === 'title' || column.id === 'name'
    }

    if (enriched.sortable === undefined) {
      enriched.sortable = true
    }

    if (!enriched.filter) {
      if (column.id === 'title' || column.id === 'name') {
        enriched.filter = { type: 'text' }
        enriched.getFilterValue ??= (item) => item.title
        enriched.sortValue ??= (item) => item.title.toLowerCase()
      } else if (column.id === 'category') {
        enriched.filter = { type: 'category' }
        enriched.getFilterValue ??= (item) => item.category
        enriched.sortValue ??= (item) => item.category.toLowerCase()
      } else if (
        column.id === 'updated' ||
        column.header.toLowerCase().includes('modified') ||
        column.header.toLowerCase().includes('updated')
      ) {
        enriched.filter = { type: 'text' }
        enriched.getFilterValue ??= (item) => item.updatedAt
        enriched.sortValue ??= (item) => item.updatedAt
      }
    }

    if (enriched.sortable && !enriched.sortValue && enriched.getFilterValue) {
      enriched.sortValue = (item) => {
        const value = enriched.getFilterValue!(item)
        return typeof value === 'number' ? value : String(value).toLowerCase()
      }
    }

    return enriched
  })
}

export function textColumn<T extends AdminListItem>(
  id: string,
  header: string,
  getValue: (item: T) => string,
  options?: Partial<AdminColumn<T>>,
): AdminColumn<T> {
  return {
    id,
    header,
    render: (item) => getValue(item) || '—',
    filter: { type: 'text' },
    getFilterValue: getValue,
    sortValue: (item) => getValue(item).toLowerCase(),
    sortable: true,
    ...options,
  }
}

export function categoryColumn<T extends AdminListItem>(
  id: string,
  header: string,
  getValue: (item: T) => string,
  options?: Partial<AdminColumn<T>>,
): AdminColumn<T> {
  return {
    id,
    header,
    render: (item) => getValue(item) || '—',
    filter: { type: 'category' },
    getFilterValue: getValue,
    sortValue: (item) => getValue(item).toLowerCase(),
    sortable: true,
    ...options,
  }
}
