import { getEditorModeLabel } from '../../editorModes'
import type { StubContentType } from '../../admin/types'
import type { TaxonomyDomain } from '../../admin/taxonomyTypes'
import { AdminEditorShell } from '../../components/admin/AdminEditorShell'
import { TaxonomyEditorFields } from '../../components/admin/TaxonomyEditorFields'
import { useContentCatalogStore } from '../../store/contentCatalogStore'
import { useTaxonomyStore } from '../../store/taxonomyStore'
import { useEditorStore } from '../../store/editorStore'

interface StubContentEditorViewProps {
  type: StubContentType
}

function stubTypeToDomain(type: StubContentType): TaxonomyDomain | null {
  if (type === 'characters') return 'characters'
  return type
}

export function StubContentEditorView({ type }: StubContentEditorViewProps) {
  const selectedEntityId = useEditorStore((state) => state.selectedEntityId)
  const closeEntityEditor = useEditorStore((state) => state.closeEntityEditor)
  const item = useContentCatalogStore((state) =>
    selectedEntityId ? state.stubs[type].find((entry) => entry.id === selectedEntityId) : undefined,
  )
  const updateItem = useContentCatalogStore((state) => state.updateItem)
  const removeItem = useContentCatalogStore((state) => state.removeItem)
  const removeTaxonomyEntity = useTaxonomyStore((state) => state.removeEntity)
  const taxonomyDomain = stubTypeToDomain(type)

  if (!selectedEntityId || !item) {
    return (
      <section className="editor-view">
        <p className="admin-empty">Item not found.</p>
        <button type="button" onClick={closeEntityEditor}>
          Back to list
        </button>
      </section>
    )
  }

  const listLabel = getEditorModeLabel(type)

  function handleRemove() {
    if (!item) return
    removeItem(type, item.id)
    removeTaxonomyEntity(item.id)
    closeEntityEditor()
  }

  return (
    <AdminEditorShell listLabel={listLabel} itemTitle={item.title} onBack={closeEntityEditor}>
      <p className="admin-editor-lead">
        Dedicated {listLabel.toLowerCase()} editor — assign categories and tags below.
      </p>

      <label className="field">
        <span>Title</span>
        <input
          value={item.title}
          onChange={(event) => updateItem(type, item.id, { title: event.target.value })}
        />
      </label>

      <label className="field">
        <span>Summary</span>
        <textarea
          className="admin-textarea"
          rows={4}
          value={item.subtitle ?? ''}
          placeholder="Optional notes for this entry…"
          onChange={(event) => updateItem(type, item.id, { subtitle: event.target.value })}
        />
      </label>

      {taxonomyDomain ? <TaxonomyEditorFields domain={taxonomyDomain} entityId={item.id} /> : null}

      <div className="admin-editor-actions">
        <button type="button" className="admin-danger-button" onClick={handleRemove}>
          Delete entry
        </button>
      </div>
    </AdminEditorShell>
  )
}
