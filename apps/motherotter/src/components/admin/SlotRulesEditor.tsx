import { PLACEMENT_SLOT_TYPES, type SlotRuleValue, type SlotRulesMap } from '../../admin/slotRules'

interface SlotRulesEditorProps {
  value: SlotRulesMap
  onChange: (value: SlotRulesMap) => void
  inheritLabel?: string
}

export function SlotRulesEditor({
  value,
  onChange,
  inheritLabel = 'Inherit (use parent rule)',
}: SlotRulesEditorProps) {
  function setRule(slotType: string, next: SlotRuleValue) {
    const updated = { ...value, [slotType]: next }
    if (next === null) delete updated[slotType]
    onChange(updated)
  }

  return (
    <fieldset className="admin-fieldset">
      <legend>Slot availability</legend>
      <p className="field-hint">
        Disable slots this entity cannot use. Character overrides character type, which overrides
        character class.
      </p>
      <div className="slot-rules-table-wrap">
        <table className="admin-table slot-rules-table">
          <thead>
            <tr>
              <th>Slot type</th>
              <th>Enabled</th>
              <th>Disabled</th>
              <th>{inheritLabel}</th>
            </tr>
          </thead>
          <tbody>
            {PLACEMENT_SLOT_TYPES.map((slotType) => {
              const current = value[slotType.id] ?? null
              return (
                <tr key={slotType.id}>
                  <td>{slotType.label}</td>
                  <td>
                    <input
                      type="radio"
                      name={`slot-rule-${slotType.id}`}
                      checked={current === true}
                      onChange={() => setRule(slotType.id, true)}
                    />
                  </td>
                  <td>
                    <input
                      type="radio"
                      name={`slot-rule-${slotType.id}`}
                      checked={current === false}
                      onChange={() => setRule(slotType.id, false)}
                    />
                  </td>
                  <td>
                    <input
                      type="radio"
                      name={`slot-rule-${slotType.id}`}
                      checked={current === null}
                      onChange={() => setRule(slotType.id, null)}
                    />
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </fieldset>
  )
}

interface HiddenInventoryToggleProps {
  value: boolean | null
  onChange: (value: boolean | null) => void
}

export function HiddenInventoryToggleField({ value, onChange }: HiddenInventoryToggleProps) {
  return (
    <fieldset className="admin-fieldset">
      <legend>Hidden inventory behavior</legend>
      <label className="field">
        <span>Activate unequipped items from hidden inventory</span>
        <select
          className="admin-select admin-select-block"
          value={value === null ? 'inherit' : value ? 'yes' : 'no'}
          onChange={(event) => {
            const next = event.target.value
            onChange(next === 'inherit' ? null : next === 'yes')
          }}
        >
          <option value="inherit">Inherit from parent rules</option>
          <option value="yes">Yes — hidden items can be active without equipping</option>
          <option value="no">No — hidden items must be equipped to activate</option>
        </select>
      </label>
    </fieldset>
  )
}
