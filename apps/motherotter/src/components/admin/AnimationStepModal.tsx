import { useEffect, useMemo, useState } from 'react'
import {
  ANIMATION_EASING_LABELS,
  ANIMATION_MOTION_LABELS,
  STEP_TIMING_LABELS,
  createDefaultIconStyle,
  createDefaultPositionAnchor,
  normalizeAnimationStep,
  type AnimationStep,
} from '../../admin/animationTypes'
import { AdminModal } from './AdminModal'
import { AnimationIconPicker } from './AnimationIconPicker'
import { AnimationPositionAnchorFields } from './AnimationPositionAnchorFields'
import { useAudioProfilesStore } from '../../store/audioProfilesStore'

interface AnimationStepModalProps {
  open: boolean
  step: AnimationStep | null
  onClose: () => void
  onSave: (step: AnimationStep) => void
}

export function AnimationStepModal({ open, step, onClose, onSave }: AnimationStepModalProps) {
  const audioProfiles = useAudioProfilesStore((state) => state.audioProfiles)
  const [draft, setDraft] = useState<AnimationStep | null>(step)

  useEffect(() => {
    if (open) {
      setDraft(step ? normalizeAnimationStep(step) : null)
    }
  }, [open, step])

  const profileOptions = useMemo(
    () => audioProfiles.map((profile) => ({ id: profile.id, name: profile.name })),
    [audioProfiles],
  )

  if (!open || !draft) return null

  function patch(partial: Partial<AnimationStep>) {
    setDraft((current) => (current ? { ...current, ...partial } : current))
  }

  function patchStartIcon(partial: Partial<AnimationStep['startIcon']>) {
    setDraft((current) =>
      current ? { ...current, startIcon: { ...current.startIcon, ...partial } } : current,
    )
  }

  function patchEndIcon(partial: Partial<AnimationStep['endIcon']>) {
    setDraft((current) =>
      current ? { ...current, endIcon: { ...current.endIcon, ...partial } } : current,
    )
  }

  return (
    <AdminModal
      open={open}
      title={step ? 'Edit step' : 'Add step'}
      onClose={onClose}
      size="lg"
      footer={
        <>
          <button type="button" className="admin-secondary-button" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className="admin-primary-button"
            onClick={() => draft && onSave(normalizeAnimationStep(draft))}
          >
            Save step
          </button>
        </>
      }
    >
      <div className="animation-step-modal">
        <label className="field">
          <span>Step label</span>
          <input value={draft.label} onChange={(event) => patch({ label: event.target.value })} />
        </label>

        <label className="field">
          <span>Timing</span>
          <select
            value={draft.timing}
            onChange={(event) =>
              patch({ timing: event.target.value as AnimationStep['timing'] })
            }
          >
            {Object.entries(STEP_TIMING_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>

        <div className="animation-step-modal-grid">
          <AnimationPositionAnchorFields
            label="Start position"
            value={draft.startAnchor}
            onChange={(anchorPatch) =>
              patch({ startAnchor: { ...draft.startAnchor, ...anchorPatch } })
            }
          />
          <AnimationPositionAnchorFields
            label="End position"
            value={draft.endAnchor}
            onChange={(anchorPatch) => patch({ endAnchor: { ...draft.endAnchor, ...anchorPatch } })}
          />
        </div>

        <div className="animation-step-modal-grid">
          <div className="animation-icon-style-panel">
            <AnimationIconPicker
              label="Start icon"
              value={draft.startIcon.iconId}
              onChange={(iconId) => patchStartIcon({ iconId })}
            />
            <label className="field">
              <span>Start scale</span>
              <input
                type="number"
                min={0.1}
                max={4}
                step={0.1}
                value={draft.startIcon.scale}
                onChange={(event) => patchStartIcon({ scale: Number(event.target.value) })}
              />
            </label>
            <label className="field">
              <span>Start opacity</span>
              <input
                type="number"
                min={0}
                max={1}
                step={0.05}
                value={draft.startIcon.opacity}
                onChange={(event) => patchStartIcon({ opacity: Number(event.target.value) })}
              />
            </label>
            <label className="field">
              <span>Start rotation (°)</span>
              <input
                type="number"
                value={draft.startIcon.rotation}
                onChange={(event) => patchStartIcon({ rotation: Number(event.target.value) })}
              />
            </label>
          </div>

          <div className="animation-icon-style-panel">
            <AnimationIconPicker
              label="End icon"
              value={draft.endIcon.iconId}
              onChange={(iconId) => patchEndIcon({ iconId })}
            />
            <label className="field">
              <span>End scale</span>
              <input
                type="number"
                min={0.1}
                max={4}
                step={0.1}
                value={draft.endIcon.scale}
                onChange={(event) => patchEndIcon({ scale: Number(event.target.value) })}
              />
            </label>
            <label className="field">
              <span>End opacity</span>
              <input
                type="number"
                min={0}
                max={1}
                step={0.05}
                value={draft.endIcon.opacity}
                onChange={(event) => patchEndIcon({ opacity: Number(event.target.value) })}
              />
            </label>
            <label className="field">
              <span>End rotation (°)</span>
              <input
                type="number"
                value={draft.endIcon.rotation}
                onChange={(event) => patchEndIcon({ rotation: Number(event.target.value) })}
              />
            </label>
          </div>
        </div>

        <label className="field">
          <span>Motion</span>
          <select
            value={draft.motion}
            onChange={(event) => patch({ motion: event.target.value as AnimationStep['motion'] })}
          >
            {Object.entries(ANIMATION_MOTION_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>

        <div className="animation-step-timing-grid">
          <label className="field">
            <span>Duration (ms)</span>
            <input
              type="number"
              min={0}
              value={draft.durationMs}
              onChange={(event) => patch({ durationMs: Number(event.target.value) })}
            />
          </label>
          <label className="field">
            <span>Delay (ms)</span>
            <input
              type="number"
              min={0}
              value={draft.delayMs}
              onChange={(event) => patch({ delayMs: Number(event.target.value) })}
            />
          </label>
          <label className="field">
            <span>Hold before (ms)</span>
            <input
              type="number"
              min={0}
              value={draft.holdBeforeMs}
              onChange={(event) => patch({ holdBeforeMs: Number(event.target.value) })}
            />
          </label>
          <label className="field">
            <span>Hold after (ms)</span>
            <input
              type="number"
              min={0}
              value={draft.holdAfterMs}
              onChange={(event) => patch({ holdAfterMs: Number(event.target.value) })}
            />
          </label>
        </div>

        <label className="field">
          <span>Easing</span>
          <select
            value={draft.easing}
            onChange={(event) => patch({ easing: event.target.value as AnimationStep['easing'] })}
          >
            {Object.entries(ANIMATION_EASING_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>

        <div className="animation-step-audio-grid">
          <label className="field">
            <span>Sound (audio profile)</span>
            <select
              value={draft.audioProfileId ?? ''}
              onChange={(event) =>
                patch({ audioProfileId: event.target.value ? event.target.value : null })
              }
            >
              <option value="">None</option>
              {profileOptions.map((profile) => (
                <option key={profile.id} value={profile.id}>
                  {profile.name}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Audio delay (ms)</span>
            <input
              type="number"
              min={0}
              value={draft.audioDelayMs}
              onChange={(event) => patch({ audioDelayMs: Number(event.target.value) })}
            />
          </label>
        </div>
      </div>
    </AdminModal>
  )
}

export function createStepModalDraft(index: number): AnimationStep {
  return normalizeAnimationStep({
    label: `Step ${index}`,
    startAnchor: createDefaultPositionAnchor('main_character'),
    endAnchor: createDefaultPositionAnchor('target'),
    startIcon: createDefaultIconStyle(),
    endIcon: createDefaultIconStyle(),
  })
}
