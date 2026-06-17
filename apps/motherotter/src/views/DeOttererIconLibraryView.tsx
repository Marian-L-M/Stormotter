import { useMemo } from 'react'
import {
  BUILTIN_DE_OTTERER_ICONS,
  mergeDeOttererIcons,
} from '../admin/deOttererIconTypes'
import { AdminListShell } from '../components/admin/AdminListShell'
import { DeOttererIconSvg } from '../components/de-otterer/DeOttererIconSvg'
import { useDeOttererIconsStore } from '../store/deOttererIconsStore'
import { useEditorStore } from '../store/editorStore'

export function DeOttererIconLibraryView() {
  const customIcons = useDeOttererIconsStore((state) => state.customIcons)
  const addIcon = useDeOttererIconsStore((state) => state.addIcon)
  const updateIcon = useDeOttererIconsStore((state) => state.updateIcon)
  const removeIcon = useDeOttererIconsStore((state) => state.removeIcon)
  const markDirty = useEditorStore((state) => state.markDirty)
  const mapRenderEngine = useEditorStore((state) => state.mapRenderEngine)

  const icons = useMemo(() => mergeDeOttererIcons(customIcons), [customIcons])
  const customOnly = icons.filter(
    (icon) => !BUILTIN_DE_OTTERER_ICONS.some((builtIn) => builtIn.id === icon.id),
  )

  function persistChange(action: () => void) {
    action()
    markDirty()
  }

  return (
    <AdminListShell
      title="De-Otterer icon library"
      description={`Minimal SVG tile icons for the ${mapRenderEngine} render engine. Each icon has configurable fill and stroke.`}
      addLabel="Add icon"
      onAdd={() => persistChange(() => addIcon('New icon'))}
    >
      <section className="de-otterer-icon-section">
        <h2 className="admin-section-heading">All icons</h2>
        <ul className="de-otterer-icon-grid">
          {icons.map((icon) => (
            <li key={icon.id} className="de-otterer-icon-card">
              <DeOttererIconSvg icon={icon} size={32} className="de-otterer-icon-preview" />
              <span className="de-otterer-icon-name">{icon.label}</span>
              {BUILTIN_DE_OTTERER_ICONS.some((builtIn) => builtIn.id === icon.id) ? (
                <span className="field-hint">Built-in</span>
              ) : null}
            </li>
          ))}
        </ul>
      </section>

      {customOnly.length > 0 ? (
        <section className="de-otterer-icon-section">
          <h2 className="admin-section-heading">Custom icons</h2>
          <ul className="de-otterer-icon-editor-list">
            {customOnly.map((icon) => (
              <li key={icon.id} className="de-otterer-icon-editor-row">
                <DeOttererIconSvg icon={icon} size={40} className="de-otterer-icon-preview" />
                <div className="de-otterer-icon-editor-fields">
                  <label className="field">
                    <span>Label</span>
                    <input
                      value={icon.label}
                      onChange={(event) =>
                        persistChange(() => updateIcon(icon.id, { label: event.target.value }))
                      }
                    />
                  </label>
                  <label className="field">
                    <span>Path data</span>
                    <textarea
                      rows={3}
                      value={icon.paths.join('\n')}
                      spellCheck={false}
                      onChange={(event) =>
                        persistChange(() =>
                          updateIcon(icon.id, {
                            paths: event.target.value
                              .split('\n')
                              .map((line) => line.trim())
                              .filter(Boolean),
                          }),
                        )
                      }
                    />
                    <span className="field-hint">One SVG path `d` per line.</span>
                  </label>
                  <div className="de-otterer-icon-style-fields">
                    <label className="field">
                      <span>Fill</span>
                      <input
                        type="color"
                        value={icon.fill.startsWith('#') ? icon.fill : '#8aa4c8'}
                        onChange={(event) =>
                          persistChange(() => updateIcon(icon.id, { fill: event.target.value }))
                        }
                      />
                    </label>
                    <label className="field">
                      <span>Stroke</span>
                      <input
                        type="color"
                        value={icon.stroke.startsWith('#') ? icon.stroke : '#4a6fa5'}
                        onChange={(event) =>
                          persistChange(() => updateIcon(icon.id, { stroke: event.target.value }))
                        }
                      />
                    </label>
                    <label className="field">
                      <span>Stroke width</span>
                      <input
                        type="number"
                        min={0}
                        step={0.25}
                        value={icon.strokeWidth}
                        onChange={(event) => {
                          const strokeWidth = Number(event.target.value)
                          if (!Number.isFinite(strokeWidth)) return
                          persistChange(() => updateIcon(icon.id, { strokeWidth }))
                        }}
                      />
                    </label>
                  </div>
                </div>
                <button
                  type="button"
                  className="admin-danger-button"
                  onClick={() => persistChange(() => removeIcon(icon.id))}
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </AdminListShell>
  )
}
