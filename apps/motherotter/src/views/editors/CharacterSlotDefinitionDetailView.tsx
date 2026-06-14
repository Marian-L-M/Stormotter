import {
  CHARACTER_SLOT_DEFINITIONS,
  CHARACTER_SLOT_GROUP_LABELS,
  HIDDEN_STORAGE_SLOT_COUNT,
  MAIN_HAND_SLOT_COUNT,
  OFF_HAND_SLOT_COUNT,
  PUBLIC_STORAGE_SLOT_COUNT,
  QUICK_SLOT_COUNT,
  QUIVER_SLOT_COUNT,
  characterSlotDefinitionsByGroup,
  getCharacterSlotDefinition,
} from '../../admin/characterSlotTypes'
import { AdminEditorShell } from '../../components/admin/AdminEditorShell'
import { CONTAINER_VISIBILITY_LABELS } from '../../admin/containerTypes'
import { useEditorStore } from '../../store/editorStore'

export function CharacterSlotDefinitionDetailView() {
  const selectedEntityId = useEditorStore((state) => state.selectedEntityId)
  const closeEntityEditor = useEditorStore((state) => state.closeEntityEditor)

  const definition = selectedEntityId ? getCharacterSlotDefinition(selectedEntityId) : undefined

  if (!selectedEntityId || !definition) {
    return (
      <section className="editor-view">
        <p className="admin-empty">Slot definition not found.</p>
        <button type="button" onClick={closeEntityEditor}>
          Back to list
        </button>
      </section>
    )
  }

  return (
    <AdminEditorShell
      listLabel="Slot Definitions"
      itemTitle={definition.name}
      onBack={closeEntityEditor}
    >
      <p className="admin-editor-lead">
        Character slots are fixed and auto-provisioned for every character. Each character receives{' '}
        {MAIN_HAND_SLOT_COUNT} main-hand, {OFF_HAND_SLOT_COUNT} off-hand, and{' '}
        {CHARACTER_SLOT_DEFINITIONS.filter((entry) => entry.group === 'equipment').length -
          MAIN_HAND_SLOT_COUNT -
          OFF_HAND_SLOT_COUNT}{' '}
        other equipment slots, {QUICK_SLOT_COUNT} quick slots, {QUIVER_SLOT_COUNT} quiver slots,{' '}
        {PUBLIC_STORAGE_SLOT_COUNT} public inventory cells, and {HIDDEN_STORAGE_SLOT_COUNT} hidden
        inventory cells.
      </p>

      <dl className="mechanic-builder-inline-meta item-registry-meta">
        <div>
          <dt>Group</dt>
          <dd>{CHARACTER_SLOT_GROUP_LABELS[definition.group]}</dd>
        </div>
        <div>
          <dt>Slot key</dt>
          <dd>
            <code>{definition.slotKey}</code>
          </dd>
        </div>
        <div>
          <dt>Visibility</dt>
          <dd>{CONTAINER_VISIBILITY_LABELS[definition.visibility]}</dd>
        </div>
        {definition.storageIndex !== null ? (
          <div>
            <dt>Storage index</dt>
            <dd>{definition.storageIndex + 1}</dd>
          </div>
        ) : null}
      </dl>

      <label className="field">
        <span>Description</span>
        <textarea className="admin-textarea" rows={3} value={definition.description} disabled />
      </label>
    </AdminEditorShell>
  )
}

export function summarizeSlotDefinitions(): string {
  const grouped = characterSlotDefinitionsByGroup()
  return `${grouped.equipment.length} equipment, ${grouped.public_storage.length} public, ${grouped.hidden_storage.length} hidden`
}
