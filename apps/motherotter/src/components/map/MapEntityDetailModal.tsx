import { AdminModal } from '../admin/AdminModal'
import type { MapToolKind } from '../../editorTools'
import { CharacterEditorView } from '../../views/editors/CharacterEditorView'
import { ContainerEditorView } from '../../views/editors/ContainerEditorView'
import { ItemEditorView } from '../../views/editors/ItemEditorView'

interface MapEntityDetailModalProps {
  open: boolean
  kind: Exclude<MapToolKind, 'entrance'>
  entityId: string
  onClose: () => void
}

export function MapEntityDetailModal({ open, kind, entityId, onClose }: MapEntityDetailModalProps) {
  return (
    <AdminModal open={open} title="Entity details" onClose={onClose} size="lg">
      <div className="map-entity-detail-modal">
        {kind === 'character' ? (
          <CharacterEditorView overrideEntityId={entityId} variant="embedded" onBack={onClose} />
        ) : null}
        {kind === 'item' ? (
          <ItemEditorView overrideEntityId={entityId} variant="embedded" onBack={onClose} />
        ) : null}
        {kind === 'container' ? (
          <ContainerEditorView overrideEntityId={entityId} variant="embedded" onBack={onClose} />
        ) : null}
      </div>
    </AdminModal>
  )
}
