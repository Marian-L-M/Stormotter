import { useEffect } from 'react'
import { MapCanvas } from '../MapCanvas'
import { MapEditorSidebar } from './MapEditorSidebar'
import { MapEditorToolStrip } from './MapEditorToolStrip'
import { useEditorStore } from '../../store/editorStore'

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  const tag = target.tagName
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || target.isContentEditable
}

export function MapGridPanel() {
  const clearMapSelection = useEditorStore((state) => state.clearMapSelection)
  const removeSelectedMapCell = useEditorStore((state) => state.removeSelectedMapCell)

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (isTypingTarget(event.target)) return

      const state = useEditorStore.getState()

      if (event.key === 'Delete' || event.key === 'Backspace') {
        if (state.mapToolKind !== 'select' || !state.selectedMapCellKey) return
        event.preventDefault()
        removeSelectedMapCell()
        return
      }

      if (event.key !== 'Escape' && event.key !== 'Enter') return

      if (state.mapToolKind === 'select' && state.selectedMapCellKey) {
        event.preventDefault()
        clearMapSelection()
        return
      }

      if (state.selectedTileKeys.length === 0) return
      event.preventDefault()
      clearMapSelection()
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [clearMapSelection, removeSelectedMapCell])

  return (
    <div className="map-editor-grid-panel">
      <div className="map-editor-canvas-column">
        <MapEditorToolStrip />
        <div className="map-editor-canvas-wrap">
          <MapCanvas />
        </div>
      </div>
      <MapEditorSidebar />
    </div>
  )
}
