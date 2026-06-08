import type { EditorMode } from '../editorModes'
import type { SettingsSectionId, StubContentType } from '../admin/types'
import { isEditorMode } from '../editorModes'
import { MapEditorView } from './editors/MapEditorView'
import { SettingsSectionEditorView } from './editors/SettingsSectionEditorView'
import { StateVariableEditorView } from './editors/StateVariableEditorView'
import { StubContentEditorView } from './editors/StubContentEditorView'
import { CharactersTabView } from './CharactersTabView'
import { ContentTabListView } from './lists/ContentTabListView'
import { FilesView } from './FilesView'
import { MapsListView } from './lists/MapsListView'
import { RacesTabView } from './RacesTabView'
import { SettingsListView } from './lists/SettingsListView'
import { StateListView } from './lists/StateListView'
import { useEditorStore } from '../store/editorStore'

const STUB_TABS: Record<
  StubContentType,
  { title: string; description: string; addLabel: string }
> = {
  stories: {
    title: 'Stories',
    description: 'Storyline nodes, dialog trees, and narrative triggers.',
    addLabel: 'Add Story',
  },
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
  abilities: {
    title: 'Abilities',
    description: 'Skills, spells, and action definitions.',
    addLabel: 'Add Ability',
  },
  rules: {
    title: 'Rules',
    description: 'Turn-based rules engine presets and combat parameters.',
    addLabel: 'Add Rule Set',
  },
}

function isStubContentType(mode: EditorMode): mode is StubContentType {
  return mode in STUB_TABS
}

function isSettingsSectionId(id: string): id is SettingsSectionId {
  return id === 'project-metadata' || id === 'editor-preferences'
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

  if (mode === 'maps') {
    if (editorScreen === 'edit' && selectedEntityId === mapId) {
      return <MapEditorView />
    }
    return <MapsListView />
  }

  if (mode === 'state') {
    if (editorScreen === 'edit' && selectedEntityId) {
      return <StateVariableEditorView />
    }
    return <StateListView />
  }

  if (mode === 'characters') {
    return <CharactersTabView />
  }

  if (mode === 'races') {
    return <RacesTabView />
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
