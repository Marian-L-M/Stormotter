import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import {
  createAiPhaseRuleId,
  createAiProfileId,
  createDefaultAiProfiles,
  normalizeAiBattlePhaseRule,
  normalizeAiProfile,
  type AiBattlePhaseRulePatch,
  type AiProfile,
  type AiProfilePatch,
} from '../admin/aiProfileTypes'
import { createDefaultProjectContent } from '../lib/defaultProjectContent'

function seedAiProfile(name: string, description = ''): AiProfile {
  const timestamp = new Date().toISOString()
  return normalizeAiProfile({
    id: createAiProfileId(),
    name,
    description,
    updatedAt: timestamp,
  })
}

interface AiProfilesState {
  aiProfiles: AiProfile[]
  addAiProfile: () => string
  updateAiProfile: (id: string, patch: AiProfilePatch) => void
  addPhaseRule: (profileId: string) => string
  updatePhaseRule: (profileId: string, ruleId: string, patch: AiBattlePhaseRulePatch) => void
  removePhaseRule: (profileId: string, ruleId: string) => void
  removeAiProfile: (id: string) => void
  getAiProfile: (id: string) => AiProfile | undefined
  replaceAll: (aiProfiles: AiProfile[]) => void
}

export const useAiProfilesStore = create<AiProfilesState>()(
  immer((set, get) => ({
    aiProfiles: createDefaultProjectContent().aiProfiles,

    addAiProfile: () => {
      const index = get().aiProfiles.length + 1
      const profile = seedAiProfile(`New AI profile ${index}`)
      set((state) => {
        state.aiProfiles.unshift(profile)
      })
      return profile.id
    },

    updateAiProfile: (id, patch) => {
      set((state) => {
        const profile = state.aiProfiles.find((entry) => entry.id === id)
        if (!profile) return

        if (patch.name !== undefined) profile.name = patch.name
        if (patch.description !== undefined) profile.description = patch.description
        if (patch.aggression !== undefined) profile.aggression = patch.aggression
        if (patch.retreatThreshold !== undefined) profile.retreatThreshold = patch.retreatThreshold
        if (patch.targetPriority !== undefined) profile.targetPriority = patch.targetPriority
        if (patch.abilityUsage !== undefined) profile.abilityUsage = patch.abilityUsage
        if (patch.retreatBehavior !== undefined) profile.retreatBehavior = patch.retreatBehavior
        if (patch.weaponPreference !== undefined) profile.weaponPreference = patch.weaponPreference
        if (patch.retreatFromMelee !== undefined) profile.retreatFromMelee = patch.retreatFromMelee
        if (patch.prioritizeAbilities !== undefined) {
          profile.prioritizeAbilities = patch.prioritizeAbilities
        }
        if (patch.abilityPriorityIds !== undefined) {
          profile.abilityPriorityIds = [...patch.abilityPriorityIds]
        }
        if (patch.phaseRules !== undefined) profile.phaseRules = patch.phaseRules
        profile.updatedAt = new Date().toISOString()
      })
    },

    addPhaseRule: (profileId) => {
      const ruleId = createAiPhaseRuleId()
      set((state) => {
        const profile = state.aiProfiles.find((entry) => entry.id === profileId)
        if (!profile) return
        const index = profile.phaseRules.length + 1
        profile.phaseRules.push(
          normalizeAiBattlePhaseRule({
            id: ruleId,
            label: `Phase ${index}`,
            hpThresholdMax: 50,
          }),
        )
        profile.updatedAt = new Date().toISOString()
      })
      return ruleId
    },

    updatePhaseRule: (profileId, ruleId, patch) => {
      set((state) => {
        const profile = state.aiProfiles.find((entry) => entry.id === profileId)
        if (!profile) return
        const rule = profile.phaseRules.find((entry) => entry.id === ruleId)
        if (!rule) return

        if (patch.label !== undefined) rule.label = patch.label
        if (patch.hpThresholdMax !== undefined) rule.hpThresholdMax = patch.hpThresholdMax
        if (patch.targetPriority !== undefined) rule.targetPriority = patch.targetPriority
        if (patch.abilityUsage !== undefined) rule.abilityUsage = patch.abilityUsage
        if (patch.retreatBehavior !== undefined) rule.retreatBehavior = patch.retreatBehavior
        if (patch.weaponPreference !== undefined) rule.weaponPreference = patch.weaponPreference
        if (patch.retreatFromMelee !== undefined) rule.retreatFromMelee = patch.retreatFromMelee
        if (patch.prioritizeAbilities !== undefined) {
          rule.prioritizeAbilities = patch.prioritizeAbilities
        }
        profile.updatedAt = new Date().toISOString()
      })
    },

    removePhaseRule: (profileId, ruleId) => {
      set((state) => {
        const profile = state.aiProfiles.find((entry) => entry.id === profileId)
        if (!profile) return
        profile.phaseRules = profile.phaseRules.filter((entry) => entry.id !== ruleId)
        profile.updatedAt = new Date().toISOString()
      })
    },

    removeAiProfile: (id) => {
      set((state) => {
        state.aiProfiles = state.aiProfiles.filter((entry) => entry.id !== id)
      })
    },

    getAiProfile: (id) => get().aiProfiles.find((entry) => entry.id === id),

    replaceAll: (aiProfiles) => {
      set((state) => {
        state.aiProfiles = aiProfiles.map((profile) => normalizeAiProfile(profile))
      })
    },
  })),
)

export { createDefaultAiProfiles }
