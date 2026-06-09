import {
  ATTRIBUTE_SOURCE_LABELS,
} from '../../admin/attributeTypes'
import { AdminEditorShell } from '../../components/admin/AdminEditorShell'
import { MechanicCompositionFields } from '../../components/admin/MechanicCompositionFields'
import { useAttributesStore } from '../../store/attributesStore'
import { useEditorStore } from '../../store/editorStore'

export function AttributeDefinitionEditorView() {
  const selectedEntityId = useEditorStore((state) => state.selectedEntityId)
  const closeEntityEditor = useEditorStore((state) => state.closeEntityEditor)
  const definition = useAttributesStore((state) =>
    selectedEntityId ? state.definitions.find((entry) => entry.id === selectedEntityId) : undefined,
  )
  const updateDefinition = useAttributesStore((state) => state.updateDefinition)
  const removeDefinition = useAttributesStore((state) => state.removeDefinition)

  if (!selectedEntityId || !definition) {
    return (
      <section className="editor-view">
        <p className="admin-empty">Attribute not found.</p>
        <button type="button" onClick={closeEntityEditor}>
          Back to list
        </button>
      </section>
    )
  }

  function handleRemove() {
    removeDefinition(definition!.id)
    closeEntityEditor()
  }

  return (
    <AdminEditorShell
      listLabel="Attributes"
      itemTitle={definition.name}
      onBack={closeEntityEditor}
    >
      <p className="admin-editor-lead">
        {definition.source === 'standard'
          ? 'Standard attributes are assigned via level grants on characters, types, and classes.'
          : 'Custom attributes must be searched and assigned individually on each entity.'}
      </p>

      <label className="field">
        <span>Source</span>
        <input value={ATTRIBUTE_SOURCE_LABELS[definition.source]} disabled />
      </label>

      <label className="field">
        <span>Name (display)</span>
        <input
          value={definition.name}
          onChange={(event) => updateDefinition(definition.id, { name: event.target.value })}
        />
      </label>

      <MechanicCompositionFields
        definition={definition}
        onChange={(patch) => updateDefinition(definition.id, patch)}
      />

      <label className="field">
        <span>Description</span>
        <textarea
          className="admin-textarea"
          rows={3}
          value={definition.description}
          placeholder="What this attribute represents…"
          onChange={(event) =>
            updateDefinition(definition.id, { description: event.target.value })
          }
        />
      </label>

      <div className="admin-editor-actions">
        <button type="button" className="admin-danger-button" onClick={handleRemove}>
          Delete attribute
        </button>
      </div>
    </AdminEditorShell>
  )
}
