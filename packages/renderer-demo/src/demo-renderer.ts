import type {
  InputIntent,
  Renderer,
  WorldView,
} from '@otter/renderer-api'

const GLYPHS: Record<string, string> = {
  character: '@',
  item: '*',
  container: '#',
  entrance: '>',
}

function glyphFor(contentId: string): string {
  const prefix = contentId.split(':')[0] ?? 'item'
  return GLYPHS[prefix] ?? '?'
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

    for (let y = 0; y < worldView.height; y++) {
      for (let x = 0; x < worldView.width; x++) {
        const button = document.createElement('button')
        button.type = 'button'
        button.className = 'otter-demo-cell'
        button.dataset.x = String(x)
        button.dataset.y = String(y)
        button.title = `${x}, ${y}`

        const occupied = cellByCoord.get(`${x},${y}`)
        button.textContent = occupied ? glyphFor(occupied.contentId) : ''
        button.classList.toggle('occupied', Boolean(occupied))

        button.addEventListener('click', () => {
          notify({
            type: 'cellClicked',
            x,
            y,
            layer: worldView.activeLayer,
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
            grid-template-columns: repeat(var(--grid-width), 2rem);
            grid-template-rows: repeat(var(--grid-height), 2rem);
            gap: 2px;
            width: fit-content;
            padding: 0.5rem;
            background: #1a1a1a;
            border-radius: 0.5rem;
          }
          .otter-demo-cell {
            display: grid;
            place-items: center;
            width: 2rem;
            height: 2rem;
            border: 1px solid #333;
            background: #111;
            color: #e8e8e8;
            font: 600 0.875rem/1 ui-monospace, monospace;
            cursor: pointer;
          }
          .otter-demo-cell.occupied {
            background: #243047;
            border-color: #4a6fa5;
          }
          .otter-demo-cell:hover {
            outline: 1px solid #888;
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
