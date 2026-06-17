import { useMemo, useState } from 'react'
import { mergeDeOttererIcons } from '../../admin/deOttererIconTypes'
import {
  patchEntityRendererEngine,
  type DeOttererEntityRendererSettings,
  type EntityRendererSettings,
} from '../../admin/entityRendererTypes'
import {
  getMapRenderEngineLabel,
  MAP_RENDER_ENGINES,
  type MapRenderEngine,
} from '../../admin/renderEngineTypes'
import { DeOttererIconSvg } from '../de-otterer/DeOttererIconSvg'
import { useDeOttererIconsStore } from '../../store/deOttererIconsStore'
import { useEditorStore } from '../../store/editorStore'

interface DeOttererEntityRendererPanelProps {
  value: DeOttererEntityRendererSettings
  defaultGlyph: string
  entityLabel: string
  onChange: (patch: Partial<DeOttererEntityRendererSettings>) => void
}

export function DeOttererEntityRendererPanel({
  value,
  defaultGlyph,
  entityLabel,
  onChange,
}: DeOttererEntityRendererPanelProps) {
  const customIcons = useDeOttererIconsStore((state) => state.customIcons)
  const icons = useMemo(() => mergeDeOttererIcons(customIcons), [customIcons])
  const selectedIcon = value.iconId ? icons.find((icon) => icon.id === value.iconId) : null
  const displayGlyph = value.glyph ?? defaultGlyph

  const previewFill = value.fill ?? selectedIcon?.fill ?? '#8aa4c8'
  const previewStroke = value.stroke ?? selectedIcon?.stroke ?? '#4a6fa5'
  const previewStrokeWidth = value.strokeWidth ?? selectedIcon?.strokeWidth ?? 1.5

  return (
    <div className="entity-renderer-engine-panel">
      <p className="admin-editor-lead">
        Configure how this {entityLabel} appears on the De-Otterer grid. Overrides apply when the
        entity is placed on a map.
      </p>

      <div className="entity-renderer-preview">
        <span className="entity-renderer-preview-label">Preview</span>
        <div className="entity-renderer-preview-cell" aria-hidden="true">
          {selectedIcon ? (
            <DeOttererIconSvg
              icon={{
                viewBox: selectedIcon.viewBox,
                paths: selectedIcon.paths,
                fill: previewFill,
                stroke: previewStroke,
                strokeWidth: previewStrokeWidth,
              }}
              size={28}
            />
          ) : (
            <span className="entity-renderer-preview-glyph">{displayGlyph}</span>
          )}
        </div>
      </div>

      <label className="field">
        <span>Grid glyph</span>
        <input
          maxLength={1}
          value={displayGlyph}
          onChange={(event) =>
            onChange({ glyph: event.target.value.slice(0, 1) || defaultGlyph })
          }
        />
        <span className="field-hint">Used when no icon is selected. Default: {defaultGlyph}</span>
      </label>

      <fieldset className="admin-fieldset">
        <legend>Icon from library</legend>
        <p className="field-hint">Optional SVG icon from the De-Otterer library.</p>
        <div className="entity-renderer-icon-grid">
          {icons.map((icon) => (
            <button
              key={icon.id}
              type="button"
              className={`entity-renderer-icon-button${value.iconId === icon.id ? ' is-active' : ''}`}
              title={icon.label}
              onClick={() => onChange({ iconId: icon.id })}
            >
              <DeOttererIconSvg icon={icon} size={24} />
              <span className="entity-renderer-icon-label">{icon.label}</span>
            </button>
          ))}
        </div>
        {value.iconId ? (
          <button
            type="button"
            className="admin-secondary-button"
            onClick={() => onChange({ iconId: null })}
          >
            Clear icon
          </button>
        ) : null}
      </fieldset>

      <fieldset className="admin-fieldset">
        <legend>Style overrides</legend>
        <p className="field-hint">Optional fill and stroke overrides when using an icon.</p>
        <div className="entity-renderer-style-fields">
          <label className="field">
            <span>Fill</span>
            <input
              type="color"
              value={value.fill ?? previewFill}
              onChange={(event) => onChange({ fill: event.target.value })}
            />
          </label>
          <label className="field">
            <span>Stroke</span>
            <input
              type="color"
              value={value.stroke ?? previewStroke}
              onChange={(event) => onChange({ stroke: event.target.value })}
            />
          </label>
          <label className="field">
            <span>Stroke width</span>
            <input
              type="number"
              min={0}
              step={0.25}
              value={value.strokeWidth ?? previewStrokeWidth}
              onChange={(event) => {
                const strokeWidth = Number(event.target.value)
                if (!Number.isFinite(strokeWidth)) return
                onChange({ strokeWidth })
              }}
            />
          </label>
        </div>
        <button
          type="button"
          className="admin-secondary-button"
          onClick={() => onChange({ fill: null, stroke: null, strokeWidth: null })}
        >
          Reset style overrides
        </button>
      </fieldset>
    </div>
  )
}

interface EntityRendererEditorPanelProps {
  value: EntityRendererSettings
  defaultGlyph: string
  entityLabel: string
  onChange: (next: EntityRendererSettings) => void
}

export function EntityRendererEditorPanel({
  value,
  defaultGlyph,
  entityLabel,
  onChange,
}: EntityRendererEditorPanelProps) {
  const enabledMapRenderEngines = useEditorStore((state) => state.enabledMapRenderEngines)
  const engineTabs = MAP_RENDER_ENGINES.filter((engine) =>
    enabledMapRenderEngines.includes(engine.id),
  )
  const [activeEngine, setActiveEngine] = useState<MapRenderEngine>(
    engineTabs[0]?.id ?? 'de-otterer',
  )

  const resolvedEngine = engineTabs.some((entry) => entry.id === activeEngine)
    ? activeEngine
    : (engineTabs[0]?.id ?? 'de-otterer')

  if (engineTabs.length === 0) {
    return (
      <p className="field-hint">
        No render engines are enabled. Enable De-Otterer under Settings → Render engines.
      </p>
    )
  }

  return (
    <div className="entity-renderer-editor">
      <div className="map-render-engine-tabs" role="tablist" aria-label="Render engines">
        {engineTabs.map((engine) => (
          <button
            key={engine.id}
            type="button"
            role="tab"
            aria-selected={engine.id === resolvedEngine}
            className={`map-render-engine-tab${engine.id === resolvedEngine ? ' is-active' : ''}`}
            onClick={() => setActiveEngine(engine.id)}
          >
            {getMapRenderEngineLabel(engine.id)}
          </button>
        ))}
      </div>

      {resolvedEngine === 'de-otterer' ? (
        <DeOttererEntityRendererPanel
          value={
            value['de-otterer'] ?? {
              glyph: defaultGlyph,
              iconId: null,
              fill: null,
              stroke: null,
              strokeWidth: null,
            }
          }
          defaultGlyph={defaultGlyph}
          entityLabel={entityLabel}
          onChange={(patch) =>
            onChange(patchEntityRendererEngine(value, 'de-otterer', patch, defaultGlyph))
          }
        />
      ) : null}
    </div>
  )
}
