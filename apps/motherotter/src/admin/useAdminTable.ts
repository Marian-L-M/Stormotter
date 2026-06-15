import { useMemo, useState } from 'react'
import type { AdminColumn, AdminListItem, AdminSortDirection } from './types'
import { ADMIN_TABLE_ALL } from './adminColumnHelpers'

export interface UseAdminTableOptions<T extends AdminListItem> {
  items: T[]
  columns: AdminColumn<T>[]
  pageSize?: number
}

export function useAdminTable<T extends AdminListItem>({
  items,
  columns,
  pageSize = 10,
}: UseAdminTableOptions<T>) {
  const [columnFilters, setColumnFilters] = useState<Record<string, string>>({})
  const [sortColumnId, setSortColumnId] = useState<string | null>(null)
  const [sortDirection, setSortDirection] = useState<AdminSortDirection>('asc')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [page, setPage] = useState(1)

  const filtered = useMemo(() => {
    return items.filter((item) => {
      for (const column of columns) {
        if (!column.filter || column.filter.type === 'none') continue
        const rawFilter = columnFilters[column.id] ?? ADMIN_TABLE_ALL
        if (rawFilter === ADMIN_TABLE_ALL || rawFilter === '') continue
        const itemValue = column.getFilterValue?.(item) ?? ''
        if (column.filter.type === 'category') {
          if (itemValue !== rawFilter) return false
        } else {
          if (!String(itemValue).toLowerCase().includes(rawFilter.toLowerCase())) return false
        }
      }
      return true
    })
  }, [items, columns, columnFilters])

  const sorted = useMemo(() => {
    if (!sortColumnId) return filtered
    const column = columns.find((entry) => entry.id === sortColumnId)
    if (!column?.sortValue) return filtered
    return [...filtered].sort((left, right) => {
      const leftValue = column.sortValue!(left)
      const rightValue = column.sortValue!(right)
      const cmp =
        typeof leftValue === 'number' && typeof rightValue === 'number'
          ? leftValue - rightValue
          : String(leftValue).localeCompare(String(rightValue), undefined, { numeric: true })
      return sortDirection === 'asc' ? cmp : -cmp
    })
  }, [filtered, sortColumnId, sortDirection, columns])

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize))
  const safePage = Math.min(page, totalPages)

  const pageItems = useMemo(() => {
    const start = (safePage - 1) * pageSize
    return sorted.slice(start, start + pageSize)
  }, [sorted, pageSize, safePage])

  const pageItemIds = useMemo(() => new Set(pageItems.map((item) => item.id)), [pageItems])
  const allPageSelected = pageItems.length > 0 && pageItems.every((item) => selectedIds.has(item.id))
  const somePageSelected = pageItems.some((item) => selectedIds.has(item.id))

  function setColumnFilter(columnId: string, value: string) {
    setColumnFilters((current) => ({ ...current, [columnId]: value }))
    setPage(1)
  }

  function setSort(columnId: string, direction: AdminSortDirection) {
    setSortColumnId(columnId)
    setSortDirection(direction)
  }

  function toggleSort(columnId: string) {
    if (sortColumnId !== columnId) {
      setSortColumnId(columnId)
      setSortDirection('asc')
      return
    }
    if (sortDirection === 'asc') {
      setSortDirection('desc')
      return
    }
    setSortColumnId(null)
  }

  function toggleRowSelection(id: string) {
    setSelectedIds((current) => {
      const next = new Set(current)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function togglePageSelection() {
    setSelectedIds((current) => {
      const next = new Set(current)
      if (allPageSelected) {
        for (const id of pageItemIds) next.delete(id)
      } else {
        for (const id of pageItemIds) next.add(id)
      }
      return next
    })
  }

  function clearSelection() {
    setSelectedIds(new Set())
  }

  function selectAllFiltered() {
    setSelectedIds(new Set(sorted.map((item) => item.id)))
  }

  function getCategoryOptions(column: AdminColumn<T>): string[] {
    if (column.getCategoryOptions) {
      return [ADMIN_TABLE_ALL, ...column.getCategoryOptions(items)]
    }
    if (!column.getFilterValue) return [ADMIN_TABLE_ALL]
    const values = [...new Set(items.map((item) => column.getFilterValue!(item)).filter(Boolean))].sort()
    return [ADMIN_TABLE_ALL, ...values]
  }

  return {
    columnFilters,
    setColumnFilter,
    sortColumnId,
    sortDirection,
    setSort,
    toggleSort,
    selectedIds,
    toggleRowSelection,
    togglePageSelection,
    allPageSelected,
    somePageSelected,
    clearSelection,
    selectAllFiltered,
    getCategoryOptions,
    page: safePage,
    setPage,
    totalPages,
    totalItems: sorted.length,
    pageItems,
    filtered: sorted,
  }
}

export type AdminTableState<T extends AdminListItem> = ReturnType<typeof useAdminTable<T>>
