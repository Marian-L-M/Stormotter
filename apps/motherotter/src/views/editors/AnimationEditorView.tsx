import { useMemo, useState } from 'react'
import {
  ANIMATION_MOTION_LABELS,
  createEmptyAnimationStep,
  normalizeAnimationStep,
  type AnimationStep,
} from '../../admin/animationTypes'
import { AdminEditorShell } from '../../components/admin/AdminEditorShell'
import { AnimationPreviewPanel } from '../../components/admin/AnimationPreviewPanel'
import { AnimationStepModal, createStepModalDraft } from '../../components/admin/AnimationStepModal'
import { useAnimationsStore } from '../../store/animationsStore'
import { useEditorStore } from '../../store/editorStore'

export function AnimationEditorView() {
  const selectedEntityId = useEditorStore((state) => state.selectedEntityId)
  const closeEntityEditor = useEditorStore((state) => state.closeEntityEditor)
  const definition = useAnimationsStore((state) =>
    selectedEntityId ? state.definitions.find((entry) => entry.id === selectedEntityId) : undefined,
  )
  const updateDefinition = useAnimationsStore((state) => state.updateDefinition)
  const removeDefinition = useAnimationsStore((state) => state.removeDefinition)
  const moveStep = useAnimationsStore((state) => state.moveStep)
  const removeStep = useAnimationsStore((state) => state.removeStep)
  const duplicateStep = useAnimationsStore((state) => state.duplicateStep)
  const updateStep = useAnimationsStore((state) => state.updateStep)

  const [stepModalOpen, setStepModalOpen] = useState(false)
  const [editingStepId, setEditingStepId] = useState<string | null>(null)
  const [draftStep, setDraftStep] = useState<AnimationStep | null>(null)

  const editingStep = useMemo(() => {
    if (!definition || !editingStepId) return null
    return definition.steps.find((step) => step.id === editingStepId) ?? null
  }, [definition, editingStepId])

  if (!selectedEntityId || !definition) {
    return (
      <section className="editor-view">
        <p className="admin-empty">Animation not found.</p>
        <button type="button" onClick={closeEntityEditor}>
          Back to list
        </button>
      </section>
    )
  }

  const animation = definition

  function handleRemove() {
    removeDefinition(animation.id)
    closeEntityEditor()
  }

  function openAddStep() {
    setEditingStepId(null)
    setDraftStep(createStepModalDraft(animation.steps.length + 1))
    setStepModalOpen(true)
  }

  function openEditStep(stepId: string) {
    const step = animation.steps.find((entry) => entry.id === stepId)
    if (!step) return
    setEditingStepId(stepId)
    setDraftStep(normalizeAnimationStep(step))
    setStepModalOpen(true)
  }

  function handleSaveStep(step: AnimationStep) {
    if (editingStepId) {
      updateStep(animation.id, editingStepId, step)
    } else {
      const nextStep = normalizeAnimationStep({
        ...createEmptyAnimationStep(animation.steps.length + 1),
        ...step,
      })
      updateDefinition(animation.id, {
        steps: [...animation.steps, nextStep],
      })
    }
    setStepModalOpen(false)
    setEditingStepId(null)
    setDraftStep(null)
  }

  return (
    <AdminEditorShell listLabel="Animations" itemTitle={animation.name} onBack={closeEntityEditor}>
      <div className="animation-editor-layout">
        <div className="animation-editor-main">
          <p className="admin-editor-lead">
            Build a reusable animation sequence. Steps run in order; choose &ldquo;With previous
            step&rdquo; to overlap timing. Attach bindings on abilities, items, map events, and
            storyline hooks — same order plays in parallel.
          </p>

          <label className="field">
            <span>Name</span>
            <input
              value={animation.name}
              onChange={(event) => updateDefinition(animation.id, { name: event.target.value })}
            />
          </label>

          <section className="animation-sequence-panel">
            <header className="animation-sequence-header">
              <h3>Sequence</h3>
              <button type="button" className="admin-primary-button" onClick={openAddStep}>
                Add step
              </button>
            </header>

            {animation.steps.length === 0 ? (
              <p className="admin-empty">No steps yet. Add a step to begin.</p>
            ) : (
              <ol className="animation-sequence-list">
                {animation.steps.map((step, index) => (
                  <li key={step.id} className="animation-sequence-item">
                    <button type="button" className="animation-sequence-item-body" onClick={() => openEditStep(step.id)}>
                      <span className="animation-sequence-item-index">{index + 1}</span>
                      <span className="animation-sequence-item-title">{step.label}</span>
                      <span className="animation-sequence-item-meta">
                        {ANIMATION_MOTION_LABELS[step.motion]} · {step.durationMs} ms
                      </span>
                    </button>
                    <div className="animation-sequence-item-actions">
                      <button
                        type="button"
                        className="admin-icon-button"
                        aria-label="Move step up"
                        disabled={index === 0}
                        onClick={() => moveStep(animation.id, step.id, 'up')}
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        className="admin-icon-button"
                        aria-label="Move step down"
                        disabled={index === animation.steps.length - 1}
                        onClick={() => moveStep(animation.id, step.id, 'down')}
                      >
                        ↓
                      </button>
                      <button
                        type="button"
                        className="admin-icon-button"
                        aria-label="Duplicate step"
                        title="Duplicate step"
                        onClick={() => duplicateStep(animation.id, step.id)}
                      >
                        ⧉
                      </button>
                      <button
                        type="button"
                        className="admin-icon-button admin-danger-icon-button"
                        aria-label="Delete step"
                        onClick={() => removeStep(animation.id, step.id)}
                      >
                        ×
                      </button>
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </section>

          <div className="admin-editor-actions">
            <button type="button" className="admin-danger-button" onClick={handleRemove}>
              Delete animation
            </button>
          </div>
        </div>

        <AnimationPreviewPanel definition={animation} />
      </div>

      <AnimationStepModal
        open={stepModalOpen}
        step={draftStep ?? editingStep}
        onClose={() => {
          setStepModalOpen(false)
          setEditingStepId(null)
          setDraftStep(null)
        }}
        onSave={handleSaveStep}
      />
    </AdminEditorShell>
  )
}
