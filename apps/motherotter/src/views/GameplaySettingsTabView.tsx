import { AdminListShell } from '../components/admin/AdminListShell'
import { formatGameTimeClock, resolveGameTime } from '../admin/gameTimeTypes'
import { useEditorStore } from '../store/editorStore'
import { useGameplaySettingsStore } from '../store/gameplaySettingsStore'

export function GameplaySettingsTabView() {
  const settings = useGameplaySettingsStore((state) => state.settings)
  const updateSettings = useGameplaySettingsStore((state) => state.updateSettings)
  const markDirty = useEditorStore((state) => state.markDirty)
  const runStartPreview = resolveGameTime(0, settings)

  return (
    <AdminListShell
      title="Gameplay"
      description="Global timing, world clock, and day/night rules used by map preview and future runtime sessions."
    >
      <section className="gameplay-settings-panel">
        <h2 className="panel-title">World clock</h2>
        <p className="field-hint">
          Each preview run starts at the configured time on day 1. Rounds advance the global clock and
          track elapsed days and hours since the run began.
        </p>

        <label className="field">
          <span>Run start hour (0–23)</span>
          <input
            type="number"
            min={0}
            max={23}
            step={1}
            value={settings.startHour}
            onChange={(event) => {
              const value = Number(event.target.value)
              if (!Number.isFinite(value)) return
              updateSettings({ startHour: value })
              markDirty()
            }}
          />
        </label>

        <label className="field">
          <span>Run start minute (0–59)</span>
          <input
            type="number"
            min={0}
            max={59}
            step={1}
            value={settings.startMinute}
            onChange={(event) => {
              const value = Number(event.target.value)
              if (!Number.isFinite(value)) return
              updateSettings({ startMinute: value })
              markDirty()
            }}
          />
        </label>

        <label className="field">
          <span>Daytime begins (hour)</span>
          <input
            type="number"
            min={0}
            max={23}
            step={1}
            value={settings.dayStartHour}
            onChange={(event) => {
              const value = Number(event.target.value)
              if (!Number.isFinite(value)) return
              updateSettings({ dayStartHour: value })
              markDirty()
            }}
          />
          <span className="field-hint">Clock hour when daytime starts (inclusive).</span>
        </label>

        <label className="field">
          <span>Nighttime begins (hour)</span>
          <input
            type="number"
            min={0}
            max={23}
            step={1}
            value={settings.nightStartHour}
            onChange={(event) => {
              const value = Number(event.target.value)
              if (!Number.isFinite(value)) return
              updateSettings({ nightStartHour: value })
              markDirty()
            }}
          />
          <span className="field-hint">Clock hour when nighttime starts (inclusive).</span>
        </label>

        <p className="field-hint">
          Preview run start: {formatGameTimeClock(runStartPreview)} · {runStartPreview.periodLabel}
        </p>
      </section>

      <section className="gameplay-settings-panel">
        <h2 className="panel-title">Round time</h2>
        <p className="field-hint">
          Each round advances the global clock. Real-time round duration controls how quickly time passes
          during exploration preview.
        </p>

        <label className="field">
          <span>Round duration (seconds)</span>
          <input
            type="number"
            min={1}
            step={1}
            value={settings.roundDurationSeconds}
            onChange={(event) => {
              const value = Number(event.target.value)
              if (!Number.isFinite(value) || value <= 0) return
              updateSettings({ roundDurationSeconds: value })
              markDirty()
            }}
          />
          <span className="field-hint">Real seconds per round (default 10).</span>
        </label>

        <label className="field">
          <span>Game minutes per round</span>
          <input
            type="number"
            min={0}
            step={1}
            value={settings.gameMinutesPerRound}
            onChange={(event) => {
              const value = Number(event.target.value)
              if (!Number.isFinite(value) || value < 0) return
              updateSettings({ gameMinutesPerRound: value })
              markDirty()
            }}
          />
          <span className="field-hint">In-game minutes added to the global clock each round.</span>
        </label>
      </section>
    </AdminListShell>
  )
}
