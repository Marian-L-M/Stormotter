import { useMemo, useState } from 'react'

const ALL_CATEGORY = 'All'

export interface UseAdminListOptions<T extends { title: string; category: string }> {
  items: T[]
  pageSize?: number
  categories?: string[]
}

export function useAdminList<T extends { title: string; category: string }>({
  items,
  pageSize = 10,
  categories,
}: UseAdminListOptions<T>) {
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState(ALL_CATEGORY)
  const [page, setPage] = useState(1)

  const categoryOptions = useMemo(() => {
    const fromItems = [...new Set(items.map((item) => item.category))].sort()
    const merged = categories ? [...new Set([...categories, ...fromItems])] : fromItems
    return [ALL_CATEGORY, ...merged.filter((c) => c !== ALL_CATEGORY)]
  }, [items, categories])

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase()
    return items.filter((item) => {
      if (category !== ALL_CATEGORY && item.category !== category) return false
      if (!query) return true
      return item.title.toLowerCase().includes(query)
    })
  }, [items, search, category])

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const safePage = Math.min(page, totalPages)

  const pageItems = useMemo(() => {
    const start = (safePage - 1) * pageSize
    return filtered.slice(start, start + pageSize)
  }, [filtered, pageSize, safePage])

  function setSearchQuery(value: string) {
    setSearch(value)
    setPage(1)
  }

  function setCategoryFilter(value: string) {
    setCategory(value)
    setPage(1)
  }

  return {
    search,
    setSearch: setSearchQuery,
    category,
    setCategory: setCategoryFilter,
    categoryOptions,
    page: safePage,
    setPage,
    totalPages,
    totalItems: filtered.length,
    pageItems,
    filtered,
  }
}
