import {
  DERIVED_STAT_DEFAULT_BASES,
  DERIVED_STAT_GROUP_LABELS,
  DERIVED_STAT_HINTS,
  DERIVED_STAT_LABELS,
  groupDerivedStatKeys,
  type DerivedStatBaseMap,
  type DerivedStatKey,
} from '../../admin/derivedStatTypes'

interface DerivedStatBaseEditorProps {
  value: DerivedStatBaseMap
  onChange: (value: DerivedStatBaseMap) => void
  inheritHint?: string
}

export function DerivedStatBaseEditor({
  value,
  onChange,
  inheritHint = 'Inherit from more general layer (character → class → type → default)',
}: DerivedStatBaseEditorProps) {
  function setBase(key: DerivedStatKey, next: number | null) {
    const updated = { ...value, [key]: next }
    if (next === null) delete updated[key]
    onChange(updated)
  }

  function parseBaseInput(raw: string): number | null {
    const trimmed = raw.trim()
    if (trimmed === '') return null
    const next = Number(trimmed)
    return Number.isFinite(next) ? next : null
  }

  const groups = groupDerivedStatKeys()

  return (
    <fieldset className="admin-fieldset">
      <legend>Derived stat bases</legend>
      <p className="field-hint">
        Set starting values before modifiers. Specific layers override general ones: character beats
        class, class beats type, type beats system default.
      </p>
      <div className="derived-stat-table-wrap">
        <table className="admin-table derived-stat-table">
          <thead>
            <tr>
              <th>Stat</th>
              <th>Default</th>
              <th>Inherit</th>
              <th>Set base</th>
              <th>Value</th>
            </tr>
          </thead>
          {groups.map(({ group, keys }) => (
            <tbody key={group}>
              <tr className="derived-stat-group-row">
                <th colSpan={5}>{DERIVED_STAT_GROUP_LABELS[group]}</th>
              </tr>
              {keys.map((key) => {
                const current = value[key] ?? null
                const mode = current === null ? 'inherit' : 'set'
                return (
                  <tr key={key}>
                    <td>
                      <span className="derived-stat-label">{DERIVED_STAT_LABELS[key]}</span>
                      <span className="field-hint derived-stat-hint">{DERIVED_STAT_HINTS[key]}</span>
                    </td>
                    <td>{DERIVED_STAT_DEFAULT_BASES[key]}</td>
                    <td>
                      <input
                        type="radio"
                        name={`derived-base-${key}`}
                        checked={mode === 'inherit'}
                        onChange={() => setBase(key, null)}
                      />
                    </td>
                    <td>
                      <input
                        type="radio"
                        name={`derived-base-${key}`}
                        checked={mode === 'set'}
                        onChange={() => setBase(key, DERIVED_STAT_DEFAULT_BASES[key])}
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        className="admin-stat-range-input derived-stat-input"
                        disabled={mode === 'inherit'}
                        value={mode === 'set' && current !== null ? current : ''}
                        placeholder="—"
                        onChange={(event) => {
                          const parsed = parseBaseInput(event.target.value)
                          if (parsed === null && event.target.value.trim() !== '') return
                          setBase(key, parsed ?? DERIVED_STAT_DEFAULT_BASES[key])
                        }}
                      />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          ))}
        </table>
      </div>
      <p className="field-hint">{inheritHint}</p>
    </fieldset>
  )
}
