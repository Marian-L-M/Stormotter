import { EntityAssignableAbilityPoolFields } from './EntityAssignableAbilityPoolFields'
import { EntityCastSlotGrantFields } from './EntityCastSlotGrantFields'
import type { LevelAssignableAbilityEntry, LevelCastSlotGrant } from '../../admin/abilityCastSlotTypes'

interface EntityCastSlotsEditorPanelProps {
  entityId: string
  entityKind: 'class' | 'type'
  castSlotGrants: LevelCastSlotGrant[]
  assignableAbilityGrants: LevelAssignableAbilityEntry[]
  onCastSlotGrantsChange: (value: LevelCastSlotGrant[]) => void
  onAssignableAbilityGrantsChange: (value: LevelAssignableAbilityEntry[]) => void
}

export function EntityCastSlotsEditorPanel({
  entityId,
  entityKind,
  castSlotGrants,
  assignableAbilityGrants,
  onCastSlotGrantsChange,
  onAssignableAbilityGrantsChange,
}: EntityCastSlotsEditorPanelProps) {
  return (
    <>
      <p className="admin-editor-lead">
        Configure BG2-style cast slots and which abilities players can prepare in assignable slots.
        Character slots refresh on rest; slot charges are consumed on cast or when swapping a filled
        slot.
      </p>
      <EntityCastSlotGrantFields
        entityId={entityId}
        entityKind={entityKind}
        value={castSlotGrants}
        onChange={onCastSlotGrantsChange}
      />
      <EntityAssignableAbilityPoolFields
        value={assignableAbilityGrants}
        onChange={onAssignableAbilityGrantsChange}
      />
    </>
  )
}
