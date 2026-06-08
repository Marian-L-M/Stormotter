import { useEffect, useRef } from 'react'
import { getProjectContent } from '../lib/projectContent'
import { hasProjectContentChanges } from '../lib/projectChanges'
import { useCharacterMetaStore } from '../store/characterMetaStore'
import { useContentCatalogStore } from '../store/contentCatalogStore'
import { useEditorStore } from '../store/editorStore'
import { useMediaLibraryStore } from '../store/mediaLibraryStore'
import { useAudioProfilesStore } from '../store/audioProfilesStore'
import { useCharacterClassesStore } from '../store/characterClassesStore'
import { useLineageTypesStore } from '../store/lineageTypesStore'
import { useStateVariablesStore } from '../store/stateVariablesStore'
import { useTaxonomyStore } from '../store/taxonomyStore'

const AUTOSAVE_MS = 800

function buildPersistState() {
  const editor = useEditorStore.getState()
  return {
    gameId: editor.gameId,
    title: editor.title,
    mapId: editor.mapId,
    mapBackdropMediaId: editor.mapBackdropMediaId,
    mediaMaxFileBytes: editor.mediaMaxFileBytes,
    mediaProjectSoftBudgetBytes: editor.mediaProjectSoftBudgetBytes,
    world: editor.world,
    content: getProjectContent(),
  }
}

/** Boot local project storage and debounce autosaves to IndexedDB. */
export function useProjectPersistence() {
  const boot = useEditorStore((state) => state.initializeProjects)
  const persistStatus = useEditorStore((state) => state.persistStatus)
  const markDirty = useEditorStore((state) => state.markDirty)
  const persistCurrentProject = useEditorStore((state) => state.persistCurrentProject)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    void boot()
  }, [boot])

  useEffect(() => {
    if (persistStatus !== 'ready' && persistStatus !== 'error') return

    const scheduleSave = () => {
      if (timerRef.current) clearTimeout(timerRef.current)
      timerRef.current = setTimeout(() => {
        void persistCurrentProject()
      }, AUTOSAVE_MS)
    }

    const handleChange = () => {
      const state = useEditorStore.getState()
      if (state.hydrating) return
      if (state.persistStatus === 'booting' || state.persistStatus === 'saving') return
      markDirty()
      if (state.autosaveEnabled) {
        scheduleSave()
      }
    }

    let previous = buildPersistState()

    const unsubscribeEditor = useEditorStore.subscribe((state, prev) => {
      if (state.hydrating) return
      if (state.persistStatus === 'booting' || state.persistStatus === 'saving') return
      if (state.projectId !== prev.projectId) {
        previous = buildPersistState()
        return
      }

      const current = buildPersistState()
      if (!hasProjectContentChanges(current, previous)) return
      previous = current
      handleChange()
    })

    const unsubscribeCatalog = useContentCatalogStore.subscribe(() => {
      const state = useEditorStore.getState()
      if (state.hydrating) return
      const current = buildPersistState()
      if (hasProjectContentChanges(current, previous)) {
        previous = current
        handleChange()
      }
    })

    const unsubscribeState = useStateVariablesStore.subscribe(() => {
      const state = useEditorStore.getState()
      if (state.hydrating) return
      const current = buildPersistState()
      if (hasProjectContentChanges(current, previous)) {
        previous = current
        handleChange()
      }
    })

    const unsubscribeLineageTypes = useLineageTypesStore.subscribe(() => {
      const state = useEditorStore.getState()
      if (state.hydrating) return
      const current = buildPersistState()
      if (hasProjectContentChanges(current, previous)) {
        previous = current
        handleChange()
      }
    })

    const unsubscribeCharacterClasses = useCharacterClassesStore.subscribe(() => {
      const state = useEditorStore.getState()
      if (state.hydrating) return
      const current = buildPersistState()
      if (hasProjectContentChanges(current, previous)) {
        previous = current
        handleChange()
      }
    })

    const unsubscribeMeta = useCharacterMetaStore.subscribe(() => {
      const state = useEditorStore.getState()
      if (state.hydrating) return
      const current = buildPersistState()
      if (hasProjectContentChanges(current, previous)) {
        previous = current
        handleChange()
      }
    })

    const unsubscribeTaxonomy = useTaxonomyStore.subscribe(() => {
      const state = useEditorStore.getState()
      if (state.hydrating) return
      const current = buildPersistState()
      if (hasProjectContentChanges(current, previous)) {
        previous = current
        handleChange()
      }
    })

    const unsubscribeMedia = useMediaLibraryStore.subscribe(() => {
      const state = useEditorStore.getState()
      if (state.hydrating) return
      const current = buildPersistState()
      if (hasProjectContentChanges(current, previous)) {
        previous = current
        handleChange()
      }
    })

    const unsubscribeAudioProfiles = useAudioProfilesStore.subscribe(() => {
      const state = useEditorStore.getState()
      if (state.hydrating) return
      const current = buildPersistState()
      if (hasProjectContentChanges(current, previous)) {
        previous = current
        handleChange()
      }
    })

    return () => {
      unsubscribeEditor()
      unsubscribeCatalog()
      unsubscribeState()
      unsubscribeLineageTypes()
      unsubscribeCharacterClasses()
      unsubscribeMedia()
      unsubscribeAudioProfiles()
      unsubscribeMeta()
      unsubscribeTaxonomy()
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [persistStatus, persistCurrentProject, markDirty])

  useEffect(() => {
    const flushOnUnload = () => {
      const state = useEditorStore.getState()
      if (!state.isDirty) return
      if (state.persistStatus !== 'ready' && state.persistStatus !== 'error') return
      void state.persistCurrentProject()
    }

    window.addEventListener('beforeunload', flushOnUnload)
    return () => window.removeEventListener('beforeunload', flushOnUnload)
  }, [])
}
