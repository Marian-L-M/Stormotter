import { AdminEditorShell } from '../../components/admin/AdminEditorShell'
import { ITEM_TRIGGER_GROUP_LABELS, getItemTrigger } from '../../admin/itemTypes'
import { useEditorStore } from '../../store/editorStore'

export function TriggerDetailView() {
  const selectedEntityId = useEditorStore((state) => state.selectedEntityId)
  const closeEntityEditor = useEditorStore((state) => state.closeEntityEditor)

  const trigger = selectedEntityId ? getItemTrigger(selectedEntityId) : undefined

  if (!selectedEntityId || !trigger) {
    return (
      <section className="editor-view">
        <p className="admin-empty">Trigger not found.</p>
        <button type="button" onClick={closeEntityEditor}>
          Back to list
        </button>
      </section>
    )
  }

  return (
    <AdminEditorShell listLabel="Triggers" itemTitle={trigger.label} onBack={closeEntityEditor}>
      <p className="admin-editor-lead">
        Triggers are fixed system events. Assign them to item effects with the &quot;On trigger&quot;
        application mode.
      </p>

      <dl className="mechanic-builder-inline-meta item-registry-meta">
        <div>
          <dt>Group</dt>
          <dd>{ITEM_TRIGGER_GROUP_LABELS[trigger.group]}</dd>
        </div>
        <div>
          <dt>Trigger ID</dt>
          <dd>
            <code>{trigger.id}</code>
          </dd>
        </div>
      </dl>

      <label className="field">
        <span>Description</span>
        <textarea className="admin-textarea" rows={3} value={trigger.description} disabled />
      </label>
    </AdminEditorShell>
  )
}
