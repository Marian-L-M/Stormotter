import { useState } from 'react'
import {
  ATTRIBUTE_INPUT_TYPE_LABELS,
  createEmptyMechanic,
  formatMechanicComposition,
  getMechanicBlocks,
  getAttributeCategoryName,
  isActiveMechanic,
  isActiveAbilityMechanic,
  type AttributeDefinition,
  type AttributeDefinitionPatch,
  type MechanicBuilderApplyResult,
} from '../../admin/attributeTypes'
import { MechanicBuilderModal } from './MechanicBuilderModal'
import { useAttributesStore } from '../../store/attributesStore'

interface MechanicDefinitionShape {
  id: string
  name: string
  inputType: AttributeDefinition['inputType']
  categoryId: string | null
  mechanic: AttributeDefinition['mechanic']
  updatedAt: string
}

interface MechanicCompositionFieldsProps {
  definition: MechanicDefinitionShape
  onChange: (patch: AttributeDefinitionPatch) => void
  categories?: Array<{ id: string; name: string }>
  getCategoryName?: (categoryId: string | null, categories: Array<{ id: string; name: string }>) => string
  entityLabel?: string
  builderMode?: 'attribute' | 'ability'
}

export function MechanicCompositionFields({
  definition,
  onChange,
  categories: categoriesProp,
  getCategoryName,
  entityLabel = 'attribute',
  builderMode = 'attribute',
}: MechanicCompositionFieldsProps) {
  const [modalOpen, setModalOpen] = useState(false)
  const attributeCategories = useAttributesStore((state) => state.categories)
  const categories = categoriesProp ?? attributeCategories
  const categoryName = getCategoryName
    ? getCategoryName(definition.categoryId, categories)
    : getAttributeCategoryName(definition.categoryId, categories)
  const mechanic = definition.mechanic ?? createEmptyMechanic()
  const preview = formatMechanicComposition(mechanic)
  const blocks = getMechanicBlocks(mechanic)
  const hasMechanic = builderMode === 'ability'
    ? isActiveAbilityMechanic(mechanic)
    : isActiveMechanic(mechanic)

  function applyBuilderResult(result: MechanicBuilderApplyResult | null) {
    if (!result) {
      onChange({ mechanic: null })
      return
    }

    onChange({
      mechanic: result.mechanic,
      inputType: result.inputType,
    })
  }

  return (
    <>
      <fieldset className="admin-fieldset">
        <legend>Mechanic</legend>
        <p className="field-hint admin-attribute-hint">
          Build the {entityLabel} in the block composer. Category, input type, and engine key are
          derived from the composed blocks.
        </p>

        {hasMechanic ? (
          <div className="mechanic-builder-summary-card">
            <div className="mechanic-builder-block-row">
              {blocks.map((block, index) => (
                <span key={`${block.id}-${index}`} className="mechanic-builder-block-chain">
                  {index > 0 ? <span className="mechanic-builder-block-sep">+</span> : null}
                  <span className={`mechanic-builder-block mechanic-builder-block-${block.kind}`}>
                    {block.label}
                  </span>
                </span>
              ))}
            </div>
            <dl className="mechanic-builder-inline-meta">
              <div>
                <dt>Preview</dt>
                <dd>{preview}</dd>
              </div>
              <div>
                <dt>Category</dt>
                <dd>{categoryName}</dd>
              </div>
              <div>
                <dt>Input type</dt>
                <dd>{ATTRIBUTE_INPUT_TYPE_LABELS[definition.inputType]}</dd>
              </div>
            </dl>
          </div>
        ) : (
          <p className="admin-empty admin-empty-inline">No mechanic configured yet.</p>
        )}

        <div className="mechanic-builder-actions">
          <button type="button" className="admin-primary-button" onClick={() => setModalOpen(true)}>
            {hasMechanic ? 'Edit blocks…' : 'Build mechanic…'}
          </button>
          {hasMechanic ? (
            <button type="button" className="admin-secondary-button" onClick={() => applyBuilderResult(null)}>
              Clear
            </button>
          ) : null}
        </div>
      </fieldset>

      {modalOpen ? (
        <MechanicBuilderModal
          key={`${definition.id}-${definition.updatedAt}`}
          attributeName={definition.name}
          mechanic={definition.mechanic}
          inputType={definition.inputType}
          builderMode={builderMode}
          onClose={() => setModalOpen(false)}
          onApply={applyBuilderResult}
        />
      ) : null}
    </>
  )
}
