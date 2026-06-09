import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  ATTRIBUTE_INPUT_TYPE_LABELS,
  ATTRIBUTE_TYPES,
  DAMAGE_INPUT_TYPES,
  DAMAGE_STACKING_RULE_LABELS,
  DAMAGE_STACKING_RULES,
  DEFAULT_CONDITIONS,
  DEFAULT_MAGIC_EFFECTS,
  DEFAULT_SAVE_TYPES,
  DEFAULT_STATS,
  RESISTANCE_ROLES,
  STACKING_RULE_LABELS,
  applyEffectTypeConstraints,
  createEmptyMechanic,
  defaultInputTypeForAttributeType,
  deriveCategoryNameForMechanic,
  deriveMechanicKey,
  formatMechanicComposition,
  getMechanicBlocks,
  hydrateMechanicBuilderDraft,
  isActiveMechanic,
  syncMechanicWithInputType,
  type AttributeInputType,
  type MechanicBlock,
  type MechanicBuilderApplyResult,
  type MechanicComposition,
} from '../../admin/attributeTypes'
import { DamageTypePicker } from './DamageTypePicker'

interface MechanicBuilderModalProps {
  attributeName: string
  mechanic: MechanicComposition | null
  inputType: AttributeInputType
  onClose: () => void
  onApply: (result: MechanicBuilderApplyResult | null) => void
}

type BuilderStep =
  | 'type'
  | 'damage'
  | 'role'
  | 'stat'
  | 'save'
  | 'condition'
  | 'magic'
  | 'advanced'

const DEFAULT_INPUT_TYPES: AttributeInputType[] = ['percentile', 'number', 'boolean', 'text']

function inputTypesForEffect(effectTypeId: string | null): AttributeInputType[] {
  if (effectTypeId === 'damage') return DAMAGE_INPUT_TYPES
  return DEFAULT_INPUT_TYPES
}

function stackingOptionsForEffect(
  effectTypeId: string | null,
): { value: MechanicComposition['stacking']; label: string }[] {
  if (effectTypeId === 'damage') {
    return DAMAGE_STACKING_RULES.map((value) => ({
      value,
      label: DAMAGE_STACKING_RULE_LABELS[value],
    }))
  }
  return Object.entries(STACKING_RULE_LABELS).map(([value, label]) => ({
    value: value as MechanicComposition['stacking'],
    label,
  }))
}

function getNextStep(draft: MechanicComposition): BuilderStep | null {
  if (!draft.effectTypeId) return 'type'

  switch (draft.effectTypeId) {
    case 'damage':
      if (!draft.damageTypeId) return 'damage'
      return 'advanced'
    case 'resistance':
      if (!draft.damageTypeId) return 'damage'
      if (!draft.resistanceRoleId) return 'role'
      return 'advanced'
    case 'modifier':
      if (!draft.statId) return 'stat'
      return 'advanced'
    case 'condition':
      if (!draft.conditionId) return 'condition'
      return 'advanced'
    case 'saving_throw':
      if (!draft.saveTypeId) return 'save'
      return 'advanced'
    case 'magic':
      if (!draft.customHandlerId) return 'magic'
      return 'advanced'
    default:
      return 'type'
  }
}

function initialActiveStep(draft: MechanicComposition): BuilderStep {
  if (!isActiveMechanic(draft)) return 'type'
  return getNextStep(draft) ?? 'type'
}

function stepTitle(step: BuilderStep): string {
  switch (step) {
    case 'type':
      return 'Choose attribute type'
    case 'damage':
      return 'Choose damage type'
    case 'role':
      return 'Choose resistance role'
    case 'stat':
      return 'Choose stat'
    case 'save':
      return 'Choose saving throw'
    case 'condition':
      return 'Choose condition'
    case 'magic':
      return 'Choose magic effect'
    case 'advanced':
      return 'Input type & stacking'
  }
}

function stepHint(step: BuilderStep, effectTypeId: string | null): string {
  switch (step) {
    case 'type':
      return 'Start with one of the six attribute types. Later blocks depend on this choice.'
    case 'damage':
      return 'Choose a damage group (Physical, Elemental, Magical) or a specific subtype within it.'
    case 'role':
      return 'How does the entity interact with this damage type?'
    case 'stat':
      return 'Which core stat does this modifier affect?'
    case 'save':
      return 'Which saving throw category receives the bonus?'
    case 'condition':
      return 'Which status or condition does this attribute represent?'
    case 'magic':
      return 'Select a magic school or special arcane effect.'
    case 'advanced':
      if (effectTypeId === 'damage') {
        return 'Choose how values are entered on characters and how multiple sources combine. Actual values are set when the attribute is assigned.'
      }
      return 'Choose how values are entered and how multiple sources combine.'
  }
}

