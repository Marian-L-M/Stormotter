import type { AdminColumn, AdminListItem } from '../../admin/types'

interface AdminDataTableProps<T extends AdminListItem> {
  columns: AdminColumn<T>[]
  items: T[]
  onRowClick: (item: T) => void
  emptyMessage?: string
}

export function AdminDataTable<T extends AdminListItem>({
  columns,
  items,
  onRowClick,
  emptyMessage = 'No items found.',
}: AdminDataTableProps<T>) {
  if (items.length === 0) {
    return <p className="admin-empty">{emptyMessage}</p>
  }

  return (
    <div className="admin-table-wrap">
      <table className="admin-table">
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column.id} scope="col" className={column.className}>
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id}>
              {columns.map((column) => (
                <td key={column.id} className={column.className}>
                  {column.id === 'title' ? (
                    <button type="button" className="admin-row-link" onClick={() => onRowClick(item)}>
                      {column.render(item)}
                    </button>
                  ) : (
                    column.render(item)
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
