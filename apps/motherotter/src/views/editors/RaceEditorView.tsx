import { AdminEditorShell } from '../../components/admin/AdminEditorShell'
import { StringListEditor } from '../../components/admin/StringListEditor'
import { TaxonomyEditorFields } from '../../components/admin/TaxonomyEditorFields'
import { useContentCatalogStore } from '../../store/contentCatalogStore'
import { useRacesStore } from '../../store/racesStore'
import { useTaxonomyStore } from '../../store/taxonomyStore'
import { useEditorStore } from '../../store/editorStore'

export function RaceEditorView() {
  const selectedEntityId = useEditorStore((state) => state.selectedEntityId)
  const closeEntityEditor = useEditorStore((state) => state.closeEntityEditor)
  const race = useRacesStore((state) =>
    selectedEntityId ? state.races.find((entry) => entry.id === selectedEntityId) : undefined,
  )
  const updateRace = useRacesStore((state) => state.updateRace)
  const removeRace = useRacesStore((state) => state.removeRace)
  const removeTaxonomyEntity = useTaxonomyStore((state) => state.removeEntity)
  const abilities = useContentCatalogStore((state) => state.stubs.abilities)

  if (!selectedEntityId || !race) {
    return (
      <section className="editor-view">
        <p className="admin-empty">Race not found.</p>
        <button type="button" onClick={closeEntityEditor}>
          Back to list
        </button>
      </section>
    )
  }

  function toggleAbility(abilityId: string) {
    const next = race!.abilityIds.includes(abilityId)
      ? race!.abilityIds.filter((id) => id !== abilityId)
      : [...race!.abilityIds, abilityId]
    updateRace(race!.id, { abilityIds: next })
  }

  function handleRemove() {
    if (!race) return
    removeRace(race.id)
    removeTaxonomyEntity(race.id)
    closeEntityEditor()
  }

  return (
    <AdminEditorShell listLabel="Races" itemTitle={race.name} onBack={closeEntityEditor}>
      <p className="admin-editor-lead">
        Races define innate traits and starting abilities shared by characters of that lineage.
      </p>

      <label className="field">
        <span>Name</span>
        <input
          value={race.name}
          onChange={(event) => updateRace(race.id, { name: event.target.value })}
        />
      </label>

      <label className="field">
        <span>Description</span>
        <textarea
          className="admin-textarea"
          rows={3}
          value={race.description}
          placeholder="Lore, physiology, and cultural notes for this race…"
          onChange={(event) => updateRace(race.id, { description: event.target.value })}
        />
      </label>

      <StringListEditor
        label="Distinct features"
        items={race.distinctFeatures ?? []}
        onChange={(distinctFeatures) => updateRace(race.id, { distinctFeatures })}
        placeholder="e.g. Darkvision, cold resistance, +1 to persuasion…"
        addLabel="Add feature"
      />

      <fieldset className="admin-fieldset">
        <legend>Racial abilities</legend>
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
                    checked={race.abilityIds.includes(ability.id)}
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

      <TaxonomyEditorFields domain="races" entityId={race.id} />

      <div className="admin-editor-actions">
        <button type="button" className="admin-danger-button" onClick={handleRemove}>
          Delete race
        </button>
      </div>
    </AdminEditorShell>
  )
}
