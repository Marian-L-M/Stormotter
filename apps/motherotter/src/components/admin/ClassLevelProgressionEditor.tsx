import { MAX_CHARACTER_LEVEL } from '../../admin/characterLevelTypes'
import {
  createDefaultClassLevelProgression,
  normalizeClassLevelProgressionEntry,
  type ClassLevelProgressionEntry,
} from '../../admin/progressionTypes'

interface ClassLevelProgressionEditorProps {
  value: ClassLevelProgressionEntry[]
  onChange: (value: ClassLevelProgressionEntry[]) => void
}

function sortedEntries(value: ClassLevelProgressionEntry[]): ClassLevelProgressionEntry[] {
  return [...value].sort((left, right) => left.level - right.level)
}

export function ClassLevelProgressionEditor({ value, onChange }: ClassLevelProgressionEditorProps) {
  const entries = sortedEntries(value)

  function updateEntry(level: number, patch: Partial<ClassLevelProgressionEntry>) {
    const next = entries.map((entry) =>
      entry.level === level ? normalizeClassLevelProgressionEntry({ ...entry, ...patch }, level) : entry,
    )
    onChange(next)
  }

  function seedDefaults() {
    onChange(createDefaultClassLevelProgression())
  }

  function addLevel() {
    const nextLevel =
      entries.length > 0 ? Math.min(MAX_CHARACTER_LEVEL, Math.max(...entries.map((e) => e.level)) + 1) : 1
    if (entries.some((entry) => entry.level === nextLevel)) return
    const previous = entries.find((entry) => entry.level === nextLevel - 1)
    onChange([
      ...entries,
      normalizeClassLevelProgressionEntry(
        {
          level: nextLevel,
          xpRequired: previous ? previous.xpRequired + nextLevel * 100 : 0,
        },
        nextLevel,
      ),
    ])
  }

  return (
    <fieldset className="admin-fieldset">
      <legend>Level progression</legend>
      <p className="field-hint admin-attribute-hint">
        Cumulative XP thresholds per class level. Points and auto-grants apply immediately on level-up
        (runtime in Gameotter).
      </p>

      <div className="admin-editor-actions admin-editor-actions-inline">
        <button type="button" onClick={seedDefaults}>
          Seed default table
        </button>
        <button type="button" onClick={addLevel} disabled={entries.length >= MAX_CHARACTER_LEVEL}>
          Add level
        </button>
      </div>

      {entries.length === 0 ? (
        <p className="admin-empty admin-empty-inline">No progression rows yet.</p>
      ) : (
        <div className="admin-progression-table-wrap">
          <table className="admin-progression-table">
            <thead>
              <tr>
                <th>Level</th>
                <th>Cumulative XP</th>
                <th>Ability pts</th>
                <th>Attribute pts</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => (
                <tr key={entry.level}>
                  <td>{entry.level}</td>
                  <td>
                    <input
                      type="number"
                      min={0}
                      className="admin-stat-range-input"
                      value={entry.xpRequired}
                      onChange={(event) =>
                        updateEntry(entry.level, {
                          xpRequired: Math.max(0, Math.round(Number(event.target.value) || 0)),
                        })
                      }
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      min={0}
                      className="admin-stat-range-input"
                      value={entry.abilityPointsGranted}
                      onChange={(event) =>
                        updateEntry(entry.level, {
                          abilityPointsGranted: Math.max(
                            0,
                            Math.round(Number(event.target.value) || 0),
                          ),
                        })
                      }
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      min={0}
                      className="admin-stat-range-input"
                      value={entry.attributePointsGranted}
                      onChange={(event) =>
                        updateEntry(entry.level, {
                          attributePointsGranted: Math.max(
                            0,
                            Math.round(Number(event.target.value) || 0),
                          ),
                        })
                      }
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {entries.length > 0 ? (
        <p className="field-hint">
          Level 1 XP is typically 0. Next level requires cumulative XP ≥ threshold for that level.
        </p>
      ) : null}
    </fieldset>
  )
}
