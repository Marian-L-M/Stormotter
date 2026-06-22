import { useCallback, useEffect, useMemo } from 'react'
import type { EntranceTarget } from '@otter/game-state'
import { cellKey } from '@otter/game-state'
import { parseContentId } from '../../../editorTools'
import { filterBindingsByTrigger } from '../../../admin/animationBindingUtils'
import {
  collectCharacterAnimationBindings,
  collectItemAnimationBindings,
  collectWeaponAttackBindings,
} from '../../../admin/animationDispatchUtils'
import type { AnimationTrigger, AnimationBinding } from '../../../admin/animationTypes'
import { useMediaAssetObjectUrl } from '../../../hooks/useMediaObjectUrl'
import {
  PREVIEW_DUMMY_MAIN_ID,
  canMoveTo,
  clampPreviewPosition,
  findWalkPath,
  getEntranceAtPosition,
  resolveMemberSpawnPosition,
  resolvePreviewCellInteraction,
  resolvePreviewParty,
  type PreviewPartyMember,
  type PreviewPosition,
} from '../../../admin/mapPreviewUtils'
import {
  describeTimeAdvance,
  formatElapsedSinceRunStart,
  formatGameTimeClock,
  resolveGameTime,
} from '../../../admin/gameTimeTypes'
import {
  adjustPanToFollowCharacter,
  centerPanOnCell,
} from '../../../admin/mapPreviewViewportUtils'
import {
  usePreviewCharacterMovementSpeed,
  usePreviewPartyMovementSpeeds,
} from '../../../hooks/usePreviewCharacterMovementSpeed'
import { useAbilitiesStore } from '../../../store/abilitiesStore'
import { useCharacterMetaStore } from '../../../store/characterMetaStore'
import { useContentCatalogStore } from '../../../store/contentCatalogStore'
import { useEditorStore } from '../../../store/editorStore'
import { resolvePreviewMapContext, resolveProjectMapEntry } from '../../../lib/projectRepository'
import {
  checkCharacterRestEligibility,
  restCharacterCastSlots,
  setCharacterCombatState,
  setCharacterElapsedMinutes,
} from '../../../lib/castSlotActions'
import { useGameplaySettingsStore } from '../../../store/gameplaySettingsStore'
import { useItemsStore } from '../../../store/itemsStore'
import { useContainersStore } from '../../../store/containersStore'
import { useMapPreviewStore } from '../../../store/mapPreviewStore'
import { useAnimationsStore } from '../../../store/animationsStore'
import { useMapPreviewAnimationPlayback } from '../../../hooks/useMapPreviewAnimationPlayback'
import { MapPreviewCanvas } from './MapPreviewCanvas'

function keyToDirection(key: string): { dx: number; dy: number } | null {
  switch (key.toLowerCase()) {
    case 'w':
    case 'arrowup':
      return { dx: 0, dy: -1 }
    case 's':
    case 'arrowdown':
      return { dx: 0, dy: 1 }
    case 'a':
    case 'arrowleft':
      return { dx: -1, dy: 0 }
    case 'd':
    case 'arrowright':
      return { dx: 1, dy: 0 }
    default:
      return null
  }
}

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  const tag = target.tagName
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || target.isContentEditable
}

function buildMovementBudgets(
  memberIds: readonly string[],
  speeds: Record<string, { movementCellsPerRound: number }>,
): Record<string, number> {
  const budgets: Record<string, number> = {}
  for (const characterId of memberIds) {
    budgets[characterId] = speeds[characterId]?.movementCellsPerRound ?? 6
  }
  return budgets
}

function PortraitButton({
  member,
  selected,
  unplaced,
  onSelect,
  onFocus,
  onBeginDummyDrag,
}: {
  member: PreviewPartyMember
  selected: boolean
  unplaced: boolean
  onSelect: () => void
  onFocus: () => void
  onBeginDummyDrag: () => void
}) {
  const portraitUrl = useMediaAssetObjectUrl(member.portraitMediaId)
  const draggable = member.isDummy && unplaced

  return (
    <button
      type="button"
      className={`map-preview-portrait${selected ? ' is-selected' : ''}${member.isDummy ? ' is-dummy' : ''}${unplaced ? ' is-unplaced' : ''}`}
      draggable={draggable}
      onClick={onSelect}
      onDoubleClick={(event) => {
        event.preventDefault()
        onFocus()
      }}
      onDragStart={(event) => {
        if (!draggable) return
        event.dataTransfer.setData('text/plain', PREVIEW_DUMMY_MAIN_ID)
        event.dataTransfer.effectAllowed = 'move'
        onBeginDummyDrag()
      }}
      title={
        draggable
          ? `${member.title} — double-click to focus, drag onto map to place dummy main`
          : `${member.title} — double-click to focus on map`
      }
    >
      {portraitUrl ? (
        <img src={portraitUrl} alt="" className="map-preview-portrait-image" />
      ) : (
        <span className="map-preview-portrait-fallback">{member.title.slice(0, 1).toUpperCase()}</span>
      )}
      <span className="map-preview-portrait-name">{member.isMain ? `${member.title} ★` : member.title}</span>
    </button>
  )
}

