import { useEffect, useMemo, useRef, useState } from 'react'
import { buildDeOttererIconLibrary, mergeDeOttererIcons } from '../../admin/deOttererIconTypes'
import { DE_OTTERER_BUILTIN_ICON_IDS } from '../../admin/deOttererBuiltinIconIds'
import {
  PREVIEW_DUMMY_POSITIONS,
  PREVIEW_GRID_SIZE,
  type AnimationDefinition,
} from '../../admin/animationTypes'
import {
  getAnimationDurationMs,
  sampleAnimationAtTime,
} from '../../admin/animationPlaybackUtils'
import { DeOttererIconSvg } from '../de-otterer/DeOttererIconSvg'
import { useDeOttererIconsStore } from '../../store/deOttererIconsStore'

interface AnimationPreviewPanelProps {
  definition: AnimationDefinition
}

const DUMMY_MARKERS = [
  { key: 'main', label: '★ Main', position: PREVIEW_DUMMY_POSITIONS.main, tone: 'main' as const },
  { key: 'ally', label: 'Ally', position: PREVIEW_DUMMY_POSITIONS.ally, tone: 'ally' as const },
  {
    key: 'enemy1',
    label: 'Enemy',
    position: PREVIEW_DUMMY_POSITIONS.enemy1,
    tone: 'enemy' as const,
  },
  {
    key: 'enemy2',
    label: 'Enemy',
    position: PREVIEW_DUMMY_POSITIONS.enemy2,
    tone: 'enemy' as const,
  },
  {
    key: 'target',
    label: 'Target',
    position: PREVIEW_DUMMY_POSITIONS.target,
    tone: 'target' as const,
  },
]

export function AnimationPreviewPanel({ definition }: AnimationPreviewPanelProps) {
  const customIcons = useDeOttererIconsStore((state) => state.customIcons)
  const iconLibrary = useMemo(
    () => buildDeOttererIconLibrary(mergeDeOttererIcons(customIcons)),
    [customIcons],
  )
  const fallbackIcon = iconLibrary[DE_OTTERER_BUILTIN_ICON_IDS.stickman]

  const [actingAsMain, setActingAsMain] = useState(true)
  const [loop, setLoop] = useState(false)
  const [playing, setPlaying] = useState(false)
  const [elapsedMs, setElapsedMs] = useState(0)
  const rafRef = useRef<number | null>(null)
  const startRef = useRef<number | null>(null)

  const durationMs = useMemo(() => getAnimationDurationMs(definition), [definition])

  useEffect(() => {
    setPlaying(false)
    setElapsedMs(0)
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
  }, [definition.id, definition.steps])

  useEffect(() => {
    if (!playing) return

    function tick(now: number) {
      if (startRef.current === null) startRef.current = now
      const nextElapsed = now - startRef.current
      if (durationMs > 0 && nextElapsed >= durationMs) {
        if (loop) {
          startRef.current = now
          setElapsedMs(0)
        } else {
          setElapsedMs(durationMs)
          setPlaying(false)
          startRef.current = null
          return
        }
      } else {
        setElapsedMs(nextElapsed)
      }
      rafRef.current = requestAnimationFrame(tick)
    }

    rafRef.current = requestAnimationFrame(tick)
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
    }
  }, [playing, loop, durationMs])

  const samples = useMemo(
    () =>
      sampleAnimationAtTime(definition, elapsedMs, {
        actingAsMain,
      }),
    [definition, elapsedMs, actingAsMain],
  )

  function handlePlay() {
    startRef.current = null
    setElapsedMs(0)
    setPlaying(true)
  }

  function handleStop() {
    setPlaying(false)
    setElapsedMs(0)
    startRef.current = null
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
  }

  const cells = Array.from({ length: PREVIEW_GRID_SIZE * PREVIEW_GRID_SIZE }, (_, index) => ({
    x: index % PREVIEW_GRID_SIZE,
    y: Math.floor(index / PREVIEW_GRID_SIZE),
  }))

  return (
    <section className="animation-preview-panel">
      <header className="animation-preview-header">
        <h3>Preview</h3>
        <div className="animation-preview-controls">
          <button type="button" className="admin-primary-button" onClick={handlePlay} disabled={playing}>
            Play
          </button>
          <button type="button" className="admin-secondary-button" onClick={handleStop}>
            Stop
          </button>
          <label className="animation-preview-toggle">
            <input type="checkbox" checked={loop} onChange={(event) => setLoop(event.target.checked)} />
            Loop
          </label>
          <label className="animation-preview-toggle">
            <input
              type="checkbox"
              checked={actingAsMain}
              onChange={(event) => setActingAsMain(event.target.checked)}
            />
            Acting as main character
          </label>
        </div>
      </header>

      <div
        className="animation-preview-grid"
        style={{ ['--animation-grid-size' as string]: PREVIEW_GRID_SIZE }}
      >
        {cells.map((cell) => (
          <div key={`${cell.x}-${cell.y}`} className="animation-preview-cell" />
        ))}

        {DUMMY_MARKERS.map((marker) => (
          <div
            key={marker.key}
            className={`animation-preview-marker animation-preview-marker-${marker.tone}`}
            style={{
              ['--cell-x' as string]: marker.position.x,
              ['--cell-y' as string]: marker.position.y,
            }}
          >
            <span>{marker.label}</span>
          </div>
        ))}

        {!actingAsMain ? (
          <div
            className="animation-preview-marker animation-preview-marker-acting"
            style={{
              ['--cell-x' as string]: PREVIEW_DUMMY_POSITIONS.acting.x,
              ['--cell-y' as string]: PREVIEW_DUMMY_POSITIONS.acting.y,
            }}
          >
            <span>Acting</span>
          </div>
        ) : null}

        {samples
          .filter((sample) => sample.visible)
          .map((sample) => {
            const icon = sample.icon.iconId ? iconLibrary[sample.icon.iconId] : fallbackIcon
            if (!icon) return null
            return (
              <div
                key={sample.stepId}
                className="animation-preview-sprite"
                style={{
                  ['--cell-x' as string]: sample.x,
                  ['--cell-y' as string]: sample.y,
                  opacity: sample.icon.opacity,
                  transform: `rotate(${sample.icon.rotation}deg) scale(${sample.icon.scale})`,
                }}
              >
                <DeOttererIconSvg icon={icon} size={28} />
              </div>
            )
          })}
      </div>

      <p className="animation-preview-meta">
        {definition.steps.length} step{definition.steps.length === 1 ? '' : 's'}
        {durationMs > 0 ? ` · ${Math.round(durationMs)} ms total` : ''}
      </p>
    </section>
  )
}
