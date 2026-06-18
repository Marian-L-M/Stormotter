import { useCallback, useRef } from 'react'
import type { DeOttererIconSnapshot } from '@otter/renderer-api'
import { buildDeOttererIconLibrary, mergeDeOttererIcons } from '../admin/deOttererIconTypes'
import { DE_OTTERER_BUILTIN_ICON_IDS } from '../admin/deOttererBuiltinIconIds'
import {
  buildRuntimeAnimationContext,
  type RuntimeAnimationContext,
} from '../admin/animationAnchorUtils'
import { playAudioProfileMedia, stopAllAnimationAudio } from '../admin/animationAudioPlayback'
import type { AnimationDefinition } from '../admin/animationTypes'
import { playAnimationBindingGroups } from '../admin/animationBindingUtils'
import {
  computeStepTimeline,
  sampleAnimationAtTime,
} from '../admin/animationPlaybackUtils'
import type { PreviewPosition } from '../admin/mapPreviewUtils'
import { getMediaBlob } from '../lib/mediaBlobRepository'
import { cacheObjectUrl, getCachedObjectUrl } from '../lib/mediaObjectUrlCache'
import { useAudioProfilesStore } from '../store/audioProfilesStore'
import { useDeOttererIconsStore } from '../store/deOttererIconsStore'
import { useMapPreviewAnimationStore } from '../store/mapPreviewAnimationStore'
import { useMediaLibraryStore } from '../store/mediaLibraryStore'
import type { AnimationBinding } from '../admin/animationTypes'

async function resolveMediaUrl(mediaId: string): Promise<string | null> {
  const asset = useMediaLibraryStore.getState().assets.find((entry) => entry.id === mediaId)
  if (!asset?.blobId) return null
  const cached = getCachedObjectUrl(asset.blobId)
  if (cached) return cached
  const record = await getMediaBlob(asset.blobId)
  if (!record) return null
  return cacheObjectUrl(asset.blobId, URL.createObjectURL(record.data))
}

function resolveIconSnapshot(
  iconId: string | null,
  iconLibrary: Record<string, DeOttererIconSnapshot>,
): DeOttererIconSnapshot | null {
  if (iconId && iconLibrary[iconId]) return iconLibrary[iconId]
  return iconLibrary[DE_OTTERER_BUILTIN_ICON_IDS.stickman] ?? null
}

export function useMapPreviewAnimationPlayback() {
  const rafRef = useRef<number | null>(null)
  const cancelRef = useRef(false)

  const playDefinition = useCallback(
    (definition: AnimationDefinition, context: RuntimeAnimationContext) =>
      new Promise<void>((resolve) => {
        const customIcons = useDeOttererIconsStore.getState().customIcons
        const iconLibrary = buildDeOttererIconLibrary(mergeDeOttererIcons(customIcons))
        const audioProfiles = useAudioProfilesStore.getState().audioProfiles
        const timeline = computeStepTimeline(definition.steps)
        const durationMs = timeline.length > 0 ? Math.max(...timeline.map((entry) => entry.endMs)) : 0
        const requestId = `anim-play-${crypto.randomUUID().slice(0, 8)}`
        const scheduledAudio = new Set<string>()

        cancelRef.current = false
        useMapPreviewAnimationStore.getState().setPlaying(true, requestId)

        const startAt = performance.now()

        function scheduleStepAudio() {
          const elapsedMs = performance.now() - startAt
          for (let index = 0; index < definition.steps.length; index += 1) {
            const step = definition.steps[index]
            const entry = timeline[index]
            if (!step.audioProfileId || !entry) continue
            const fireAt = entry.motionStartMs + step.audioDelayMs
            if (elapsedMs < fireAt || scheduledAudio.has(step.id)) continue
            if (elapsedMs > fireAt + 50) continue
            scheduledAudio.add(step.id)
            const profile = audioProfiles.find((candidate) => candidate.id === step.audioProfileId)
            void playAudioProfileMedia(profile, resolveMediaUrl)
          }
        }

        function tick(now: number) {
          if (cancelRef.current) {
            useMapPreviewAnimationStore.getState().setPlaying(false)
            resolve()
            return
          }

          const elapsedMs = now - startAt
          scheduleStepAudio()
          const samples = sampleAnimationAtTime(definition, elapsedMs, context)
          const sprites = samples
            .map((sample) => {
              const iconSnapshot = resolveIconSnapshot(sample.icon.iconId, iconLibrary)
              if (!iconSnapshot || !sample.visible) return null
              return {
                id: `${definition.id}:${sample.stepId}`,
                x: sample.x,
                y: sample.y,
                icon: sample.icon,
                iconSnapshot,
              }
            })
            .filter((entry): entry is NonNullable<typeof entry> => Boolean(entry))

          useMapPreviewAnimationStore.getState().setSprites(sprites)

          if (durationMs > 0 && elapsedMs >= durationMs) {
            useMapPreviewAnimationStore.getState().setPlaying(false)
            resolve()
            return
          }

          rafRef.current = requestAnimationFrame(tick)
        }

        rafRef.current = requestAnimationFrame(tick)
      }),
    [],
  )

  const playBindings = useCallback(
    async (
      bindings: AnimationBinding[],
      definitions: AnimationDefinition[],
      context: RuntimeAnimationContext,
    ) => {
      if (bindings.length === 0) return
      stopAllAnimationAudio()
      await playAnimationBindingGroups(bindings, definitions, (definition) =>
        playDefinition(definition, context),
      )
    },
    [playDefinition],
  )

  const buildContext = useCallback(
    (options: {
      positions: Record<string, PreviewPosition>
      partyCharacterIds: readonly string[]
      mainCharacterIds: readonly string[]
      selectedCharacterId: string | null
      targetPosition: PreviewPosition | null
      mapId: string
      layer: string
    }) => buildRuntimeAnimationContext(options),
    [],
  )

  const cancelPlayback = useCallback(() => {
    cancelRef.current = true
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
    stopAllAnimationAudio()
    useMapPreviewAnimationStore.getState().setPlaying(false)
  }, [])

  return { playBindings, buildContext, cancelPlayback }
}
