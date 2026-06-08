import { AdminEditorShell } from '../../components/admin/AdminEditorShell'
import { TaxonomyEditorFields } from '../../components/admin/TaxonomyEditorFields'
import {
  LINEAGE_STAT_KEYS,
  LINEAGE_STAT_LABELS,
  type LineageStatKey,
} from '../../admin/lineageTypes'
import { useContentCatalogStore } from '../../store/contentCatalogStore'
import { useLineageTypesStore } from '../../store/lineageTypesStore'
import { useTaxonomyStore } from '../../store/taxonomyStore'
import { useEditorStore } from '../../store/editorStore'

export function LineageTypeEditorView() {
  const selectedEntityId = useEditorStore((state) => state.selectedEntityId)
  const closeEntityEditor = useEditorStore((state) => state.closeEntityEditor)
  const lineageType = useLineageTypesStore((state) =>
    selectedEntityId ? state.lineageTypes.find((entry) => entry.id === selectedEntityId) : undefined,
  )
  const updateLineageType = useLineageTypesStore((state) => state.updateLineageType)
  const removeLineageType = useLineageTypesStore((state) => state.removeLineageType)
  const removeTaxonomyEntity = useTaxonomyStore((state) => state.removeEntity)
  const abilities = useContentCatalogStore((state) => state.stubs.abilities)

  if (!selectedEntityId || !lineageType) {
    return (
      <section className="editor-view">
        <p className="admin-empty">Character type not found.</p>
        <button type="button" onClick={closeEntityEditor}>
          Back to list
        </button>
      </section>
    )
  }

  function toggleAbility(abilityId: string) {
    const next = lineageType!.abilityIds.includes(abilityId)
      ? lineageType!.abilityIds.filter((id) => id !== abilityId)
      : [...lineageType!.abilityIds, abilityId]
    updateLineageType(lineageType!.id, { abilityIds: next })
  }

  function updateStatRange(stat: LineageStatKey, field: 'min' | 'max', value: number) {
    if (!Number.isFinite(value)) return
    updateLineageType(lineageType!.id, {
      statRanges: {
        ...lineageType!.statRanges,
        [stat]: {
          ...lineageType!.statRanges[stat],
          [field]: value,
        },
      },
    })
  }

  function handleRemove() {
    if (!lineageType) return
    removeLineageType(lineageType.id)
    removeTaxonomyEntity(lineageType.id)
    closeEntityEditor()
  }

  return (
    <AdminEditorShell
      listLabel="Character Types"
      itemTitle={lineageType.name}
      onBack={closeEntityEditor}
    >
      <p className="admin-editor-lead">
        Character types define allowed stat ranges and innate abilities for each lineage.
      </p>

      <label className="field">
        <span>Name</span>
        <input
          value={lineageType.name}
          onChange={(event) => updateLineageType(lineageType.id, { name: event.target.value })}
        />
      </label>

      <label className="field">
        <span>Description</span>
        <textarea
          className="admin-textarea"
          rows={3}
          value={lineageType.description}
          placeholder="Lore, physiology, and cultural notes for this type…"
          onChange={(event) =>
            updateLineageType(lineageType.id, { description: event.target.value })
          }
        />
      </label>

      <fieldset className="admin-fieldset">
        <legend>Stat ranges</legend>
        <div className="admin-stat-range-grid">
          <div className="admin-stat-range-row admin-stat-range-headers">
            <span className="admin-stat-range-header">Stat</span>
            <span className="admin-stat-range-header">Minimum</span>
            <span className="admin-stat-range-header">Maximum</span>
          </div>
          {LINEAGE_STAT_KEYS.map((stat) => (
            <div key={stat} className="admin-stat-range-row">
              <span className="admin-stat-range-label">{LINEAGE_STAT_LABELS[stat]}</span>
              <input
                type="number"
                className="admin-stat-range-input"
                value={lineageType.statRanges[stat].min}
                onChange={(event) => updateStatRange(stat, 'min', Number(event.target.value))}
              />
              <input
                type="number"
                className="admin-stat-range-input"
                value={lineageType.statRanges[stat].max}
                onChange={(event) => updateStatRange(stat, 'max', Number(event.target.value))}
              />
            </div>
          ))}
        </div>
      </fieldset>

      <fieldset className="admin-fieldset">
        <legend>Type abilities</legend>
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
                    checked={lineageType.abilityIds.includes(ability.id)}
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

      <TaxonomyEditorFields domain="character-types" entityId={lineageType.id} />

      <div className="admin-editor-actions">
        <button type="button" className="admin-danger-button" onClick={handleRemove}>
          Delete character type
        </button>
      </div>
    </AdminEditorShell>
  )
}
