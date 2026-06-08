import {
  CHARACTER_CATEGORY_LABELS,
  CHARACTER_CATEGORY_ORDER,
  type CharacterCategory,
} from '../../admin/characterTypes'
import { AdminEditorShell } from '../../components/admin/AdminEditorShell'
import { TaxonomyEditorFields } from '../../components/admin/TaxonomyEditorFields'
import { useCharacterMetaStore, DEFAULT_META } from '../../store/characterMetaStore'
import { useContentCatalogStore } from '../../store/contentCatalogStore'
import { useRacesStore } from '../../store/racesStore'
import { useTaxonomyStore } from '../../store/taxonomyStore'
import { useEditorStore } from '../../store/editorStore'

export function CharacterEditorView() {
  const selectedEntityId = useEditorStore((state) => state.selectedEntityId)
  const closeEntityEditor = useEditorStore((state) => state.closeEntityEditor)
  const item = useContentCatalogStore((state) =>
    selectedEntityId
      ? state.stubs.characters.find((entry) => entry.id === selectedEntityId)
      : undefined,
  )
  const updateItem = useContentCatalogStore((state) => state.updateItem)
  const removeItem = useContentCatalogStore((state) => state.removeItem)
  const storedMeta = useCharacterMetaStore((state) =>
    selectedEntityId ? state.metaByCharacterId[selectedEntityId] : undefined,
  )
  const updateMeta = useCharacterMetaStore((state) => state.updateMeta)
  const removeMeta = useCharacterMetaStore((state) => state.removeMeta)
  const removeTaxonomyEntity = useTaxonomyStore((state) => state.removeEntity)
  const races = useRacesStore((state) => state.races)

  if (!selectedEntityId || !item) {
    return (
      <section className="editor-view">
        <p className="admin-empty">Character not found.</p>
        <button type="button" onClick={closeEntityEditor}>
          Back to list
        </button>
      </section>
    )
  }

  const meta = storedMeta ?? DEFAULT_META

  function handleRemove() {
    if (!item) return
    removeItem('characters', item.id)
    removeMeta(item.id)
    removeTaxonomyEntity(item.id)
    closeEntityEditor()
  }

  return (
    <AdminEditorShell listLabel="Characters" itemTitle={item.title} onBack={closeEntityEditor}>
      <p className="admin-editor-lead">
        Character definitions for user-created, unique NPC, and random characters.
      </p>

      <label className="field">
        <span>Title</span>
        <input
          value={item.title}
          onChange={(event) => updateItem('characters', item.id, { title: event.target.value })}
        />
      </label>

      <label className="field">
        <span>Character type</span>
        <select
          className="admin-select admin-select-block"
          value={meta.characterType}
          onChange={(event) =>
            updateMeta(item.id, {
              characterType: event.target.value as CharacterCategory,
            })
          }
        >
          {CHARACTER_CATEGORY_ORDER.map((category) => (
            <option key={category} value={category}>
              {CHARACTER_CATEGORY_LABELS[category]}
            </option>
          ))}
        </select>
      </label>

      <label className="field">
        <span>Race</span>
        <select
          className="admin-select admin-select-block"
          value={meta.raceId ?? ''}
          onChange={(event) =>
            updateMeta(item.id, { raceId: event.target.value || null })
          }
        >
          <option value="">Unassigned</option>
          {races.map((race) => (
            <option key={race.id} value={race.id}>
              {race.name}
            </option>
          ))}
        </select>
        <span className="field-hint">Optional link to a race from the Races tab.</span>
      </label>

      <label className="field">
        <span>Summary</span>
        <textarea
          className="admin-textarea"
          rows={4}
          value={meta.summary}
          placeholder="Optional notes for this character…"
          onChange={(event) => updateMeta(item.id, { summary: event.target.value })}
        />
      </label>

      <TaxonomyEditorFields domain="characters" entityId={item.id} />

      <div className="admin-editor-actions">
        <button type="button" className="admin-danger-button" onClick={handleRemove}>
          Delete character
        </button>
      </div>
    </AdminEditorShell>
  )
}
