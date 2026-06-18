import type { EditorMode } from '../editorModes'
import type { SettingsSectionId, StubContentType } from '../admin/types'
import { isEditorMode } from '../editorModes'
import { SettingsSectionEditorView } from './editors/SettingsSectionEditorView'
import { StateVariableEditorView } from './editors/StateVariableEditorView'
import { StubContentEditorView } from './editors/StubContentEditorView'
import { CharactersTabView } from './CharactersTabView'
import { ContentTabListView } from './lists/ContentTabListView'
import { FilesView } from './FilesView'
import { MapsListView } from './lists/MapsListView'
import { DeOttererIconLibraryView } from './DeOttererIconLibraryView'
import { MediaLibraryTabView } from './MediaLibraryTabView'
import { AttributesTabView } from './AttributesTabView'
import { AbilitiesTabView } from './AbilitiesTabView'
import { AnimationsTabView } from './AnimationsTabView'
import { AudioProfilesTabView } from './AudioProfilesTabView'
import { ItemsTabView } from './ItemsTabView'
import { ContainersTabView } from './ContainersTabView'
import { TriggersTabView } from './TriggersTabView'
import { CharacterClassesTabView } from './CharacterClassesTabView'
import { CharacterTypesTabView } from './CharacterTypesTabView'
import { DialogsTabView } from './DialogsTabView'
import { JournalTabView } from './JournalTabView'
import { QuestsTabView } from './QuestsTabView'
import { StorylinesTabView } from './StorylinesTabView'
import { GameplaySettingsTabView } from './GameplaySettingsTabView'
import { SettingsListView } from './lists/SettingsListView'
import { StateListView } from './lists/StateListView'
import { useEditorStore } from '../store/editorStore'

const STUB_TABS: Record<
  Exclude<StubContentType, 'abilities' | 'stories'>,
  { title: string; description: string; addLabel: string }
> = {
  characters: {
    title: 'Characters',
    description:
      'User generated, unique NPC (playable or not), and random character definitions.',
    addLabel: 'Add Character',
  },
  items: {
    title: 'Items',
    description: 'Inventory objects, equipment, and pickup definitions.',
    addLabel: 'Add Item',
  },
  containers: {
    title: 'Containers',
    description: 'Chests, corpses, and other lootable world objects.',
    addLabel: 'Add Container',
  },
  rules: {
    title: 'Rules',
    description: 'Turn-based rules engine presets and combat parameters.',
    addLabel: 'Add Rule Set',
  },
}

function isStubContentType(
  mode: EditorMode,
): mode is Exclude<StubContentType, 'abilities' | 'stories'> {
  return mode in STUB_TABS
}

function isSettingsSectionId(id: string): id is SettingsSectionId {
  return (
    id === 'project-metadata' ||
    id === 'editor-preferences' ||
    id === 'media-library' ||
    id === 'render-engines'
  )
}

interface EditorModePanelProps {
  mode: EditorMode
}

export function EditorModePanel({ mode }: EditorModePanelProps) {
  const editorScreen = useEditorStore((state) => state.editorScreen)
  const selectedEntityId = useEditorStore((state) => state.selectedEntityId)
  const mapId = useEditorStore((state) => state.mapId)

  if (mode === 'files') {
    return <FilesView />
  }

  if (mode === 'settings') {
    if (editorScreen === 'edit' && selectedEntityId && isSettingsSectionId(selectedEntityId)) {
      return <SettingsSectionEditorView sectionId={selectedEntityId} />
    }
    return <SettingsListView />
  }

  if (mode === 'media') {
    return <MediaLibraryTabView />
  }

  if (mode === 'audio-profiles') {
    return <AudioProfilesTabView />
  }

  if (mode === 'maps') {
    if (editorScreen === 'edit' && selectedEntityId === mapId) {
      return null
    }
    return <MapsListView />
  }

  if (mode === 'de-otterer') {
    return <DeOttererIconLibraryView />
  }

  if (mode === 'state') {
    if (editorScreen === 'edit' && selectedEntityId) {
      return <StateVariableEditorView />
    }
    return <StateListView />
  }

  if (mode === 'storylines') {
    return <StorylinesTabView />
  }

  if (mode === 'dialogs') {
    return <DialogsTabView />
  }

  if (mode === 'quests') {
    return <QuestsTabView />
  }

  if (mode === 'journal') {
    return <JournalTabView />
  }

  if (mode === 'attributes') {
    return <AttributesTabView />
  }

  if (mode === 'abilities') {
    return <AbilitiesTabView />
  }

  if (mode === 'animations') {
    return <AnimationsTabView />
  }

  if (mode === 'triggers') {
    return <TriggersTabView />
  }

  if (mode === 'gameplay') {
    return <GameplaySettingsTabView />
  }

  if (mode === 'characters') {
    return <CharactersTabView />
  }

  if (mode === 'character-types') {
    return <CharacterTypesTabView />
  }

  if (mode === 'character-classes') {
    return <CharacterClassesTabView />
  }

  if (mode === 'items') {
    return <ItemsTabView />
  }

  if (mode === 'containers') {
    return <ContainersTabView />
  }

  if (isStubContentType(mode)) {
    const config = STUB_TABS[mode]
    if (editorScreen === 'edit' && selectedEntityId) {
      return <StubContentEditorView type={mode} />
    }
    return (
      <ContentTabListView
        type={mode}
        title={config.title}
        description={config.description}
        addLabel={config.addLabel}
      />
    )
  }

  if (!isEditorMode(mode)) return null
  return null
}
