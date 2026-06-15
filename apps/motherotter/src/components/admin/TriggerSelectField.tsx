import { useMemo } from 'react'
import {
  ITEM_TRIGGER_GROUP_LABELS,
  itemTriggersByGroup,
  type ItemTriggerId,
} from '../../admin/itemTypes'

interface TriggerSelectFieldProps {
  value: ItemTriggerId | null
  onChange: (triggerId: ItemTriggerId | null) => void
  label?: string
  allowEmpty?: boolean
  emptyLabel?: string
}

export function TriggerSelectField({
  value,
  onChange,
  label = 'Trigger',
  allowEmpty = true,
  emptyLabel = 'Select trigger…',
}: TriggerSelectFieldProps) {
  const triggerGroups = useMemo(() => itemTriggersByGroup(), [])

  return (
    <label className="field">
      <span>{label}</span>
      <select
        value={value ?? ''}
        onChange={(event) => {
          const next = event.target.value
          onChange(next ? (next as ItemTriggerId) : null)
        }}
      >
        {allowEmpty ? <option value="">{emptyLabel}</option> : null}
        {Object.entries(triggerGroups).map(([groupId, triggers]) => (
          <optgroup
            key={groupId}
            label={ITEM_TRIGGER_GROUP_LABELS[groupId as keyof typeof ITEM_TRIGGER_GROUP_LABELS]}
          >
            {triggers.map((trigger) => (
              <option key={trigger.id} value={trigger.id}>
                {trigger.label}
              </option>
            ))}
          </optgroup>
        ))}
      </select>
    </label>
  )
}
