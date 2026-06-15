import { useMemo, useState } from 'react'
import { FORMAT_VERSION } from '@otter/otterfile-core'
import { categoryColumn, textColumn } from '../admin/adminColumnHelpers'
import type { AdminColumn, AdminListItem } from '../admin/types'
import { AdminListShell } from '../components/admin/AdminListShell'
import { AdminListTable, useAdminListTable } from '../components/admin/AdminListTable'
import { AdminPagination } from '../components/admin/AdminPagination'
import { downloadBytes } from '../lib/download'
import { formatTimestamp } from '../lib/format'
import { useEditorStore } from '../store/editorStore'

export function FilesView() {
  const projectId = useEditorStore((state) => state.projectId)
  const gameId = useEditorStore((state) => state.gameId)
  const projects = useEditorStore((state) => state.projects)
  const persistError = useEditorStore((state) => state.persistError)
  const exportError = useEditorStore((state) => state.exportError)
  const importError = useEditorStore((state) => state.importError)
  const switchProject = useEditorStore((state) => state.switchProject)
  const createProject = useEditorStore((state) => state.createProject)
  const deleteProject = useEditorStore((state) => state.deleteProject)
  const exportOtterfile = useEditorStore((state) => state.exportOtterfile)
  const importOtterfileIntoCurrent = useEditorStore((state) => state.importOtterfileIntoCurrent)
  const importOtterfileAsNew = useEditorStore((state) => state.importOtterfileAsNew)

  const [exporting, setExporting] = useState(false)

  const listItems = useMemo<AdminListItem[]>(
    () =>
      projects.map((project) => ({
        id: project.projectId,
        title: project.title,
        category: project.projectId === projectId ? 'Open' : 'Stored',
        updatedAt: project.updatedAt,
        subtitle: project.gameId,
      })),
    [projects, projectId],
  )

  const columns = useMemo<AdminColumn<AdminListItem>[]>(
    () => [
      textColumn('title', 'Title', (item) => item.title, {
        primaryLink: true,
        render: (item) => (
          <>
            {item.title}
            {item.category === 'Open' ? <span className="row-badge">Open</span> : null}
          </>
        ),
      }),
      textColumn('gameId', 'Game ID', (item) => item.subtitle ?? '—', {
        render: (item) => <code>{item.subtitle}</code>,
      }),
      textColumn('format', 'Format', (item) => {
        const project = projects.find((entry) => entry.projectId === item.id)
        return project?.formatVersion ?? '—'
      }),
      categoryColumn('status', 'Status', (item) => item.category, {
        getCategoryOptions: () => ['Open', 'Stored'],
      }),
      textColumn('updated', 'Updated', (item) => formatTimestamp(item.updatedAt), {
        getFilterValue: (item) => item.updatedAt,
        sortValue: (item) => item.updatedAt,
      }),
    ],
    [projects],
  )

  const { table } = useAdminListTable({ items: listItems, columns })

  async function handleExport() {
    setExporting(true)
    try {
      const bytes = await exportOtterfile()
      downloadBytes(bytes, `${gameId || 'game'}.otterfile`)
    } catch {
      // exportError is set in the store
    } finally {
      setExporting(false)
    }
  }

  async function handleImportIntoCurrent(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return

    try {
      const bytes = new Uint8Array(await file.arrayBuffer())
      await importOtterfileIntoCurrent(bytes)
    } catch {
      // importError is set in the store
    }
  }

  async function handleImportAsNew(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return

    try {
      const bytes = new Uint8Array(await file.arrayBuffer())
      await importOtterfileAsNew(bytes)
    } catch {
      // importError is set in the store
    }
  }

  return (
    <>
      <AdminListShell
        title="Files"
        description="Local projects and portable `.otterfile` cartridges."
        addLabel="New project"
        onAdd={() => void createProject()}
        pagination={
          <AdminPagination page={table.page} totalPages={table.totalPages} onPageChange={table.setPage} />
        }
      >
        <div className="warning-banner" role="note">
          <strong>Local storage only.</strong> Projects live in IndexedDB for this site. Clearing
          browser site data, uninstalling the PWA, or using private browsing can delete them
          permanently. Export important work as `.otterfile` files.
        </div>

        <AdminListTable
          columns={columns}
          items={listItems}
          table={table}
          entityLabel="project"
          onRowClick={(item) => {
            if (item.id !== projectId) void switchProject(item.id)
          }}
          rowActions={{
            onEdit: (item) => {
              if (item.id !== projectId) void switchProject(item.id)
            },
            editLabel: 'Open',
            onDelete: (item) => void deleteProject(item.id),
            canDelete: (item) => item.id !== projectId,
          }}
          onBulkDelete={async (ids) => {
            for (const id of ids) {
              if (id !== projectId) await deleteProject(id)
            }
          }}
          emptyMessage="No local projects yet."
        />

        <p className="muted version-note">
          Runtime otterfile format: <code>{FORMAT_VERSION}</code>.
        </p>
      </AdminListShell>

      <section className="editor-view admin-subpanel-wrap">
        <div className="panel admin-subpanel">
          <div className="panel-header">
            <h3>Cartridge files</h3>
          </div>
          <div className="actions">
            <button type="button" disabled={exporting} onClick={handleExport}>
              {exporting ? 'Exporting…' : 'Export .otterfile'}
            </button>
            <label className="secondary-button">
              Import into current
              <input
                type="file"
                accept=".otterfile,application/zip"
                onChange={handleImportIntoCurrent}
              />
            </label>
            <label className="secondary-button">
              Import as new project
              <input type="file" accept=".otterfile,application/zip" onChange={handleImportAsNew} />
            </label>
          </div>
        </div>

        {persistError ? <p className="error-banner">{persistError}</p> : null}
        {exportError ? <p className="error-banner">{exportError}</p> : null}
        {importError ? <p className="error-banner">{importError}</p> : null}
      </section>
    </>
  )
}
