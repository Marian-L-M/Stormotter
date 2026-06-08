import { useMemo, useState } from 'react'
import { FORMAT_VERSION } from '@otter/otterfile-core'
import { useAdminList } from '../admin/useAdminList'
import type { AdminColumn, AdminListItem } from '../admin/types'
import { AdminDataTable } from '../components/admin/AdminDataTable'
import { AdminFilterBar } from '../components/admin/AdminFilterBar'
import { AdminListShell } from '../components/admin/AdminListShell'
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
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null)

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

  const list = useAdminList({
    items: listItems,
    categories: ['Open', 'Stored'],
  })

  const columns: AdminColumn[] = [
    {
      id: 'title',
      header: 'Title',
      render: (item) => (
        <>
          {item.title}
          {item.category === 'Open' ? <span className="row-badge">Open</span> : null}
        </>
      ),
    },
    {
      id: 'gameId',
      header: 'Game ID',
      render: (item) => <code>{item.subtitle}</code>,
    },
    {
      id: 'format',
      header: 'Format',
      render: (item) => projects.find((p) => p.projectId === item.id)?.formatVersion ?? '—',
    },
    {
      id: 'updated',
      header: 'Updated',
      render: (item) => formatTimestamp(item.updatedAt),
    },
    {
      id: 'actions',
      header: 'Actions',
      render: (item) => {
        const confirmDelete = pendingDeleteId === item.id
        const isActive = item.id === projectId
        return (
          <div className="row-actions">
            {!isActive ? (
              <button type="button" onClick={() => void switchProject(item.id)}>
                Open
              </button>
            ) : null}
            <button
              type="button"
              className={confirmDelete ? 'danger' : undefined}
              onClick={() => void handleDelete(item.id)}
            >
              {confirmDelete ? 'Confirm delete' : 'Delete'}
            </button>
          </div>
        )
      },
    },
  ]

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

  async function handleDelete(projectIdToDelete: string) {
    if (pendingDeleteId !== projectIdToDelete) {
      setPendingDeleteId(projectIdToDelete)
      return
    }

    setPendingDeleteId(null)
    await deleteProject(projectIdToDelete)
  }

  return (
    <>
      <AdminListShell
        title="Files"
        description="Local projects and portable `.otterfile` cartridges."
        addLabel="New project"
        onAdd={() => void createProject()}
        filters={
          <AdminFilterBar
            search={list.search}
            onSearchChange={list.setSearch}
            category={list.category}
            onCategoryChange={list.setCategory}
            categoryOptions={list.categoryOptions}
            resultCount={list.totalItems}
          />
        }
        pagination={
          <AdminPagination
            page={list.page}
            totalPages={list.totalPages}
            onPageChange={list.setPage}
          />
        }
      >
        <div className="warning-banner" role="note">
          <strong>Local storage only.</strong> Projects live in IndexedDB for this site. Clearing
          browser site data, uninstalling the PWA, or using private browsing can delete them
          permanently. Export important work as `.otterfile` files.
        </div>

        <AdminDataTable
          columns={columns}
          items={list.pageItems}
          onRowClick={(item) => {
            if (item.id !== projectId) void switchProject(item.id)
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
