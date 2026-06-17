import { useEditorStore } from '../../store/editorStore'
import type { MapEntitySearchOption } from './MapEntitySearchPicker'
import { MapEntranceToolPanel } from './MapEntranceToolPanel'
import { MapEntitySearchPicker } from './MapEntitySearchPicker'
import { GameplayConditionEditor } from '../admin/GameplayConditionEditor'
import type { SpawnPointEntityKind } from '@otter/game-state'

const SPAWN_KINDS: { kind: SpawnPointEntityKind; label: string }[] = [
  { kind: 'character', label: 'Character' },
  { kind: 'item', label: 'Item' },
  { kind: 'container', label: 'Container' },
  { kind: 'entrance', label: 'Entrance' },
]

interface MapSpawnPointToolPanelProps {
  characterOptions: MapEntitySearchOption[]
  itemOptions: MapEntitySearchOption[]
  containerOptions: MapEntitySearchOption[]
}

export function MapSpawnPointToolPanel({
  characterOptions,
  itemOptions,
  containerOptions,
}: MapSpawnPointToolPanelProps) {
  const spawnPointDraft = useEditorStore((state) => state.spawnPointDraft)
  const setSpawnPointDraft = useEditorStore((state) => state.setSpawnPointDraft)

  const entityOptions =
    spawnPointDraft.entityKind === 'character'
      ? characterOptions
      : spawnPointDraft.entityKind === 'item'
        ? itemOptions
        : spawnPointDraft.entityKind === 'container'
          ? containerOptions
          : []

  return (
    <div className="map-spawn-point-panel">
      <fieldset className="map-spawn-kind-fieldset">
        <legend className="map-editor-toolbar-heading">Spawn type</legend>
        <div className="map-spawn-kind-tabs">
          {SPAWN_KINDS.map((entry) => (
            <button
              key={entry.kind}
              type="button"
              className={`map-spawn-kind-tab${spawnPointDraft.entityKind === entry.kind ? ' is-active' : ''}`}
              onClick={() =>
                setSpawnPointDraft({
                  ...spawnPointDraft,
                  entityKind: entry.kind,
                  entityId: null,
                })
              }
            >
              {entry.label}
            </button>
          ))}
        </div>
      </fieldset>

      {spawnPointDraft.entityKind === 'entrance' ? (
        <MapEntranceToolPanel
          draft={spawnPointDraft.entranceTarget}
          onChange={(entranceTarget) =>
            setSpawnPointDraft({ ...spawnPointDraft, entranceTarget })
          }
        />
      ) : (
        <MapEntitySearchPicker
          label={SPAWN_KINDS.find((entry) => entry.kind === spawnPointDraft.entityKind)?.label ?? 'Entity'}
          options={entityOptions}
          value={spawnPointDraft.entityId}
          onChange={(entityId) => setSpawnPointDraft({ ...spawnPointDraft, entityId })}
          placeholder="Search…"
          emptyMessage="No matches."
        />
      )}

      <div className="map-spawn-conditions">
        <h3 className="map-editor-toolbar-heading">Spawn when</h3>
        <p className="field-hint">Leave empty to always spawn. Add state checks to gate placement.</p>
        <GameplayConditionEditor
          root={spawnPointDraft.conditions}
          onChange={(conditions) => setSpawnPointDraft({ ...spawnPointDraft, conditions })}
        />
      </div>
    </div>
  )
}