export function MapPreviewPanel({ sessionKey }: { sessionKey: number }) {
  const maps = useEditorStore((state) => state.maps)
  const editorMapId = useEditorStore((state) => state.mapId)
  const editorActiveLayer = useEditorStore((state) => state.activeLayer)
  const editorWorld = useEditorStore((state) => state.world)
  const editorBackdropMediaId = useEditorStore((state) => state.mapBackdropMediaId)
  const characters = useContentCatalogStore((state) => state.stubs.characters)
  const metaByCharacterId = useCharacterMetaStore((state) => state.metaByCharacterId)
  const abilityDefinitions = useAbilitiesStore((state) => state.definitions)
  const levelAbilityGrants = useAbilitiesStore((state) => state.levelAbilityGrants)
  const settings = useGameplaySettingsStore((state) => state.settings)

  const items = useItemsStore((state) => state.items)
  const containers = useContainersStore((state) => state.containers)
  const animationDefinitions = useAnimationsStore((state) => state.definitions)
  const mapEventBindings = useAnimationsStore((state) => state.mapEventBindings)
  const { playBindings, buildContext } = useMapPreviewAnimationPlayback()

  const positions = useMapPreviewStore((state) => state.positions)
  const selectedCharacterId = useMapPreviewStore((state) => state.selectedCharacterId)
  const placingDummy = useMapPreviewStore((state) => state.placingDummy)
  const paused = useMapPreviewStore((state) => state.paused)
  const movementBudgetByCharacterId = useMapPreviewStore((state) => state.movementBudgetByCharacterId)
  const walkPath = useMapPreviewStore((state) => state.walkPath)
  const viewportSize = useMapPreviewStore((state) => state.viewportSize)
  const viewportFollowCharacter = useMapPreviewStore((state) => state.viewportFollowCharacter)
  const elapsedGameMinutes = useMapPreviewStore((state) => state.elapsedGameMinutes)
  const roundNumber = useMapPreviewStore((state) => state.roundNumber)
  const roundElapsedMs = useMapPreviewStore((state) => state.roundElapsedMs)
  const terminalExpanded = useMapPreviewStore((state) => state.terminalExpanded)
  const terminalLines = useMapPreviewStore((state) => state.terminalLines)
  const lastInteraction = useMapPreviewStore((state) => state.lastInteraction)
  const resetForMap = useMapPreviewStore((state) => state.resetForMap)
  const setPreviewMap = useMapPreviewStore((state) => state.setPreviewMap)
  const currentMapId = useMapPreviewStore((state) => state.currentMapId)
  const currentActiveLayer = useMapPreviewStore((state) => state.currentActiveLayer)
  const setPositions = useMapPreviewStore((state) => state.setPositions)
  const setPosition = useMapPreviewStore((state) => state.setPosition)
  const setSelectedCharacterId = useMapPreviewStore((state) => state.setSelectedCharacterId)
  const setPlacingDummy = useMapPreviewStore((state) => state.setPlacingDummy)
  const togglePaused = useMapPreviewStore((state) => state.togglePaused)
  const setMovementBudgets = useMapPreviewStore((state) => state.setMovementBudgets)
  const setWalkPath = useMapPreviewStore((state) => state.setWalkPath)
  const clearWalkPath = useMapPreviewStore((state) => state.clearWalkPath)
  const consumeMovement = useMapPreviewStore((state) => state.consumeMovement)
  const setViewportFollowCharacter = useMapPreviewStore((state) => state.setViewportFollowCharacter)
  const appendTerminalLine = useMapPreviewStore((state) => state.appendTerminalLine)
  const advanceElapsedGameMinutes = useMapPreviewStore((state) => state.advanceElapsedGameMinutes)
  const setElapsedGameMinutes = useMapPreviewStore((state) => state.setElapsedGameMinutes)
  const setTerminalExpanded = useMapPreviewStore((state) => state.setTerminalExpanded)
  const setLastInteraction = useMapPreviewStore((state) => state.setLastInteraction)

  const previewMapId = currentMapId ?? editorMapId
  const previewContext = useMemo(
    () =>
      resolvePreviewMapContext({
        editorMapId,
        editorWorld,
        editorActiveLayer,
        maps,
        previewMapId: currentMapId,
        previewActiveLayer: currentActiveLayer,
      }),
    [currentActiveLayer, currentMapId, editorActiveLayer, editorMapId, editorWorld, maps],
  )
  const world = previewContext.world
  const activeLayer = previewContext.activeLayer
  const mapBackdropMediaId =
    previewMapId === editorMapId
      ? editorBackdropMediaId
      : (previewContext.entry?.backdropMediaId ?? editorBackdropMediaId)
  const mapTitle = previewContext.entry?.title ?? previewMapId
  const mapRestZone = previewContext.entry?.restZone ?? 'none'

  const party = useMemo(
    () => resolvePreviewParty(characters, metaByCharacterId, levelAbilityGrants),
    [characters, metaByCharacterId, levelAbilityGrants],
  )

  const mainCharacterId = party.mainCharacterId
  const mainRestEligibility = mainCharacterId
    ? checkCharacterRestEligibility(mainCharacterId, mapRestZone)
    : { ok: false as const, reason: 'rest_forbidden' as const }

  const partyCharacterIds = useMemo(
    () => new Set(party.members.map((member) => member.characterId)),
    [party.members],
  )

  const selectedMember = party.members.find((member) => member.characterId === selectedCharacterId) ?? null
  const gameTime = useMemo(
    () => resolveGameTime(elapsedGameMinutes, settings),
    [elapsedGameMinutes, settings],
  )
  const partyMemberIds = useMemo(() => party.members.map((member) => member.characterId), [party.members])
  const partyMovementSpeeds = usePreviewPartyMovementSpeeds(partyMemberIds)
  const selectedMovement = usePreviewCharacterMovementSpeed(selectedCharacterId)

  const applyFollowPan = useCallback(
    (cellX: number, cellY: number) => {
      const state = useMapPreviewStore.getState()
      if (!state.viewportFollowCharacter || state.viewportSize.width <= 0 || state.viewportSize.height <= 0) {
        return
      }
      const next = adjustPanToFollowCharacter(
        state.viewportPan,
        cellX,
        cellY,
        state.viewportSize.width,
        state.viewportSize.height,
        world.width,
        world.height,
      )
      if (next.x === state.viewportPan.x && next.y === state.viewportPan.y) return
      state.setViewportPan(next)
    },
    [world.height, world.width],
  )

  const centerOnCharacter = useCallback(
    (characterId: string | null) => {
      if (!characterId) return
      const state = useMapPreviewStore.getState()
      const pos = state.positions[characterId]
      if (
        !pos ||
        pos.mapId !== previewMapId ||
        state.viewportSize.width <= 0 ||
        state.viewportSize.height <= 0
      ) {
        return
      }
      state.setViewportPan(
        centerPanOnCell(
          pos.x,
          pos.y,
          state.viewportSize.width,
          state.viewportSize.height,
          world.width,
          world.height,
        ),
      )
    },
    [previewMapId, world.height, world.width],
  )

  const focusCharacterOnMap = useCallback(
    (characterId: string) => {
      setSelectedCharacterId(characterId)
      setViewportFollowCharacter(true)
      centerOnCharacter(characterId)
    },
    [centerOnCharacter, setSelectedCharacterId, setViewportFollowCharacter],
  )

  useEffect(() => {
    const editor = useEditorStore.getState()
    resetForMap(editor.mapId)

    const mainMeta = party.mainCharacterId ? metaByCharacterId[party.mainCharacterId] : undefined
    if (mainMeta?.castSlotPreview) {
      setElapsedGameMinutes(mainMeta.castSlotPreview.elapsedMinutes)
    }

    const initialPositions: Record<string, PreviewPosition> = {}
    for (const member of party.members) {
      const spawn = resolveMemberSpawnPosition(
        editor.world,
        editor.mapId,
        member.characterId,
        metaByCharacterId,
      )
      if (spawn) initialPositions[member.characterId] = spawn
    }

    setPositions(initialPositions)
    setSelectedCharacterId(party.mainCharacterId)
    setMovementBudgets(buildMovementBudgets(partyMemberIds, partyMovementSpeeds))
    if (party.needsDummyPlacement && !initialPositions[PREVIEW_DUMMY_MAIN_ID]) {
      setPlacingDummy(true)
      appendTerminalLine('system', 'No main character spawn found — place the dummy main on the map.')
    }
    // Only initialize when a new preview session starts — do not reset on editor/party updates.
  }, [sessionKey])

  useEffect(() => {
    if (!selectedCharacterId || viewportSize.width <= 0) return
    centerOnCharacter(selectedCharacterId)
  }, [sessionKey, selectedCharacterId, centerOnCharacter, viewportSize.width, viewportSize.height])

  useEffect(() => {
    if (!selectedCharacterId) return
    const pos = positions[selectedCharacterId]
    if (!pos || pos.mapId !== previewMapId) return
    setViewportFollowCharacter(true)
    centerOnCharacter(selectedCharacterId)
  }, [previewMapId, currentActiveLayer, selectedCharacterId, positions, centerOnCharacter, setViewportFollowCharacter])

  useEffect(() => {
    if (!selectedCharacterId || !viewportFollowCharacter) return
    const pos = positions[selectedCharacterId]
    if (!pos || pos.mapId !== previewMapId) return
    applyFollowPan(pos.x, pos.y)
  }, [
    applyFollowPan,
    positions,
    previewMapId,
    selectedCharacterId,
    viewportFollowCharacter,
  ])

  useEffect(() => {
    const intervalMs = 250
    const id = window.setInterval(() => {
      const state = useMapPreviewStore.getState()
      if (state.paused) return
      const nextElapsed = state.roundElapsedMs + intervalMs
      const roundMs = settings.roundDurationSeconds * 1000
      if (nextElapsed >= roundMs) {
        const previousElapsed = state.elapsedGameMinutes
        state.tickRound(settings.gameMinutesPerRound)
        state.setMovementBudgets(buildMovementBudgets(partyMemberIds, partyMovementSpeeds))
        const mainId = party.mainCharacterId
        if (mainId) {
          setCharacterElapsedMinutes(mainId, useMapPreviewStore.getState().elapsedGameMinutes)
        }
        const transition = describeTimeAdvance(
          previousElapsed,
          previousElapsed + settings.gameMinutesPerRound,
          settings,
        )
        if (transition) {
          state.appendTerminalLine('system', transition)
        }
      } else {
        state.setRoundElapsedMs(nextElapsed)
      }
    }, intervalMs)
    return () => window.clearInterval(id)
  }, [
    partyMemberIds,
    partyMovementSpeeds,
    settings.gameMinutesPerRound,
    settings.roundDurationSeconds,
    party.mainCharacterId,
    setCharacterElapsedMinutes,
  ])

  const applyEntranceTransition = useCallback(
    (target: EntranceTarget, characterId: string) => {
      const editor = useEditorStore.getState()
      const destMap = resolveProjectMapEntry(editor.maps, target.mapId)
      if (!destMap) {
        const available = editor.maps.map((map) => `${map.title} (${map.id})`).join(', ')
        appendTerminalLine(
          'system',
          available
            ? `Cannot travel — map "${target.mapId}" was not found. Available maps: ${available}.`
            : `Cannot travel — map "${target.mapId}" was not found.`,
        )
        return false
      }

      const destWorld = destMap.id === editor.mapId ? editor.world : destMap.world
      const arrival = clampPreviewPosition(destWorld, destMap.id, target)
      clearWalkPath()
      setPreviewMap(destMap.id, arrival.layer)
      setPosition(characterId, arrival)
      setViewportFollowCharacter(true)

      const message = `You enter ${destMap.title} at (${arrival.x}, ${arrival.y}, ${arrival.layer}).`
      setLastInteraction(message)
      appendTerminalLine('action', message)
      return true
    },
    [
      appendTerminalLine,
      clearWalkPath,
      setLastInteraction,
      setPosition,
      setPreviewMap,
      setViewportFollowCharacter,
    ],
  )

  const tryEntranceAtPosition = useCallback(
    (characterId: string, position: PreviewPosition) => {
      const editor = useEditorStore.getState()
      const preview = useMapPreviewStore.getState()
      const { mapId, world: previewWorld } = resolvePreviewMapContext({
        editorMapId: editor.mapId,
        editorWorld: editor.world,
        editorActiveLayer: editor.activeLayer,
        maps: editor.maps,
        previewMapId: preview.currentMapId,
        previewActiveLayer: preview.currentActiveLayer,
      })
      if (position.mapId !== mapId) return false
      const entrance = getEntranceAtPosition(previewWorld, position)
      if (!entrance) {
        const cell = previewWorld.cells.get(
          cellKey(position.x, position.y, position.layer),
        )
        if (cell && parseContentId(cell.contentId).kind === 'entrance') {
          appendTerminalLine('system', 'This entrance has no destination configured.')
        }
        return false
      }
      return applyEntranceTransition(entrance, characterId)
    },
    [applyEntranceTransition, appendTerminalLine],
  )

  useEffect(() => {
    if (paused || walkPath.length === 0) return
    const id = window.setInterval(() => {
      const state = useMapPreviewStore.getState()
      if (state.paused || state.walkPath.length === 0) return
      const characterId = state.walkingCharacterId
      const budget = characterId ? state.movementBudgetByCharacterId[characterId] ?? 0 : 0
      if (budget <= 0) {
        state.clearWalkPath()
        state.appendTerminalLine('system', 'No movement remaining this round.')
        return
      }
      const wasLastStep = state.walkPath.length === 1
      const moved = state.advanceWalkStep()
      if (!moved) {
        state.appendTerminalLine('system', 'No movement remaining this round.')
        return
      }
      if (wasLastStep && characterId) {
        const pos = useMapPreviewStore.getState().positions[characterId]
        if (pos) {
          tryEntranceAtPosition(characterId, pos)
        }
      }
    }, 180)
    return () => window.clearInterval(id)
  }, [paused, tryEntranceAtPosition, walkPath.length])

  const handleWalkToCell = useCallback(
    (target: PreviewPosition) => {
      const state = useMapPreviewStore.getState()
      if (state.paused || state.placingDummy || !state.selectedCharacterId) return
      const selectedCharacterId = state.selectedCharacterId
      const current = state.positions[selectedCharacterId]
      const editor = useEditorStore.getState()
      const { mapId, world: previewWorld } = resolvePreviewMapContext({
        editorMapId: editor.mapId,
        editorWorld: editor.world,
        editorActiveLayer: editor.activeLayer,
        maps: editor.maps,
        previewMapId: state.currentMapId,
        previewActiveLayer: state.currentActiveLayer,
      })
      if (!current || current.mapId !== mapId) return

      const budget = state.movementBudgetByCharacterId[selectedCharacterId] ?? 0
      if (budget <= 0) {
        appendTerminalLine('system', 'No movement remaining this round.')
        return
      }

      const path = findWalkPath(previewWorld, mapId, state.positions, selectedCharacterId, target)
      if (!path) {
        appendTerminalLine('system', 'No path to that cell.')
        return
      }
      if (path.length === 0) return

      setWalkPath(selectedCharacterId, path)
    },
    [appendTerminalLine, setWalkPath],
  )

  const handleKeyboardStep = useCallback(
    (dx: number, dy: number) => {
      const state = useMapPreviewStore.getState()
      if (state.paused || state.placingDummy || !state.selectedCharacterId) return
      const selectedCharacterId = state.selectedCharacterId
      const current = state.positions[selectedCharacterId]
      if (!current || current.mapId !== previewMapId) return

      clearWalkPath()
      const target: PreviewPosition = {
        x: current.x + dx,
        y: current.y + dy,
        layer: current.layer,
        mapId: previewMapId,
      }
      if (!canMoveTo(world, previewMapId, state.positions, selectedCharacterId, target)) return
      if (!consumeMovement(selectedCharacterId)) {
        appendTerminalLine('system', 'No movement remaining this round.')
        return
      }

      setViewportFollowCharacter(true)
      setPosition(selectedCharacterId, target)
      applyFollowPan(target.x, target.y)
      tryEntranceAtPosition(selectedCharacterId, target)
    },
    [
      appendTerminalLine,
      applyFollowPan,
      clearWalkPath,
      consumeMovement,
      previewMapId,
      setPosition,
      setViewportFollowCharacter,
      tryEntranceAtPosition,
      world,
    ],
  )

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (isTypingTarget(event.target)) return

      if (event.code === 'Space') {
        event.preventDefault()
        togglePaused()
        return
      }

      if (paused || placingDummy) return

      const direction = keyToDirection(event.key)
      if (!direction) return
      event.preventDefault()
      handleKeyboardStep(direction.dx, direction.dy)
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [handleKeyboardStep, paused, placingDummy, togglePaused])

  const handleInteract = useCallback(
    (message: string) => {
      setLastInteraction(message)
      appendTerminalLine(message.includes('talk') ? 'dialog' : 'action', message)
    },
    [appendTerminalLine, setLastInteraction],
  )

  const triggerPreviewAnimations = useCallback(
    async (
      trigger: AnimationTrigger,
      target: PreviewPosition | null,
      extraBindings: AnimationBinding[] = [],
    ) => {
      if (!selectedCharacterId) return
      const context = buildContext({
        positions,
        partyCharacterIds: party.members.map((member) => member.characterId),
        mainCharacterIds: party.members.filter((member) => member.isMain).map((member) => member.characterId),
        selectedCharacterId,
        targetPosition: target,
        mapId: previewMapId,
        layer: activeLayer,
      })

      const characterBindings = selectedMember
        ? collectCharacterAnimationBindings(trigger, {
            abilityDefinitions,
            assignedAbilityIds: selectedMember.abilityIds,
            items,
          })
        : []

      const bindings = [...characterBindings, ...extraBindings]
      if (bindings.length === 0) return
      await playBindings(bindings, animationDefinitions, context)
    },
    [
      activeLayer,
      abilityDefinitions,
      animationDefinitions,
      buildContext,
      items,
      party.members,
      playBindings,
      positions,
      previewMapId,
      selectedCharacterId,
      selectedMember,
    ],
  )

  const dispatchCellInteractionAnimations = useCallback(
    async (target: PreviewPosition, previewWorld: typeof world) => {
      const cell = previewWorld.cells.get(cellKey(target.x, target.y, target.layer))
      if (!cell) return
      const { kind, entityId } = parseContentId(cell.contentId)

      if (kind === 'event') {
        const bindings = filterBindingsByTrigger(mapEventBindings[entityId] ?? [], 'on_event')
        await triggerPreviewAnimations('on_event', target, bindings)
        return
      }

      if (kind === 'item') {
        const item = items.find((entry) => entry.id === entityId)
        if (item) {
          const bindings = collectItemAnimationBindings(item, 'on_use')
          await triggerPreviewAnimations('on_use', target, bindings)
        }
      }
    },
    [items, mapEventBindings, triggerPreviewAnimations],
  )

  const handleInteractAtCell = useCallback(
    (target: PreviewPosition) => {
      if (!selectedCharacterId) return
      const editor = useEditorStore.getState()
      const preview = useMapPreviewStore.getState()
      const { world: previewWorld } = resolvePreviewMapContext({
        editorMapId: editor.mapId,
        editorWorld: editor.world,
        editorActiveLayer: editor.activeLayer,
        maps: editor.maps,
        previewMapId: preview.currentMapId,
        previewActiveLayer: preview.currentActiveLayer,
      })
      const interaction = resolvePreviewCellInteraction(
        previewWorld,
        target,
        characters,
        items,
        containers,
        editor.maps,
      )
      if (interaction.entranceTarget) {
        applyEntranceTransition(interaction.entranceTarget, selectedCharacterId)
        return
      }
      handleInteract(interaction.message)
      void dispatchCellInteractionAnimations(target, previewWorld)
    },
    [
      applyEntranceTransition,
      characters,
      containers,
      dispatchCellInteractionAnimations,
      handleInteract,
      items,
      selectedCharacterId,
    ],
  )

  const handlePlaceDummy = useCallback(
    (position: PreviewPosition) => {
      const placed: PreviewPosition = { ...position, mapId: previewMapId }
      setPosition(PREVIEW_DUMMY_MAIN_ID, placed)
      setPlacingDummy(false)
      setSelectedCharacterId(PREVIEW_DUMMY_MAIN_ID)
      appendTerminalLine('system', `Dummy main placed at (${placed.x}, ${placed.y}).`)
    },
    [appendTerminalLine, previewMapId, setPlacingDummy, setPosition, setSelectedCharacterId],
  )

  const selectedAbilities = useMemo(() => {
    if (!selectedMember) return []
    return selectedMember.abilityIds
      .map((id) => abilityDefinitions.find((entry) => entry.id === id))
      .filter((entry): entry is NonNullable<typeof entry> => Boolean(entry))
  }, [abilityDefinitions, selectedMember])

  const roundProgress =
    settings.roundDurationSeconds > 0
      ? Math.min(100, (roundElapsedMs / (settings.roundDurationSeconds * 1000)) * 100)
      : 0

  return (
    <div className="map-preview-panel">
      <div className="map-preview-main">
        <div className="map-preview-stage map-preview-stage-time">
          <div className={`map-preview-time-backdrop map-preview-time-${gameTime.period}`} aria-hidden="true" />
          <div className="map-preview-hud map-preview-hud-top">
            <div className="map-preview-party-bar">
              {party.members.map((member) => (
                <PortraitButton
                  key={member.characterId}
                  member={member}
                  selected={member.characterId === selectedCharacterId}
                  unplaced={
                    !positions[member.characterId] ||
                    positions[member.characterId]!.mapId !== previewMapId
                  }
                  onSelect={() => setSelectedCharacterId(member.characterId)}
                  onFocus={() => focusCharacterOnMap(member.characterId)}
                  onBeginDummyDrag={() => setPlacingDummy(true)}
                />
              ))}
            </div>
            <div className={`map-preview-time-hud map-preview-time-hud-${gameTime.period}`}>
              <span className="map-preview-game-time">{formatGameTimeClock(gameTime)}</span>
              <span className="map-preview-period-label">{gameTime.periodLabel}</span>
              <span className="map-preview-elapsed-label">{formatElapsedSinceRunStart(gameTime)}</span>
              <span className="map-preview-round-label">
                Round {roundNumber} · {settings.roundDurationSeconds}s
              </span>
              <div className="map-preview-round-bar">
                <div className="map-preview-round-fill" style={{ width: `${roundProgress}%` }} />
              </div>
            </div>
          </div>

          <MapPreviewCanvas
            world={world}
            currentMapId={previewMapId}
            activeLayer={activeLayer}
            mapBackdropMediaId={mapBackdropMediaId}
            selectedCharacterId={selectedCharacterId}
            positions={positions}
            placingDummy={placingDummy}
            partyCharacterIds={partyCharacterIds}
            onWalkToCell={handleWalkToCell}
            onInteractAtCell={handleInteractAtCell}
            onPlaceDummy={handlePlaceDummy}
          />
        </div>

        <aside className="map-preview-context-panel panel">
          <h3 className="map-preview-context-title">Preview context</h3>
          <p className="field-hint">Current map: {mapTitle}</p>
          {selectedMember ? (
            <>
              <p className="map-preview-context-lead">
                {selectedMember.title}
                {selectedMember.isMain ? ' · Main' : ''}
                {selectedMember.isDummy ? ' · Dummy placeholder' : ''}
              </p>
              <p className="field-hint">Level {selectedMember.level}</p>
              <p className="field-hint">
                Movement {selectedMovement.movementSpeedFt} ft ({selectedMovement.movementCellsPerRound} cells/round)
                · Remaining {selectedCharacterId ? movementBudgetByCharacterId[selectedCharacterId] ?? 0 : 0}
              </p>
              {positions[selectedMember.characterId] &&
              positions[selectedMember.characterId]!.mapId === previewMapId ? (
                <p className="field-hint">
                  Position ({positions[selectedMember.characterId]!.x},{' '}
                  {positions[selectedMember.characterId]!.y},{' '}
                  {positions[selectedMember.characterId]!.layer})
                </p>
              ) : (
                <p className="field-hint">Not on this map</p>
              )}
            </>
          ) : (
            <p className="field-hint">Select a party member.</p>
          )}
          {lastInteraction ? (
            <blockquote className="map-preview-last-interaction">{lastInteraction}</blockquote>
          ) : null}
          <p className="field-hint">
            World time: {formatGameTimeClock(gameTime)} · {gameTime.periodLabel} ·{' '}
            {formatElapsedSinceRunStart(gameTime)} since run start
          </p>
          <p className="field-hint">
            Total hours since run start: {gameTime.elapsedHours}h
          </p>
        </aside>
      </div>

      <div className="map-preview-footer">
        <div className="map-preview-action-bar">
          <button
            type="button"
            className={`admin-secondary-button${paused ? ' is-active' : ''}`}
            onClick={togglePaused}
          >
            {paused ? 'Resume' : 'Pause'}
          </button>
          <button
            type="button"
            className="admin-secondary-button"
            disabled={!selectedCharacterId || placingDummy}
            onClick={() => {
              if (!selectedCharacterId) return
              const pos = positions[selectedCharacterId]
              if (!pos) return
                handleInteract(
                  `You wait and observe (${formatGameTimeClock(gameTime)} · ${formatElapsedSinceRunStart(gameTime)}).`,
                )
            }}
          >
            Wait
          </button>
          <button
            type="button"
            className="admin-secondary-button"
            disabled={!mainCharacterId || !mainRestEligibility.ok || mapRestZone === 'none'}
            onClick={() => {
              if (!mainCharacterId) return
              const result = restCharacterCastSlots(mainCharacterId, {
                restZone: mapRestZone,
                onMinutesAdvanced: (minutes) => advanceElapsedGameMinutes(minutes),
              })
              appendTerminalLine(result.ok ? 'system' : 'combat', result.message)
              if (result.hooks?.length) {
                for (const hook of result.hooks) {
                  appendTerminalLine('system', `[${hook}]`)
                }
              }
            }}
          >
            Rest (8h)
          </button>
          <button
            type="button"
            className="admin-secondary-button"
            disabled={!mainCharacterId}
            onClick={() => {
              if (!mainCharacterId) return
              setCharacterCombatState(mainCharacterId, true)
              appendTerminalLine('combat', 'Combat started — rest blocked.')
            }}
          >
            Start combat
          </button>
          <button
            type="button"
            className="admin-secondary-button"
            disabled={!mainCharacterId}
            onClick={() => {
              if (!mainCharacterId) return
              setCharacterCombatState(mainCharacterId, false)
              appendTerminalLine('combat', 'Combat ended — 30s cooldown before rest.')
            }}
          >
            End combat
          </button>
          <button
            type="button"
            className="admin-secondary-button"
            disabled={!selectedCharacterId || placingDummy}
            onClick={() => {
              if (!selectedCharacterId) return
              const pos = positions[selectedCharacterId]
              if (!pos || pos.mapId !== previewMapId) return
              const editor = useEditorStore.getState()
              const preview = useMapPreviewStore.getState()
              const { world: previewWorld } = resolvePreviewMapContext({
                editorMapId: editor.mapId,
                editorWorld: editor.world,
                editorActiveLayer: editor.activeLayer,
                maps: editor.maps,
                previewMapId: preview.currentMapId,
                previewActiveLayer: preview.currentActiveLayer,
              })
              const interaction = resolvePreviewCellInteraction(
                previewWorld,
                pos,
                characters,
                items,
                containers,
                editor.maps,
              )
              if (interaction.entranceTarget) {
                applyEntranceTransition(interaction.entranceTarget, selectedCharacterId)
                return
              }
              handleInteract(interaction.message)
              void dispatchCellInteractionAnimations(pos, previewWorld)
            }}
          >
            Interact
          </button>
          <button
            type="button"
            className="admin-secondary-button"
            disabled={!selectedCharacterId || placingDummy}
            onClick={() => {
              if (!selectedCharacterId) return
              const pos = positions[selectedCharacterId]
              if (!pos || pos.mapId !== previewMapId) return
              appendTerminalLine('combat', `${selectedMember?.title ?? 'Character'} attacks.`)
              const weaponBindings = collectWeaponAttackBindings(items)
              void triggerPreviewAnimations('on_attack', pos, weaponBindings)
            }}
          >
            Attack
          </button>
          {party.needsDummyPlacement ? (
            <button
              type="button"
              className={`admin-secondary-button${placingDummy ? ' is-active' : ''}`}
              onClick={() => setPlacingDummy(!placingDummy)}
            >
              {placingDummy ? 'Cancel placement' : 'Place dummy main'}
            </button>
          ) : null}
          {selectedAbilities.map((ability) => (
            <button
              key={ability.id}
              type="button"
              className="admin-secondary-button"
              disabled={placingDummy}
              onClick={() => {
                appendTerminalLine('action', `${selectedMember?.title} uses ${ability.name}.`)
                const pos = selectedCharacterId ? positions[selectedCharacterId] ?? null : null
                void triggerPreviewAnimations('on_use', pos)
              }}
            >
              {ability.name}
            </button>
          ))}
        </div>

        <div className={`map-preview-terminal${terminalExpanded ? ' is-expanded' : ''}`}>
          <button
            type="button"
            className="map-preview-terminal-toggle"
            onClick={() => setTerminalExpanded(!terminalExpanded)}
          >
            {terminalExpanded ? '▾' : '▸'} Action log &amp; dialogue
          </button>
          {terminalExpanded ? (
            <ul className="map-preview-terminal-lines">
              {terminalLines.map((line) => (
                <li key={line.id} className={`map-preview-terminal-line map-preview-terminal-${line.kind}`}>
                  {line.text}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </div>
    </div>
  )
}
