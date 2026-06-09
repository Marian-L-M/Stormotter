import type { AttributeInputType, AttributeValue } from '../../admin/attributeTypes'
import {
  isDiceRollValue,
  normalizeAttributeValue,
} from '../../admin/attributeTypes'
import { DiceRollInput } from './DiceRollInput'

interface AttributeValueInputProps {
  inputType: AttributeInputType
  value: AttributeValue
  onChange: (value: AttributeValue) => void
  id?: string
  className?: string
}

export function AttributeValueInput({
  inputType,
  value,
  onChange,
  id,
  className = 'admin-stat-range-input',
}: AttributeValueInputProps) {
  if (inputType === 'boolean') {
    return (
      <select
        id={id}
        className={`admin-select ${className}`}
        value={value === true ? 'true' : value === false ? 'false' : ''}
        onChange={(event) => {
          const next = event.target.value
          onChange(next === '' ? null : next === 'true')
        }}
      >
        <option value="">—</option>
        <option value="true">Yes</option>
        <option value="false">No</option>
      </select>
    )
  }

  if (inputType === 'text') {
    return (
      <input
        id={id}
        type="text"
        className={className}
        value={typeof value === 'string' ? value : ''}
        placeholder="—"
        onChange={(event) =>
          onChange(event.target.value.trim() === '' ? null : event.target.value)
        }
      />
    )
  }

  if (inputType === 'dice') {
    const diceValue = isDiceRollValue(value) ? value : { count: 1, sides: 6 }

    return (
      <DiceRollInput
        value={diceValue}
        onChange={(next) => onChange(normalizeAttributeValue('dice', next))}
        rangeSuffix=""
      />
    )
  }

  const numericValue = typeof value === 'number' ? value : ''
  const max = inputType === 'percentile' ? 100 : undefined
  const min = inputType === 'percentile' ? 0 : undefined

  return (
    <input
      id={id}
      type="number"
      className={className}
      value={numericValue}
      min={min}
      max={max}
      step={inputType === 'percentile' ? 1 : 'any'}
      placeholder="—"
      onChange={(event) => {
        const trimmed = event.target.value.trim()
        if (trimmed === '') {
          onChange(null)
          return
        }
        onChange(normalizeAttributeValue(inputType, Number(trimmed)))
      }}
    />
  )
}
