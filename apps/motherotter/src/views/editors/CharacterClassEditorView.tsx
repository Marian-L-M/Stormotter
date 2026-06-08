import { AdminEditorShell } from '../../components/admin/AdminEditorShell'
import { StringListEditor } from '../../components/admin/StringListEditor'
import { TaxonomyEditorFields } from '../../components/admin/TaxonomyEditorFields'
import { useContentCatalogStore } from '../../store/contentCatalogStore'
import { useCharacterClassesStore } from '../../store/characterClassesStore'
import { useTaxonomyStore } from '../../store/taxonomyStore'
import { useEditorStore } from '../../store/editorStore'

export function CharacterClassEditorView() {
  const selectedEntityId = useEditorStore((state) => state.selectedEntityId)
  const closeEntityEditor = useEditorStore((state) => state.closeEntityEditor)
  const characterClass = useCharacterClassesStore((state) =>
    selectedEntityId
      ? state.characterClasses.find((entry) => entry.id === selectedEntityId)
      : undefined,
  )
  const updateCharacterClass = useCharacterClassesStore((state) => state.updateCharacterClass)
  const removeCharacterClass = useCharacterClassesStore((state) => state.removeCharacterClass)
  const removeTaxonomyEntity = useTaxonomyStore((state) => state.removeEntity)
  const abilities = useContentCatalogStore((state) => state.stubs.abilities)

  if (!selectedEntityId || !characterClass) {
    return (
      <section className="editor-view">
        <p className="admin-empty">Character class not found.</p>
        <button type="button" onClick={closeEntityEditor}>
          Back to list
        </button>
      </section>
    )
  }

  function toggleAbility(abilityId: string) {
    const next = characterClass!.abilityIds.includes(abilityId)
      ? characterClass!.abilityIds.filter((id) => id !== abilityId)
      : [...characterClass!.abilityIds, abilityId]
    updateCharacterClass(characterClass!.id, { abilityIds: next })
  }

  function handleRemove() {
    if (!characterClass) return
    removeCharacterClass(characterClass.id)
    removeTaxonomyEntity(characterClass.id)
    closeEntityEditor()
  }

  return (
    <AdminEditorShell
      listLabel="Character Classes"
      itemTitle={characterClass.name}
      onBack={closeEntityEditor}
    >
      <p className="admin-editor-lead">
        Character classes define jobs, roles, and combat styles such as warrior, mage, or rogue.
      </p>

      <label className="field">
        <span>Name</span>
        <input
          value={characterClass.name}
          onChange={(event) =>
            updateCharacterClass(characterClass.id, { name: event.target.value })
          }
        />
      </label>

      <label className="field">
        <span>Description</span>
        <textarea
          className="admin-textarea"
          rows={3}
          value={characterClass.description}
          placeholder="Training, equipment, and role notes for this class…"
          onChange={(event) =>
            updateCharacterClass(characterClass.id, { description: event.target.value })
          }
        />
      </label>

      <StringListEditor
        label="Distinct features"
        items={characterClass.distinctFeatures ?? []}
        onChange={(distinctFeatures) =>
          updateCharacterClass(characterClass.id, { distinctFeatures })
        }
        placeholder="e.g. Heavy armor proficiency, spell focus bonus…"
        addLabel="Add feature"
      />

      <fieldset className="admin-fieldset">
        <legend>Class abilities</legend>
        {abilities.length === 0 ? (
          <p className="admin-empty admin-empty-inline">
            No abilities defined yet. Create abilities in the Abilities tab, then link them here.
          </p>
        ) : (
          <ul className="admin-checkbox-list">
            {abilities.map((ability) => (
              <li key={ability.id}>
                <label className="admin-checkbox-label">
                  <input
                    type="checkbox"
                    checked={characterClass.abilityIds.includes(ability.id)}
                    onChange={() => toggleAbility(ability.id)}
                  />
                  <span>
                    <strong>{ability.title}</strong>
                    {ability.subtitle ? (
                      <span className="admin-checkbox-sublabel">{ability.subtitle}</span>
                    ) : null}
                  </span>
                </label>
              </li>
            ))}
          </ul>
        )}
      </fieldset>

      <TaxonomyEditorFields domain="character-classes" entityId={characterClass.id} />

      <div className="admin-editor-actions">
        <button type="button" className="admin-danger-button" onClick={handleRemove}>
          Delete character class
        </button>
      </div>
    </AdminEditorShell>
  )
}
