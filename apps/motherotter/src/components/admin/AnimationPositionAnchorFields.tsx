import {
  POSITION_ANCHOR_LABELS,
  type PositionAnchor,
  type PositionAnchorKind,
} from '../../admin/animationTypes'

interface AnimationPositionAnchorFieldsProps {
  label: string
  value: PositionAnchor
  onChange: (patch: Partial<PositionAnchor>) => void
}

const ANCHOR_KINDS = Object.keys(POSITION_ANCHOR_LABELS) as PositionAnchorKind[]

export function AnimationPositionAnchorFields({
  label,
  value,
  onChange,
}: AnimationPositionAnchorFieldsProps) {
  return (
    <fieldset className="animation-anchor-fields">
      <legend>{label}</legend>
      <label className="field">
        <span>Anchor</span>
        <select
          value={value.kind}
          onChange={(event) =>
            onChange({ kind: event.target.value as PositionAnchorKind, fixedX: null, fixedY: null })
          }
        >
          {ANCHOR_KINDS.map((kind) => (
            <option key={kind} value={kind}>
              {POSITION_ANCHOR_LABELS[kind]}
            </option>
          ))}
        </select>
      </label>

      {value.kind === 'fixed' ? (
        <div className="animation-anchor-fixed-grid">
          <label className="field">
            <span>Tile X</span>
            <input
              type="number"
              min={0}
              max={11}
              value={value.fixedX ?? 0}
              onChange={(event) => onChange({ fixedX: Number(event.target.value) })}
            />
          </label>
          <label className="field">
            <span>Tile Y</span>
            <input
              type="number"
              min={0}
              max={11}
              value={value.fixedY ?? 0}
              onChange={(event) => onChange({ fixedY: Number(event.target.value) })}
            />
          </label>
        </div>
      ) : (
        <div className="animation-anchor-offset-grid">
          <label className="field">
            <span>Offset X</span>
            <input
              type="number"
              value={value.offsetX}
              onChange={(event) => onChange({ offsetX: Number(event.target.value) })}
            />
          </label>
          <label className="field">
            <span>Offset Y</span>
            <input
              type="number"
              value={value.offsetY}
              onChange={(event) => onChange({ offsetY: Number(event.target.value) })}
            />
          </label>
        </div>
      )}
    </fieldset>
  )
}
