import {
  createContainerLootEntryId,
  type ContainerLootEntry,
} from '../../admin/containerTypes'
import { useItemsStore } from '../../store/itemsStore'

interface ContainerLootEditorProps {
  entries: ContainerLootEntry[]
  onChange: (entries: ContainerLootEntry[]) => void
}

export function ContainerLootEditor({ entries, onChange }: ContainerLootEditorProps) {
  const genericItems = useItemsStore((state) =>
    state.items.filter((entry) => entry.scope === 'generic'),
  )

  function updateEntry(id: string, patch: Partial<ContainerLootEntry>) {
    onChange(entries.map((entry) => (entry.id === id ? { ...entry, ...patch } : entry)))
  }

  function addEntry() {
    onChange([
      ...entries,
      {
        id: createContainerLootEntryId(),
        genericItemId: genericItems[0]?.id ?? '',
        weight: 1,
        minQuantity: 1,
        maxQuantity: 1,
      },
    ])
  }

  function removeEntry(id: string) {
    onChange(entries.filter((entry) => entry.id !== id))
  }

  return (
    <fieldset className="admin-fieldset">
      <legend>Loot table</legend>
      <p className="field-hint admin-attribute-hint">
        Random containers roll from generic item templates. Weights control relative drop chance;
        generation scripts use min/max quantity at runtime.
      </p>

      {genericItems.length === 0 ? (
        <p className="admin-empty admin-empty-inline">
          Create generic items first — they serve as templates for random loot.
        </p>
      ) : entries.length === 0 ? (
        <p className="admin-empty admin-empty-inline">No loot entries yet.</p>
      ) : (
        <div className="container-loot-list">
          {entries.map((entry) => (
            <div key={entry.id} className="container-loot-row">
              <label className="field">
                <span>Generic item template</span>
                <select
                  className="admin-select admin-select-block"
                  value={entry.genericItemId}
                  onChange={(event) => updateEntry(entry.id, { genericItemId: event.target.value })}
                >
                  <option value="">Select template…</option>
                  {genericItems.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="field">
                <span>Weight</span>
                <input
                  type="number"
                  min={1}
                  value={entry.weight}
                  onChange={(event) => {
                    const value = Number(event.target.value)
                    updateEntry(entry.id, { weight: Number.isFinite(value) && value > 0 ? value : 1 })
                  }}
                />
              </label>
              <label className="field">
                <span>Min qty</span>
                <input
                  type="number"
                  min={0}
                  value={entry.minQuantity}
                  onChange={(event) => {
                    const value = Number(event.target.value)
                    updateEntry(entry.id, {
                      minQuantity: Number.isFinite(value) && value >= 0 ? value : 0,
                    })
                  }}
                />
              </label>
              <label className="field">
                <span>Max qty</span>
                <input
                  type="number"
                  min={0}
                  value={entry.maxQuantity}
                  onChange={(event) => {
                    const value = Number(event.target.value)
                    updateEntry(entry.id, {
                      maxQuantity: Number.isFinite(value) && value >= 0 ? value : 0,
                    })
                  }}
                />
              </label>
              <button
                type="button"
                className="admin-text-button admin-danger-text"
                onClick={() => removeEntry(entry.id)}
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      )}

      <button
        type="button"
        className="admin-secondary-button"
        onClick={addEntry}
        disabled={genericItems.length === 0}
      >
        Add loot entry
      </button>
    </fieldset>
  )
}
