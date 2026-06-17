import type {
  InputIntent,
  Renderer,
  WorldView,
} from '@otter/renderer-api'
import { createDeOttererIconElement } from './de-otterer-icon.js'

const GLYPHS: Record<string, string> = {
  character: '@',
  item: '*',
  container: '#',
  entrance: '>',
  spawn: 'S',
  event: '★',
}

function glyphFor(contentId: string): string {
  const prefix = contentId.split(':')[0] ?? 'item'
  return GLYPHS[prefix] ?? '?'
}

function formatCellCoordinate(x: number, y: number): string {
  return `x${x + 1}, y${y + 1}`
}

function isCellSelected(worldView: WorldView, x: number, y: number): boolean {
  if (worldView.selectedCells?.some((cell) => cell.x === x && cell.y === y)) {
    return true
  }
  return worldView.selectedCell?.x === x && worldView.selectedCell?.y === y
}

export function createDemoRenderer(): Renderer {
  let container: HTMLElement | null = null
  let gridEl: HTMLElement | null = null
  let listeners = new Set<(intent: InputIntent) => void>()
  let lastView: WorldView | null = null

  const notify = (intent: InputIntent) => {
    for (const listener of listeners) listener(intent)
  }

  const renderGrid = (worldView: WorldView) => {
    if (!gridEl) return

    gridEl.replaceChildren()
    gridEl.style.setProperty('--grid-width', String(worldView.width))
    gridEl.style.setProperty('--grid-height', String(worldView.height))

    const cellByCoord = new Map<string, (typeof worldView.cells)[number]>()
    for (const cell of worldView.cells) {
      if (cell.layer !== worldView.activeLayer) continue
      cellByCoord.set(`${cell.x},${cell.y}`, cell)
    }

    const tileByCoord = new Map<string, (typeof worldView.tiles)[number]>()
    for (const tile of worldView.tiles) {
      if (tile.layer !== worldView.activeLayer) continue
      tileByCoord.set(`${tile.x},${tile.y}`, tile)
    }

    const corner = document.createElement('div')
    corner.className = 'otter-demo-axis-corner'
    corner.setAttribute('aria-hidden', 'true')
    gridEl.appendChild(corner)

    for (let x = 0; x < worldView.width; x++) {
      const label = document.createElement('div')
      label.className = 'otter-demo-axis-label otter-demo-axis-col'
      label.textContent = `x${x + 1}`
      gridEl.appendChild(label)
    }

    for (let y = 0; y < worldView.height; y++) {
      const rowLabel = document.createElement('div')
      rowLabel.className = 'otter-demo-axis-label otter-demo-axis-row'
      rowLabel.textContent = `y${y + 1}`
      gridEl.appendChild(rowLabel)

      for (let x = 0; x < worldView.width; x++) {
        const button = document.createElement('button')
        button.type = 'button'
        button.className = 'otter-demo-cell'
        button.dataset.x = String(x)
        button.dataset.y = String(y)
        button.title = formatCellCoordinate(x, y)

        const occupied = cellByCoord.get(`${x},${y}`)
        const tile = tileByCoord.get(`${x},${y}`)
        const passable = tile?.passable ?? true

        if (tile?.backgroundColor) {
          const fill = document.createElement('span')
          fill.className = 'otter-demo-cell-background'
          fill.style.backgroundColor = tile.backgroundColor
          button.appendChild(fill)
        }

        if (!passable) {
          const pattern = document.createElement('span')
          pattern.className = 'otter-demo-cell-unpassable-pattern'
          pattern.setAttribute('aria-hidden', 'true')
          button.appendChild(pattern)
        }

        const iconSnapshot =
          tile?.backgroundIconId && worldView.iconLibrary
            ? worldView.iconLibrary[tile.backgroundIconId]
            : null

        if (iconSnapshot) {
          const iconWrap = document.createElement('span')
          iconWrap.className = 'otter-demo-cell-icon'
          iconWrap.appendChild(createDeOttererIconElement(iconSnapshot, 20))
          button.appendChild(iconWrap)
        }

        const entityAppearance = occupied
          ? worldView.entityAppearances?.[occupied.contentId]
          : null

        const hideEntity =
          worldView.hideEntityAt &&
          occupied &&
          occupied.x === worldView.hideEntityAt.x &&
          occupied.y === worldView.hideEntityAt.y

        if (!hideEntity) {
          if (entityAppearance?.icon) {
            const entityWrap = document.createElement('span')
            entityWrap.className = 'otter-demo-cell-entity otter-demo-cell-entity-icon'
            entityWrap.appendChild(createDeOttererIconElement(entityAppearance.icon, 18))
            button.appendChild(entityWrap)
          } else {
            const entityGlyph =
              entityAppearance?.glyph ?? (occupied ? glyphFor(occupied.contentId) : '')
            if (entityGlyph) {
              const entitySpan = document.createElement('span')
              entitySpan.className = 'otter-demo-cell-entity'
              entitySpan.textContent = entityGlyph
              button.appendChild(entitySpan)
            }
          }
        }

        button.classList.toggle('occupied', Boolean(occupied))
        button.classList.toggle('is-unpassable', !passable)
        button.classList.toggle('is-selected', isCellSelected(worldView, x, y))
        button.classList.toggle('has-tile-icon', Boolean(iconSnapshot))

        button.addEventListener('click', (event) => {
          notify({
            type: 'cellClicked',
            x,
            y,
            layer: worldView.activeLayer,
            ctrlKey: event.ctrlKey || event.metaKey,
            shiftKey: event.shiftKey,
          })
        })

        gridEl.appendChild(button)
      }
    }
  }

  return {
    mount(host) {
      container = host
      container.classList.add('otter-demo-root')

      if (!document.getElementById('otter-demo-styles')) {
        const style = document.createElement('style')
        style.id = 'otter-demo-styles'
        style.textContent = `
          .otter-demo-root {
            display: grid;
            gap: 0.75rem;
          }
          .otter-demo-grid {
            display: grid;
            grid-template-columns: auto repeat(var(--grid-width), 2rem);
            grid-template-rows: auto repeat(var(--grid-height), 2rem);
            gap: 2px;
            width: fit-content;
            padding: 0.5rem;
            background: #1a1a1a;
            border-radius: 0.5rem;
          }
          .otter-demo-axis-corner {
            width: 2rem;
            height: 1.25rem;
          }
          .otter-demo-axis-label {
            display: grid;
            place-items: center;
            font: 500 0.625rem/1 ui-monospace, monospace;
            color: #888;
            user-select: none;
          }
          .otter-demo-axis-col {
            height: 1.25rem;
          }
          .otter-demo-axis-row {
            width: 2rem;
          }
          .otter-demo-cell {
            position: relative;
            display: grid;
            place-items: center;
            width: 2rem;
            height: 2rem;
            border: 1px solid #333;
            background: #111;
            color: #e8e8e8;
            font: 600 0.875rem/1 ui-monospace, monospace;
            cursor: pointer;
            padding: 0;
            overflow: hidden;
          }
          .otter-demo-cell-unpassable-pattern,
          .otter-demo-cell-background {
            position: absolute;
            inset: 0;
            pointer-events: none;
          }
          .otter-demo-cell-unpassable-pattern {
            z-index: 2;
            background: repeating-linear-gradient(
              -45deg,
              transparent,
              transparent 3px,
              rgba(120, 120, 120, 0.55) 3px,
              rgba(120, 120, 120, 0.55) 5px
            );
          }
          .otter-demo-cell-background {
            z-index: 1;
          }
          .otter-demo-cell.occupied {
            background: #243047;
            border-color: #4a6fa5;
          }
          .otter-demo-cell.is-unpassable {
            border-color: #555;
          }
          .otter-demo-cell.is-selected {
            outline: 2px solid #3ecf6e;
            outline-offset: -1px;
            box-shadow: 0 0 0 1px rgba(62, 207, 110, 0.35);
          }
          .otter-demo-cell:hover {
            outline: 1px solid #888;
          }
          .otter-demo-cell-icon {
            position: absolute;
            inset: 2px;
            z-index: 3;
            display: grid;
            place-items: center;
            opacity: 0.85;
            pointer-events: none;
          }
          .otter-demo-cell-icon svg {
            display: block;
            width: 100%;
            height: 100%;
          }
          .otter-demo-cell-entity {
            position: relative;
            z-index: 4;
          }
          .otter-demo-cell-entity-icon {
            display: grid;
            place-items: center;
            width: 1.125rem;
            height: 1.125rem;
          }
          .otter-demo-cell-entity-icon svg {
            display: block;
            width: 100%;
            height: 100%;
          }
        `
        document.head.appendChild(style)
      }

      gridEl = document.createElement('div')
      gridEl.className = 'otter-demo-grid'
      container.appendChild(gridEl)

      if (lastView) renderGrid(lastView)
    },

    render(worldView) {
      lastView = worldView
      renderGrid(worldView)
    },

    dispose() {
      listeners.clear()
      container?.replaceChildren()
      container = null
      gridEl = null
      lastView = null
    },

    onIntent(callback) {
      listeners.add(callback)
      return () => listeners.delete(callback)
    },
  }
}
