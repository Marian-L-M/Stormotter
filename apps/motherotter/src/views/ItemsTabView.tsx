import {
  ITEM_CLASSES,
  ITEM_SECTION_TABS,
  isItemCategoryId,
  type ItemSectionTab,
} from '../admin/itemTypes'
import { AdminSectionNav } from '../components/admin/AdminSectionNav'
import { ItemEditorView } from './editors/ItemEditorView'
import { ItemCategoryDetailView, ItemClassDetailView } from './editors/ItemRegistryDetailViews'
import { ItemCategoriesListView, ItemClassesListView, ItemsListView } from './lists/ItemsListView'
import { useItemsStore } from '../store/itemsStore'
import { useEditorStore } from '../store/editorStore'

export function ItemsTabView() {
  const editorScreen = useEditorStore((state) => state.editorScreen)
  const selectedEntityId = useEditorStore((state) => state.selectedEntityId)
  const itemSectionTab = useEditorStore((state) => state.itemSectionTab)
  const setItemSectionTab = useEditorStore((state) => state.setItemSectionTab)
  const closeEntityEditor = useEditorStore((state) => state.closeEntityEditor)
  const itemExists = useItemsStore((state) =>
    selectedEntityId ? state.items.some((entry) => entry.id === selectedEntityId) : false,
  )

  if (editorScreen === 'edit' && selectedEntityId) {
    if (itemExists) {
      return <ItemEditorView />
    }
    if (isItemCategoryId(selectedEntityId)) {
      return <ItemCategoryDetailView />
    }
    if (ITEM_CLASSES.some((entry) => entry.id === selectedEntityId)) {
      return <ItemClassDetailView />
    }
  }

  function handleSectionChange(section: ItemSectionTab) {
    if (section !== itemSectionTab) {
      closeEntityEditor()
      setItemSectionTab(section)
    }
  }

  return (
    <div className="items-tab">
      <AdminSectionNav
        sections={ITEM_SECTION_TABS}
        active={itemSectionTab}
        onChange={handleSectionChange}
      />
      {itemSectionTab === 'items' ? <ItemsListView /> : null}
      {itemSectionTab === 'item-categories' ? <ItemCategoriesListView /> : null}
      {itemSectionTab === 'item-classes' ? <ItemClassesListView /> : null}
    </div>
  )
}
