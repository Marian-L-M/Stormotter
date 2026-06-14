import {
  DERIVED_STAT_GROUP_LABELS,
  DERIVED_STAT_HINTS,
  DERIVED_STAT_LABELS,
  groupDerivedStatKeys,
  type DerivedStatKey,
  type DerivedStatModifierMap,
} from '../../admin/derivedStatTypes'

interface DerivedStatModifierEditorProps {
  value: DerivedStatModifierMap
  onChange: (value: DerivedStatModifierMap) => void
  legend?: string
  hint?: string
}

export function DerivedStatModifierEditor({
  value,
  onChange,
  legend = 'Derived stat modifiers',
  hint = 'Flat bonuses added on top of base values and automatic stat modifiers.',
}: DerivedStatModifierEditorProps) {
  function setModifier(key: DerivedStatKey, raw: string) {
    const trimmed = raw.trim()
    const updated = { ...value }
    if (trimmed === '') {
      delete updated[key]
      onChange(updated)
      return
    }
    const next = Number(trimmed)
    if (!Number.isFinite(next)) return
    updated[key] = next
    onChange(updated)
  }

  const groups = groupDerivedStatKeys()

  return (
    <fieldset className="admin-fieldset">
      <legend>{legend}</legend>
      <p className="field-hint">{hint}</p>
      <div className="derived-stat-table-wrap">
        <table className="admin-table derived-stat-table derived-stat-modifier-table">
          <thead>
            <tr>
              <th>Stat</th>
              <th>Bonus</th>
            </tr>
          </thead>
          {groups.map(({ group, keys }) => (
            <tbody key={group}>
              <tr className="derived-stat-group-row">
                <th colSpan={2}>{DERIVED_STAT_GROUP_LABELS[group]}</th>
              </tr>
              {keys.map((key) => (
                <tr key={key}>
                  <td>
                    <span className="derived-stat-label">{DERIVED_STAT_LABELS[key]}</span>
                    <span className="field-hint derived-stat-hint">{DERIVED_STAT_HINTS[key]}</span>
                  </td>
                  <td>
                    <input
                      type="number"
                      className="admin-stat-range-input derived-stat-input"
                      value={value[key] ?? ''}
                      placeholder="0"
                      onChange={(event) => setModifier(key, event.target.value)}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          ))}
        </table>
      </div>
    </fieldset>
  )
}
