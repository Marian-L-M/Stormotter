import {
  AUDIO_TRIGGER_DEFINITIONS,
  type AudioProfile,
} from './audioProfileTypes'

const activeAudioElements = new Set<HTMLAudioElement>()

export function resolveAudioProfileMediaId(profile: AudioProfile): string | null {
  for (const trigger of AUDIO_TRIGGER_DEFINITIONS) {
    const mediaId = profile.triggers[trigger.id]
    if (mediaId) return mediaId
  }
  for (const trigger of profile.customTriggers) {
    if (trigger.mediaId) return trigger.mediaId
  }
  return null
}

export function playMediaUrl(url: string, volume = 0.85): void {
  const audio = new Audio(url)
  audio.volume = volume
  activeAudioElements.add(audio)
  audio.addEventListener('ended', () => activeAudioElements.delete(audio))
  audio.addEventListener('error', () => activeAudioElements.delete(audio))
  void audio.play().catch(() => {
    activeAudioElements.delete(audio)
  })
}

export function stopAllAnimationAudio(): void {
  for (const audio of activeAudioElements) {
    audio.pause()
    audio.currentTime = 0
  }
  activeAudioElements.clear()
}

export async function playAudioProfileMedia(
  profile: AudioProfile | undefined,
  resolveMediaUrl: (mediaId: string) => Promise<string | null>,
): Promise<void> {
  if (!profile) return
  const mediaId = resolveAudioProfileMediaId(profile)
  if (!mediaId) return
  const url = await resolveMediaUrl(mediaId)
  if (!url) return
  playMediaUrl(url)
}
