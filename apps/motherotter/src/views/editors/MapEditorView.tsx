import { useState } from 'react'
import { AdminSectionNav } from '../../components/admin/AdminSectionNav'
import { MapGridPanel } from '../../components/map/MapGridPanel'
import { MapMetaPanel } from '../../components/map/MapMetaPanel'
import { useEditorStore } from '../../store/editorStore'

const MAP_EDITOR_TABS = [
  { id: 'meta', label: 'Details' },
  { id: 'grid', label: 'Grid' },
] as const

type MapEditorTab = (typeof MAP_EDITOR_TABS)[number]['id']

export function MapEditorView() {
  const [activeTab, setActiveTab] = useState<MapEditorTab>('grid')
  const mapTitle = useEditorStore(
    (state) => state.maps.find((map) => map.id === state.mapId)?.title ?? 'Untitled map',
  )
  const mapId = useEditorStore((state) => state.mapId)
  const closeEntityEditor = useEditorStore((state) => state.closeEntityEditor)
  const openMapPreview = useEditorStore((state) => state.openMapPreview)

  return (
    <div className="map-editor-fullpage">
      <header className="map-editor-header">
        <button type="button" className="map-editor-back-button" onClick={closeEntityEditor}>
          ← Maps
        </button>
        <div className="map-editor-header-title">
          <h1>{mapTitle}</h1>
          <p className="field-hint">{mapId}</p>
        </div>
        <AdminSectionNav
          sections={[...MAP_EDITOR_TABS]}
          active={activeTab}
          onChange={setActiveTab}
        />
        <button type="button" className="admin-primary-button map-editor-preview-button" onClick={openMapPreview}>
          Run preview
        </button>
      </header>

      <div className="map-editor-body">
        {activeTab === 'meta' ? <MapMetaPanel /> : <MapGridPanel />}
      </div>
    </div>
  )
}
