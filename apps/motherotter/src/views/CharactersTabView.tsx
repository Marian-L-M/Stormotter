import {
  CHARACTER_CATEGORY_LABELS,
  CHARACTER_CATEGORY_ORDER,
  type CharacterCategory,
} from '../admin/characterTypes'
import { AdminSectionNav } from '../components/admin/AdminSectionNav'
import { CharacterEditorView } from './editors/CharacterEditorView'
import { CharactersListView } from './lists/CharactersListView'
import { useEditorStore } from '../store/editorStore'

const SECTIONS = CHARACTER_CATEGORY_ORDER.map((id) => ({
  id,
  label: CHARACTER_CATEGORY_LABELS[id],
}))

export function CharactersTabView() {
  const editorScreen = useEditorStore((state) => state.editorScreen)
  const selectedEntityId = useEditorStore((state) => state.selectedEntityId)
  const characterTypeTab = useEditorStore((state) => state.characterTypeTab)
  const setCharacterTypeTab = useEditorStore((state) => state.setCharacterTypeTab)
  const closeEntityEditor = useEditorStore((state) => state.closeEntityEditor)

  if (editorScreen === 'edit' && selectedEntityId) {
    return <CharacterEditorView />
  }

  function handleSectionChange(section: CharacterCategory) {
    if (section !== characterTypeTab) {
      closeEntityEditor()
      setCharacterTypeTab(section)
    }
  }

  return (
    <div className="characters-tab">
      <AdminSectionNav
        sections={SECTIONS}
        active={characterTypeTab}
        onChange={handleSectionChange}
      />
      <CharactersListView characterType={characterTypeTab} />
    </div>
  )
}
