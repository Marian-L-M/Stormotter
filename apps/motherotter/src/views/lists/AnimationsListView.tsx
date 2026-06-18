import { useMemo } from 'react'
import { ANIMATION_MOTION_LABELS, type AnimationRenderEngine } from '../../admin/animationTypes'
import { textColumn } from '../../admin/adminColumnHelpers'
import type { AdminColumn, AdminListItem } from '../../admin/types'
import { AdminListShell } from '../../components/admin/AdminListShell'
import { AdminListTable, useAdminListTable } from '../../components/admin/AdminListTable'
import { AdminPagination } from '../../components/admin/AdminPagination'
import { formatTimestamp } from '../../lib/format'
import { useAnimationsStore } from '../../store/animationsStore'
import { useEditorStore } from '../../store/editorStore'

interface AnimationListItem extends AdminListItem {
  stepCount: number
  motionSummary: string
}

interface AnimationsListViewProps {
  renderEngine: AnimationRenderEngine
}

export function AnimationsListView({ renderEngine }: AnimationsListViewProps) {
  const openEntityEditor = useEditorStore((state) => state.openEntityEditor)
  const definitions = useAnimationsStore((state) => state.definitions)
  const addDefinition = useAnimationsStore((state) => state.addDefinition)
  const removeDefinition = useAnimationsStore((state) => state.removeDefinition)
  const duplicateDefinition = useAnimationsStore((state) => state.duplicateDefinition)

  const listItems = useMemo<AnimationListItem[]>(
    () =>
      definitions
        .filter((definition) => definition.renderEngine === renderEngine)
        .map((definition) => ({
          id: definition.id,
          title: definition.name,
          category: renderEngine,
          updatedAt: definition.updatedAt,
          stepCount: definition.steps.length,
          motionSummary:
            definition.steps.length === 0
              ? '—'
              : definition.steps
                  .map((step) => ANIMATION_MOTION_LABELS[step.motion])
                  .slice(0, 3)
                  .join(', ') + (definition.steps.length > 3 ? '…' : ''),
        })),
    [definitions, renderEngine],
  )

  const columns = useMemo<AdminColumn<AnimationListItem>[]>(
    () => [
      textColumn('title', 'Animation', (item) => item.title, { primaryLink: true }),
      textColumn('steps', 'Steps', (item) => String(item.stepCount)),
      textColumn('motion', 'Motion', (item) => item.motionSummary),
      textColumn('updated', 'Modified', (item) => formatTimestamp(item.updatedAt), {
        getFilterValue: (item) => item.updatedAt,
        sortValue: (item) => item.updatedAt,
      }),
    ],
    [],
  )

  const { table } = useAdminListTable({ items: listItems, columns })

  function handleAdd() {
    openEntityEditor(addDefinition(renderEngine))
  }

  return (
    <AdminListShell
      title="Animations"
      description="Reusable animation sequences for abilities, items, and events. Attach multiple bindings per trigger; same order plays in parallel, higher order waits for the previous group."
      addLabel="New animation"
      onAdd={handleAdd}
      pagination={
        <AdminPagination page={table.page} totalPages={table.totalPages} onPageChange={table.setPage} />
      }
    >
      <AdminListTable
        columns={columns}
        items={listItems}
        table={table}
        entityLabel="animation"
        onRowClick={(item) => openEntityEditor(item.id)}
        rowActions={{
          onEdit: (item) => openEntityEditor(item.id),
          onDelete: (item) => removeDefinition(item.id),
          onDuplicate: (item) => {
            const newId = duplicateDefinition(item.id)
            if (newId) openEntityEditor(newId)
          },
        }}
        emptyMessage="No animations yet."
      />
    </AdminListShell>
  )
}
