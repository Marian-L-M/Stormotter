import { useMemo } from 'react'
import { ANIMATION_RENDER_ENGINES } from '../admin/animationTypes'
import { AdminSectionNav } from '../components/admin/AdminSectionNav'
import { AnimationEditorView } from './editors/AnimationEditorView'
import { AnimationsListView } from './lists/AnimationsListView'
import { useEditorStore } from '../store/editorStore'

export function AnimationsTabView() {
  const editorScreen = useEditorStore((state) => state.editorScreen)
  const selectedEntityId = useEditorStore((state) => state.selectedEntityId)
  const animationsRenderEngineTab = useEditorStore((state) => state.animationsRenderEngineTab)
  const setAnimationsRenderEngineTab = useEditorStore((state) => state.setAnimationsRenderEngineTab)
  const enabledMapRenderEngines = useEditorStore((state) => state.enabledMapRenderEngines)
  const closeEntityEditor = useEditorStore((state) => state.closeEntityEditor)

  const sections = useMemo(
    () =>
      ANIMATION_RENDER_ENGINES.filter((entry) => enabledMapRenderEngines.includes(entry.id)).map(
        (entry) => ({ id: entry.id, label: entry.label }),
      ),
    [enabledMapRenderEngines],
  )

  if (editorScreen === 'edit' && selectedEntityId) {
    return <AnimationEditorView />
  }

  function handleSectionChange(section: (typeof sections)[number]['id']) {
    if (section !== animationsRenderEngineTab) {
      closeEntityEditor()
      setAnimationsRenderEngineTab(section)
    }
  }

  if (sections.length === 0) {
    return (
      <section className="editor-view">
        <p className="admin-empty">Enable a render engine in Settings to create animations.</p>
      </section>
    )
  }

  return (
    <div className="animations-tab">
      {sections.length > 1 ? (
        <AdminSectionNav
          sections={sections}
          active={animationsRenderEngineTab}
          onChange={handleSectionChange}
        />
      ) : null}
      <AnimationsListView renderEngine={animationsRenderEngineTab} />
    </div>
  )
}
