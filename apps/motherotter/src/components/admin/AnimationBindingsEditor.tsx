import { useMemo } from 'react'
import {
  ANIMATION_TRIGGER_LABELS,
  createAnimationBindingId,
  normalizeAnimationBinding,
  type AnimationBinding,
  type AnimationTrigger,
} from '../../admin/animationTypes'
import { useAnimationsStore } from '../../store/animationsStore'

interface AnimationBindingsEditorProps {
  bindings: AnimationBinding[]
  onChange: (bindings: AnimationBinding[]) => void
  allowedTriggers?: AnimationTrigger[]
  hint?: string
}

const ALL_TRIGGERS = Object.keys(ANIMATION_TRIGGER_LABELS) as AnimationTrigger[]

export function AnimationBindingsEditor({
  bindings,
  onChange,
  allowedTriggers = ALL_TRIGGERS,
  hint,
}: AnimationBindingsEditorProps) {
  const definitions = useAnimationsStore((state) => state.definitions)
  const animationOptions = useMemo(
    () =>
      definitions
        .filter((entry) => entry.renderEngine === 'de-otterer')
        .map((entry) => ({ id: entry.id, name: entry.name })),
    [definitions],
  )

  function updateBinding(id: string, patch: Partial<AnimationBinding>) {
    onChange(
      bindings.map((entry) =>
        entry.id === id ? normalizeAnimationBinding({ ...entry, ...patch }) : entry,
      ),
    )
  }

  function addBinding() {
    const firstAnimation = animationOptions[0]?.id ?? ''
    onChange([
      ...bindings,
      normalizeAnimationBinding({
        id: createAnimationBindingId(),
        animationId: firstAnimation,
        trigger: allowedTriggers[0] ?? 'on_use',
        order: bindings.length > 0 ? bindings[bindings.length - 1]!.order : 0,
      }),
    ])
  }

  function removeBinding(id: string) {
    onChange(bindings.filter((entry) => entry.id !== id))
  }

  return (
    <fieldset className="admin-fieldset animation-bindings-editor">
      <legend>Animation bindings</legend>
      {hint ? <p className="field-hint admin-attribute-hint">{hint}</p> : null}
      <p className="field-hint admin-attribute-hint">
        Same order plays in parallel; higher order waits for the previous group to finish.
      </p>

      {bindings.length === 0 ? (
        <p className="admin-empty admin-empty-inline">No animation bindings yet.</p>
      ) : (
        <div className="animation-bindings-list">
          {bindings.map((binding) => (
            <div key={binding.id} className="animation-binding-row">
              <label className="field">
                <span>Trigger</span>
                <select
                  value={binding.trigger}
                  onChange={(event) =>
                    updateBinding(binding.id, { trigger: event.target.value as AnimationTrigger })
                  }
                >
                  {allowedTriggers.map((trigger) => (
                    <option key={trigger} value={trigger}>
                      {ANIMATION_TRIGGER_LABELS[trigger]}
                    </option>
                  ))}
                </select>
              </label>

              <label className="field">
                <span>Animation</span>
                <select
                  value={binding.animationId}
                  onChange={(event) =>
                    updateBinding(binding.id, { animationId: event.target.value })
                  }
                >
                  <option value="">Select animation…</option>
                  {animationOptions.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="field animation-binding-order-field">
                <span>Order</span>
                <input
                  type="number"
                  min={0}
                  max={999}
                  value={binding.order}
                  onChange={(event) =>
                    updateBinding(binding.id, { order: Number(event.target.value) })
                  }
                />
              </label>

              <button
                type="button"
                className="admin-icon-button admin-danger-icon-button"
                aria-label="Remove binding"
                onClick={() => removeBinding(binding.id)}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      <button type="button" className="admin-secondary-button" onClick={addBinding}>
        Add binding
      </button>
    </fieldset>
  )
}
