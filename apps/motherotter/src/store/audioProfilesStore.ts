import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import {
  createAudioProfileId,
  createCustomTriggerId,
  createEmptyTriggers,
  normalizeAudioProfile,
  type AudioProfile,
  type AudioProfileCustomTriggerPatch,
  type AudioProfilePatch,
  type AudioTriggerId,
} from '../admin/audioProfileTypes'
import { createDefaultProjectContent } from '../lib/defaultProjectContent'

function seedAudioProfile(name: string, description = ''): AudioProfile {
  const timestamp = new Date().toISOString()
  return {
    id: createAudioProfileId(),
    name,
    description,
    triggers: createEmptyTriggers(),
    customTriggers: [],
    updatedAt: timestamp,
  }
}

interface AudioProfilesState {
  audioProfiles: AudioProfile[]
  addAudioProfile: () => string
  updateAudioProfile: (id: string, patch: AudioProfilePatch) => void
  setTriggerMedia: (id: string, triggerId: AudioTriggerId, mediaId: string | null) => void
  addCustomTrigger: (profileId: string) => string
  updateCustomTrigger: (profileId: string, triggerId: string, patch: AudioProfileCustomTriggerPatch) => void
  setCustomTriggerMedia: (profileId: string, triggerId: string, mediaId: string | null) => void
  removeCustomTrigger: (profileId: string, triggerId: string) => void
  removeAudioProfile: (id: string) => void
  getAudioProfile: (id: string) => AudioProfile | undefined
  replaceAll: (audioProfiles: AudioProfile[]) => void
}

export const useAudioProfilesStore = create<AudioProfilesState>()(
  immer((set, get) => ({
    audioProfiles: createDefaultProjectContent().audioProfiles,

    addAudioProfile: () => {
      const index = get().audioProfiles.length + 1
      const profile = seedAudioProfile(`New audio profile ${index}`)
      set((state) => {
        state.audioProfiles.unshift(profile)
      })
      return profile.id
    },

    updateAudioProfile: (id, patch) => {
      set((state) => {
        const profile = state.audioProfiles.find((entry) => entry.id === id)
        if (!profile) return

        if (patch.name !== undefined) profile.name = patch.name
        if (patch.description !== undefined) profile.description = patch.description
        if (patch.triggers !== undefined) profile.triggers = patch.triggers
        if (patch.customTriggers !== undefined) profile.customTriggers = patch.customTriggers
        profile.updatedAt = new Date().toISOString()
      })
    },

    setTriggerMedia: (id, triggerId, mediaId) => {
      set((state) => {
        const profile = state.audioProfiles.find((entry) => entry.id === id)
        if (!profile) return
        profile.triggers[triggerId] = mediaId
        profile.updatedAt = new Date().toISOString()
      })
    },

    addCustomTrigger: (profileId) => {
      const triggerId = createCustomTriggerId()
      const index =
        get().audioProfiles.find((entry) => entry.id === profileId)?.customTriggers.length ?? 0
      set((state) => {
        const profile = state.audioProfiles.find((entry) => entry.id === profileId)
        if (!profile) return
        profile.customTriggers.push({
          id: triggerId,
          label: `Custom trigger ${index + 1}`,
          description: '',
          mediaId: null,
        })
        profile.updatedAt = new Date().toISOString()
      })
      return triggerId
    },

    updateCustomTrigger: (profileId, triggerId, patch) => {
      set((state) => {
        const profile = state.audioProfiles.find((entry) => entry.id === profileId)
        if (!profile) return
        const trigger = profile.customTriggers.find((entry) => entry.id === triggerId)
        if (!trigger) return

        if (patch.label !== undefined) trigger.label = patch.label
        if (patch.description !== undefined) trigger.description = patch.description
        if (patch.mediaId !== undefined) trigger.mediaId = patch.mediaId
        profile.updatedAt = new Date().toISOString()
      })
    },

    setCustomTriggerMedia: (profileId, triggerId, mediaId) => {
      set((state) => {
        const profile = state.audioProfiles.find((entry) => entry.id === profileId)
        if (!profile) return
        const trigger = profile.customTriggers.find((entry) => entry.id === triggerId)
        if (!trigger) return
        trigger.mediaId = mediaId
        profile.updatedAt = new Date().toISOString()
      })
    },

    removeCustomTrigger: (profileId, triggerId) => {
      set((state) => {
        const profile = state.audioProfiles.find((entry) => entry.id === profileId)
        if (!profile) return
        profile.customTriggers = profile.customTriggers.filter((entry) => entry.id !== triggerId)
        profile.updatedAt = new Date().toISOString()
      })
    },

    removeAudioProfile: (id) => {
      set((state) => {
        state.audioProfiles = state.audioProfiles.filter((entry) => entry.id !== id)
      })
    },

    getAudioProfile: (id) => get().audioProfiles.find((entry) => entry.id === id),

    replaceAll: (audioProfiles) => {
      set((state) => {
        state.audioProfiles = audioProfiles.map((profile) => normalizeAudioProfile(profile))
      })
    },
  })),
)
