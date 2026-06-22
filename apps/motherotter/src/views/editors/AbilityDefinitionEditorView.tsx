import { AdminEditorShell } from '../../components/admin/AdminEditorShell'
import { DefinitionProgressionEditor } from '../../components/admin/DefinitionProgressionEditor'
import { AnimationBindingsEditor } from '../../components/admin/AnimationBindingsEditor'
import { MechanicCompositionFields } from '../../components/admin/MechanicCompositionFields'
import { useAbilitiesStore } from '../../store/abilitiesStore'
import { useEditorStore } from '../../store/editorStore'
import { getAbilityCategoryName } from '../../admin/abilityTypes'

export function AbilityDefinitionEditorView() {
  const selectedEntityId = useEditorStore((state) => state.selectedEntityId)
  const closeEntityEditor = useEditorStore((state) => state.closeEntityEditor)
  const definition = useAbilitiesStore((state) =>
    selectedEntityId ? state.definitions.find((entry) => entry.id === selectedEntityId) : undefined,
  )
  const categories = useAbilitiesStore((state) => state.categories)
  const updateDefinition = useAbilitiesStore((state) => state.updateDefinition)
  const removeDefinition = useAbilitiesStore((state) => state.removeDefinition)

  if (!selectedEntityId || !definition) {
    return (
      <section className="editor-view">
        <p className="admin-empty">Ability not found.</p>
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
    <AdminEditorShell listLabel="Abilities" itemTitle={definition.name} onBack={closeEntityEditor}>
      <p className="admin-editor-lead">
        Abilities are assigned via level grants on characters, types, classes, and items. Each
        assignment includes a value and a trigger from the mechanics trigger list.
      </p>

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
        categories={categories}
        getCategoryName={getAbilityCategoryName}
        entityLabel="ability"
        builderMode="ability"
      />

      <label className="field">
        <span>Description</span>
        <textarea
          className="admin-textarea"
          rows={3}
          value={definition.description}
          placeholder="What this ability does when triggered…"
          onChange={(event) =>
            updateDefinition(definition.id, { description: event.target.value })
          }
        />
      </label>

      <DefinitionProgressionEditor
        progression={definition.progression}
        inputType={definition.inputType}
        onChange={(progression) => updateDefinition(definition.id, { progression })}
      />

      <AnimationBindingsEditor
        bindings={definition.animationBindings}
        onChange={(animationBindings) =>
          updateDefinition(definition.id, { animationBindings })
        }
        allowedTriggers={['on_use', 'on_attack', 'on_hit', 'on_miss', 'on_event', 'on_trigger']}
        hint="Animations play when this ability is used in preview or combat. Same order plays in parallel."
      />

      <div className="admin-editor-actions">
        <button type="button" className="admin-danger-button" onClick={handleRemove}>
          Delete ability
        </button>
      </div>
    </AdminEditorShell>
  )
}
