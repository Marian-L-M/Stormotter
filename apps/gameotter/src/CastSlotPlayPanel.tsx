import { useMemo, useState } from 'react'
import {
  attemptRest,
  canStartRest,
  castFromSlot,
  getEffectiveAbilityForSlot,
  reassignSlot,
  resolveDefinitionsForCartridgeCharacter,
  buildAssignablePoolForCartridgeCharacter,
  sessionFromCartridgePreview,
  type CastSlotSessionState,
  type GameCartridge,
  type LoadedGame,
  type RestZone,
} from '@otter/game-state'

interface CastSlotPlayPanelProps {
  game: LoadedGame
  cartridge: GameCartridge
}

const CATEGORY_LABELS = {
  generic: 'Generic',
  divine: 'Divine',
  magic: 'Magic',
  class: 'Class',
  type: 'Type',
} as const

export function CastSlotPlayPanel({ game, cartridge }: CastSlotPlayPanelProps) {
  const characterId = cartridge.mainCharacterId ?? Object.keys(cartridge.characters)[0] ?? null
  const config = characterId ? cartridge.characters[characterId] : null

  const [session, setSession] = useState<CastSlotSessionState | null>(() =>
    config && characterId ? sessionFromCartridgePreview(characterId, config.castPreview) : null,
  )
  const [feedback, setFeedback] = useState<string | null>(null)

  const restZone: RestZone =
    game.mapRestZones.get(game.defaultMapId) ??
    cartridge.mapRestZones[game.defaultMapId] ??
    'none'

  const definitions = useMemo(
    () => (characterId ? resolveDefinitionsForCartridgeCharacter(characterId, cartridge) : []),
    [characterId, cartridge],
  )

  const assignablePool = useMemo(
    () => (characterId ? buildAssignablePoolForCartridgeCharacter(characterId, cartridge) : []),
    [characterId, cartridge],
  )

  const characterSlots = useMemo(
    () => definitions.filter((entry) => entry.owner.type === 'character'),
    [definitions],
  )

  if (!characterId || !config || !session) {
    return (
      <section className="cast-panel">
        <p className="hint">No cast slot cartridge data for this game.</p>
      </section>
    )
  }

  const runtimeSlots = session.characterCastState[characterId]?.slots ?? []
  const runtimeBySlotId = new Map(runtimeSlots.map((entry) => [entry.slotId, entry]))

  const restEligibility = canStartRest({ session, restZone, nowMs: Date.now() })

  function handleCast(slotId: string) {
    const slotDefinition = definitions.find((entry) => entry.slotId === slotId)
    if (!slotDefinition) return
    const result = castFromSlot({ session: session!, slotId, slotDefinition })
    if (!result.ok) {
      setFeedback(result.error ?? 'Cast failed.')
      return
    }
    setSession(result.session)
    const abilityId = getEffectiveAbilityForSlot(
      slotDefinition,
      result.session.characterCastState[characterId!]?.slots.find((entry) => entry.slotId === slotId),
    )
    setFeedback(abilityId ? `Cast ${abilityId}.` : 'Cast ability.')
  }

  function handleReassign(slotId: string, abilityId: string) {
    const slotDefinition = definitions.find((entry) => entry.slotId === slotId)
    if (!slotDefinition) return
    const result = reassignSlot({
      session: session!,
      slotId,
      abilityId,
      slotDefinition,
      assignablePool,
      abilityMetadata: {},
      lineageTypeId: config!.lineageTypeId,
      classIds: config!.classTracks.map((track) => track.classId),
    })
    if (!result.ok) {
      setFeedback(result.error ?? 'Could not reassign.')
      return
    }
    setSession(result.session)
    setFeedback('Slot updated.')
  }

  function handleRest() {
    const { outcome, session: nextSession } = attemptRest(
      { session: session!, restZone, nowMs: Date.now() },
      { [characterId!]: definitions },
    )
    if (outcome.interrupted) {
      setFeedback('Rest interrupted.')
      return
    }
    if (!outcome.completed) {
      setFeedback('Rest blocked.')
      return
    }
    setSession(nextSession)
    setFeedback(`Rested ${outcome.minutesAdvanced} minutes. Slots refreshed.`)
  }

  return (
    <section className="cast-panel">
      <h2>Cast slots</h2>
      <p className="game-meta">
        {characterId} · rest zone {restZone} · {config.totalLevel} total level
      </p>

      <ul className="cast-slot-list">
        {characterSlots.map((slotDef) => {
          const runtime = runtimeBySlotId.get(slotDef.slotId)
          const abilityId = getEffectiveAbilityForSlot(slotDef, runtime)
          const eligible = assignablePool.filter((entry) => entry.definitionId)

          return (
            <li key={slotDef.slotId} className="cast-slot-row">
              <strong>{CATEGORY_LABELS[slotDef.category]}</strong>
              <span>{(runtime?.usesRemaining ?? 0) > 0 ? 'Ready' : 'Spent'}</span>
              {slotDef.assignment === 'assignable' ? (
                <select
                  value={abilityId ?? ''}
                  onChange={(event) => {
                    const next = event.target.value
                    if (next) handleReassign(slotDef.slotId, next)
                  }}
                >
                  <option value="">Select…</option>
                  {eligible.map((entry) => (
                    <option key={entry.definitionId} value={entry.definitionId}>
                      {entry.definitionId}
                    </option>
                  ))}
                </select>
              ) : (
                <span>{abilityId ?? '—'}</span>
              )}
              <button
                type="button"
                disabled={!abilityId || (runtime?.usesRemaining ?? 0) <= 0}
                onClick={() => handleCast(slotDef.slotId)}
              >
                Cast
              </button>
            </li>
          )
        })}
      </ul>

      <div className="cast-rest-actions">
        <button type="button" disabled={!restEligibility.ok} onClick={handleRest}>
          Rest (8h)
        </button>
        {!restEligibility.ok ? (
          <span className="hint">Rest blocked: {restEligibility.reason?.replaceAll('_', ' ')}</span>
        ) : null}
      </div>

      {feedback ? <p className="cast-feedback">{feedback}</p> : null}
    </section>
  )
}
