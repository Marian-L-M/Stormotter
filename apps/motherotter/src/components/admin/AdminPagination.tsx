interface AdminPaginationProps {
  page: number
  totalPages: number
  onPageChange: (page: number) => void
}

export function AdminPagination({ page, totalPages, onPageChange }: AdminPaginationProps) {
  if (totalPages <= 1) return null

  return (
    <div className="admin-pagination">
      <button type="button" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
        ‹ Previous
      </button>
      <span className="muted">
        Page {page} of {totalPages}
      </span>
      <button type="button" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}>
        Next ›
      </button>
    </div>
  )
}