function OptionGrid({
  options,
  selectedId,
  onSelect,
}: {
  options: { id: string; name: string }[]
  selectedId: string | null
  onSelect: (id: string) => void
}) {
  return (
    <div className="mechanic-builder-options" role="listbox">
      {options.map((option) => (
        <button
          key={option.id}
          type="button"
          role="option"
          aria-selected={selectedId === option.id}
          className={`mechanic-builder-option${selectedId === option.id ? ' is-selected' : ''}`}
          onClick={() => onSelect(option.id)}
        >
          {option.name}
        </button>
      ))}
    </div>
  )
}

function BlockChip({ block }: { block: MechanicBlock }) {
  return (
    <span className={`mechanic-builder-block mechanic-builder-block-${block.kind}`}>{block.label}</span>
  )
}

export function MechanicBuilderModal({
  attributeName,
  mechanic,
  inputType,
  onClose,
  onApply,
}: MechanicBuilderModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const suppressCloseRef = useRef(false)
  const initialState = hydrateMechanicBuilderDraft(mechanic, inputType)
  const [draft, setDraft] = useState<MechanicComposition>(() => initialState.draft)
  const [draftInputType, setDraftInputType] = useState<AttributeInputType>(() => initialState.inputType)
  const [activeStep, setActiveStep] = useState<BuilderStep>(() => initialActiveStep(initialState.draft))

  function handleDialogClose() {
    if (suppressCloseRef.current) return
    onClose()
  }

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    dialog.showModal()
    return () => {
      suppressCloseRef.current = true
      if (dialog.open) dialog.close()
    }
  }, [])

  const normalizedDraft = useMemo(
    () => syncMechanicWithInputType(applyEffectTypeConstraints(draft), draftInputType) ?? applyEffectTypeConstraints(draft),
    [draft, draftInputType],
  )
  const blocks = useMemo(() => getMechanicBlocks(normalizedDraft), [normalizedDraft])
  const suggestedStep = getNextStep(normalizedDraft) ?? 'type'
  const derivedKey = deriveMechanicKey(normalizedDraft, attributeName)
  const derivedCategory = deriveCategoryNameForMechanic(normalizedDraft) ?? '—'
  const preview = formatMechanicComposition(normalizedDraft)
  const canApply = isActiveMechanic(normalizedDraft)
  const inputTypes = inputTypesForEffect(normalizedDraft.effectTypeId)
  const stackingOptions = stackingOptionsForEffect(normalizedDraft.effectTypeId)

  function updateDraft(patch: Partial<MechanicComposition>) {
    setDraft((current) => applyEffectTypeConstraints({ ...current, ...patch }))
  }

  function selectType(typeId: string) {
    const next = applyEffectTypeConstraints({
      ...createEmptyMechanic(),
      effectTypeId: typeId,
    })
    setDraft(next)
    setDraftInputType(defaultInputTypeForAttributeType(typeId))
  }

  function selectValue(patch: Partial<MechanicComposition>) {
    updateDraft(patch)
  }

  function handleInputTypeChange(nextInputType: AttributeInputType) {
    setDraftInputType(nextInputType)
    setDraft((current) => {
      const synced = syncMechanicWithInputType(applyEffectTypeConstraints(current), nextInputType)
      return synced ?? current
    })
  }

  function handleApply() {
    const mechanicToApply = syncMechanicWithInputType(
      applyEffectTypeConstraints(draft),
      draftInputType,
    )
    if (!mechanicToApply || !isActiveMechanic(mechanicToApply)) return

    onApply({
      mechanic: mechanicToApply,
      inputType: draftInputType,
    })
    onClose()
  }

  function handleClear() {
    onApply(null)
    onClose()
  }

  function renderStepContent() {
    switch (activeStep) {
      case 'type':
        return (
          <OptionGrid
            options={ATTRIBUTE_TYPES}
            selectedId={normalizedDraft.effectTypeId}
            onSelect={selectType}
          />
        )
      case 'damage':
        return (
          <DamageTypePicker
            selectedId={normalizedDraft.damageTypeId}
            onSelect={(id) => selectValue({ damageTypeId: id })}
          />
        )
      case 'role':
        return (
          <OptionGrid
            options={RESISTANCE_ROLES}
            selectedId={normalizedDraft.resistanceRoleId}
            onSelect={(id) => selectValue({ resistanceRoleId: id })}
          />
        )
      case 'stat':
        return (
          <OptionGrid
            options={DEFAULT_STATS}
            selectedId={normalizedDraft.statId}
            onSelect={(id) => selectValue({ statId: id })}
          />
        )
      case 'save':
        return (
          <OptionGrid
            options={DEFAULT_SAVE_TYPES}
            selectedId={normalizedDraft.saveTypeId}
            onSelect={(id) => selectValue({ saveTypeId: id })}
          />
        )
      case 'condition':
        return (
          <OptionGrid
            options={DEFAULT_CONDITIONS}
            selectedId={normalizedDraft.conditionId}
            onSelect={(id) => selectValue({ conditionId: id })}
          />
        )
      case 'magic':
        return (
          <OptionGrid
            options={DEFAULT_MAGIC_EFFECTS}
            selectedId={normalizedDraft.customHandlerId}
            onSelect={(id) => selectValue({ customHandlerId: id })}
          />
        )
      case 'advanced':
        return (
          <div className="mechanic-builder-advanced">
            <label className="field">
              <span>Input type</span>
              <select
                className="admin-select admin-select-block"
                value={draftInputType}
                onChange={(event) => handleInputTypeChange(event.target.value as AttributeInputType)}
              >
                {inputTypes.map((type) => (
                  <option key={type} value={type}>
                    {ATTRIBUTE_INPUT_TYPE_LABELS[type]}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              <span>Stacking rule</span>
              <select
                className="admin-select admin-select-block"
                value={normalizedDraft.stacking}
                onChange={(event) =>
                  updateDraft({ stacking: event.target.value as MechanicComposition['stacking'] })
                }
              >
                {stackingOptions.map(({ value, label }) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
          </div>
        )
    }
  }

  const stepNav: BuilderStep[] = ['type']
  if (normalizedDraft.effectTypeId === 'damage' || normalizedDraft.effectTypeId === 'resistance') {
    stepNav.push('damage')
  }
  if (normalizedDraft.effectTypeId === 'resistance') {
    stepNav.push('role')
  }
  if (normalizedDraft.effectTypeId === 'modifier') stepNav.push('stat')
  if (normalizedDraft.effectTypeId === 'saving_throw') stepNav.push('save')
  if (normalizedDraft.effectTypeId === 'condition') stepNav.push('condition')
  if (normalizedDraft.effectTypeId === 'magic') stepNav.push('magic')
  if (normalizedDraft.effectTypeId) stepNav.push('advanced')

  return createPortal(
    <dialog
      ref={dialogRef}
      className="mechanic-builder-modal"
      onClose={handleDialogClose}
      onCancel={(event) => {
        event.preventDefault()
        onClose()
      }}
    >
      <div className="mechanic-builder-modal-inner">
        <header className="mechanic-builder-modal-header">
          <div>
            <h2>Build attribute mechanic</h2>
            <p className="field-hint">{attributeName}</p>
          </div>
          <button type="button" className="mechanic-builder-modal-close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </header>

        <div className="mechanic-builder-body">
          <section className="mechanic-builder-preview">
            <h3>Composed blocks</h3>
            {blocks.length === 0 ? (
              <p className="admin-empty admin-empty-inline">No blocks yet — pick an attribute type to start.</p>
            ) : (
              <div className="mechanic-builder-block-row">
                {blocks.map((block, index) => (
                  <span key={`${block.id}-${index}`} className="mechanic-builder-block-chain">
                    {index > 0 ? <span className="mechanic-builder-block-sep">+</span> : null}
                    <BlockChip block={block} />
                  </span>
                ))}
              </div>
            )}
            <dl className="mechanic-builder-summary">
              <div>
                <dt>Preview</dt>
                <dd>{preview}</dd>
              </div>
              <div>
                <dt>Category</dt>
                <dd>{derivedCategory}</dd>
              </div>
              <div>
                <dt>Input type</dt>
                <dd>{ATTRIBUTE_INPUT_TYPE_LABELS[draftInputType]}</dd>
              </div>
              <div>
                <dt>Engine key</dt>
                <dd>
                  <code>{derivedKey}</code>
                </dd>
              </div>
            </dl>
          </section>

          <section className="mechanic-builder-steps">
            {normalizedDraft.effectTypeId ? (
              <nav className="mechanic-builder-step-nav" aria-label="Builder steps">
                {stepNav.map((step) => (
                  <button
                    key={step}
                    type="button"
                    className={`mechanic-builder-step-tab${activeStep === step ? ' is-active' : ''}${suggestedStep === step ? ' is-suggested' : ''}`}
                    onClick={() => setActiveStep(step)}
                  >
                    {stepTitle(step)}
                  </button>
                ))}
              </nav>
            ) : null}

            <div className="mechanic-builder-step-panel">
              <h3>{stepTitle(activeStep)}</h3>
              <p className="field-hint admin-attribute-hint">
                {stepHint(activeStep, normalizedDraft.effectTypeId)}
              </p>
              {!canApply && normalizedDraft.effectTypeId ? (
                <p className="field-hint admin-attribute-hint mechanic-builder-apply-hint">
                  Complete the highlighted step before applying.
                </p>
              ) : null}
              {renderStepContent()}
            </div>
          </section>
        </div>

        <footer className="mechanic-builder-modal-footer">
          <button type="button" className="admin-text-button admin-danger-text" onClick={handleClear}>
            Clear mechanic
          </button>
          <div className="mechanic-builder-modal-footer-actions">
            <button type="button" className="admin-secondary-button" onClick={onClose}>
              Cancel
            </button>
            <button
              type="button"
              className="admin-primary-button"
              disabled={!canApply}
              onClick={handleApply}
            >
              Apply blocks
            </button>
          </div>
        </footer>
      </div>
    </dialog>,
    document.body,
  )
}
