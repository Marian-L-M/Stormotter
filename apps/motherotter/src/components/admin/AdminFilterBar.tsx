interface AdminFilterBarProps {
  search: string
  onSearchChange: (value: string) => void
  category: string
  onCategoryChange: (value: string) => void
  categoryOptions: string[]
  resultCount: number
}

export function AdminFilterBar({
  search,
  onSearchChange,
  category,
  onCategoryChange,
  categoryOptions,
  resultCount,
}: AdminFilterBarProps) {
  return (
    <div className="admin-filter-bar">
      <input
        type="search"
        className="admin-search"
        placeholder="Search…"
        value={search}
        onChange={(event) => onSearchChange(event.target.value)}
        aria-label="Search list"
      />
      <select
        className="admin-select"
        value={category}
        onChange={(event) => onCategoryChange(event.target.value)}
        aria-label="Filter by category"
      >
        {categoryOptions.map((option) => (
          <option key={option} value={option}>
            {option === 'All' ? 'All categories' : option}
          </option>
        ))}
      </select>
      <span className="admin-result-count muted">{resultCount} items</span>
    </div>
  )
}
