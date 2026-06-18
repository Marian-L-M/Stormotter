import { useMemo } from 'react'
import { mergeDeOttererIcons } from '../../admin/deOttererIconTypes'
import { DeOttererIconSvg } from '../de-otterer/DeOttererIconSvg'
import { useDeOttererIconsStore } from '../../store/deOttererIconsStore'

interface AnimationIconPickerProps {
  value: string | null
  onChange: (iconId: string | null) => void
  label?: string
}

export function AnimationIconPicker({ value, onChange, label = 'Icon' }: AnimationIconPickerProps) {
  const customIcons = useDeOttererIconsStore((state) => state.customIcons)
  const icons = useMemo(() => mergeDeOttererIcons(customIcons), [customIcons])
  const selectedIcon = value ? icons.find((icon) => icon.id === value) : null

  return (
    <div className="animation-icon-picker">
      <span className="animation-icon-picker-label">{label}</span>
      <div className="animation-icon-picker-grid">
        {icons.map((icon) => (
          <button
            key={icon.id}
            type="button"
            className={`animation-icon-picker-button${value === icon.id ? ' is-active' : ''}`}
            title={icon.label}
            onClick={() => onChange(icon.id)}
          >
            <DeOttererIconSvg icon={icon} size={22} />
          </button>
        ))}
      </div>
      {selectedIcon ? (
        <button type="button" className="admin-text-button" onClick={() => onChange(null)}>
          Clear icon
        </button>
      ) : null}
    </div>
  )
}
