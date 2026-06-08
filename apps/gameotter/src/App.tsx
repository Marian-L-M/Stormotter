import { useEffect, useRef, useState } from 'react'
import { getActiveWorld, loadGameFromBytes, type LoadedGame } from '@otter/game-state'
import { OtterfileError } from '@otter/otterfile-core'
import { toWorldView } from '@otter/renderer-api'
import { createDemoRenderer } from '@otter/renderer-demo'
import type { Renderer } from '@otter/renderer-api'

export function App() {
  const hostRef = useRef<HTMLDivElement>(null)
  const rendererRef = useRef<Renderer | null>(null)
  const [game, setGame] = useState<LoadedGame | null>(null)
  const [activeLayer, setActiveLayer] = useState('ground')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const host = hostRef.current
    if (!host) return

    const renderer = createDemoRenderer()
    renderer.mount(host)
    rendererRef.current = renderer

    const unsubscribe = renderer.onIntent((intent) => {
      console.info('[gameotter intent]', intent)
    })

    return () => {
      unsubscribe()
      renderer.dispose()
      rendererRef.current = null
    }
  }, [])

  useEffect(() => {
    if (!game || !rendererRef.current) return

    const world = getActiveWorld(game)
    rendererRef.current.render(toWorldView(world, activeLayer))
  }, [game, activeLayer])

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return

    setLoading(true)
    setError(null)

    try {
      const bytes = new Uint8Array(await file.arrayBuffer())
      const loaded = await loadGameFromBytes(bytes)
      const world = getActiveWorld(loaded)

      setGame(loaded)
      setActiveLayer(world.layers[0] ?? 'ground')
    } catch (cause) {
      setGame(null)
      if (cause instanceof OtterfileError) {
        setError(cause.message)
      } else if (cause instanceof Error) {
        setError(cause.message)
      } else {
        setError('Failed to load otterfile')
      }
    } finally {
      setLoading(false)
    }
  }

  const activeWorld = game ? getActiveWorld(game) : null

  return (
    <main className="app-shell">
      <span className="status-pill">Player shell · otterfile loader</span>
      <h1>Gameotter</h1>
      <p>Upload an `.otterfile` cartridge to load map data through the state/render boundary.</p>

      <div className="controls">
        <label className="file-input">
          <span>{loading ? 'Loading…' : 'Choose .otterfile'}</span>
          <input
            type="file"
            accept=".otterfile,application/zip"
            disabled={loading}
            onChange={handleFileChange}
          />
        </label>
      </div>

      {error ? <p className="error-banner">{error}</p> : null}

      {game ? (
        <section className="game-panel">
          <h2>{game.title}</h2>
          <p className="game-meta">
            {game.gameId} · format {game.formatVersion} · map {game.defaultMapId}
          </p>

          {activeWorld && activeWorld.layers.length > 1 ? (
            <div className="layer-tabs" role="tablist" aria-label="Map layers">
              {activeWorld.layers.map((layer) => (
                <button
                  key={layer}
                  type="button"
                  role="tab"
                  aria-selected={layer === activeLayer}
                  className={layer === activeLayer ? 'active' : undefined}
                  onClick={() => setActiveLayer(layer)}
                >
                  {layer}
                </button>
              ))}
            </div>
          ) : null}
        </section>
      ) : (
        <p className="hint">No game loaded yet. Export an otterfile from Motherotter when ready.</p>
      )}

      <div ref={hostRef} className="renderer-host" />
    </main>
  )
}

export default App
