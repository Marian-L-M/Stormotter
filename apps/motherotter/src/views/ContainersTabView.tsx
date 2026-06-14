import { CONTAINER_SECTION_TABS, type ContainerSectionTab } from '../admin/containerTypes'
import { isCharacterSlotDefinitionId } from '../admin/characterSlotTypes'
import { AdminSectionNav } from '../components/admin/AdminSectionNav'
import { ContainerEditorView } from './editors/ContainerEditorView'
import { CharacterInventoryEditorView } from './editors/CharacterInventoryEditorView'
import { CharacterSlotDefinitionDetailView } from './editors/CharacterSlotDefinitionDetailView'
import { ContainersListView } from './lists/ContainersListView'
import { CharacterInventoriesListView } from './lists/CharacterInventoriesListView'
import { CharacterSlotDefinitionsListView } from './lists/CharacterSlotDefinitionsListView'
import { useContainersStore } from '../store/containersStore'
import { useContentCatalogStore } from '../store/contentCatalogStore'
import { useEditorStore } from '../store/editorStore'

export function ContainersTabView() {
  const editorScreen = useEditorStore((state) => state.editorScreen)
  const selectedEntityId = useEditorStore((state) => state.selectedEntityId)
  const containerSectionTab = useEditorStore((state) => state.containerSectionTab)
  const setContainerSectionTab = useEditorStore((state) => state.setContainerSectionTab)
  const closeEntityEditor = useEditorStore((state) => state.closeEntityEditor)
  const containerExists = useContainersStore((state) =>
    selectedEntityId ? state.containers.some((entry) => entry.id === selectedEntityId) : false,
  )
  const characterExists = useContentCatalogStore((state) =>
    selectedEntityId
      ? state.stubs.characters.some((entry) => entry.id === selectedEntityId)
      : false,
  )

  if (editorScreen === 'edit' && selectedEntityId) {
    if (containerSectionTab === 'character_inventories' && characterExists && !containerExists) {
      return <CharacterInventoryEditorView />
    }

    if (
      containerSectionTab === 'character_slot_definitions' &&
      isCharacterSlotDefinitionId(selectedEntityId)
    ) {
      return <CharacterSlotDefinitionDetailView />
    }

    if (containerExists) {
      return <ContainerEditorView />
    }
  }

  function handleSectionChange(section: ContainerSectionTab) {
    if (section !== containerSectionTab) {
      closeEntityEditor()
      setContainerSectionTab(section)
    }
  }

  return (
    <div className="containers-tab">
      <AdminSectionNav
        sections={CONTAINER_SECTION_TABS}
        active={containerSectionTab}
        onChange={handleSectionChange}
      />
      {containerSectionTab === 'character_inventories' ? (
        <CharacterInventoriesListView />
      ) : containerSectionTab === 'character_slot_definitions' ? (
        <CharacterSlotDefinitionsListView />
      ) : (
        <ContainersListView kind={containerSectionTab} />
      )}
    </div>
  )
}
