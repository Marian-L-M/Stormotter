import type { AbilityDefinition } from '../admin/abilityTypes'
import type { AttributeDefinition } from '../admin/attributeTypes'
import type { CharacterClass } from '../admin/characterClassTypes'
import type { QuestReward } from '../admin/questTypes'
import type { CharacterProgression, LevelUpEvent } from '../admin/progressionTypes'
import {
  applyExperienceToClass,
  spendAbilityPoint,
  spendAttributePoint,
  syncLegacyLevelFields,
} from '../admin/progressionUtils'
import { useCharacterClassesStore } from '../store/characterClassesStore'
import { useCharacterMetaStore } from '../store/characterMetaStore'

function buildClassById(): Record<string, CharacterClass | undefined> {
  const classes = useCharacterClassesStore.getState().characterClasses
  return Object.fromEntries(classes.map((entry) => [entry.id, entry]))
}

export interface ApplyCharacterExperienceResult {
  progression: CharacterProgression
  level: number
  classId: string | null
  events: LevelUpEvent[]
}

export function applyCharacterExperience(
  characterId: string,
  classId: string,
  amount: number,
): ApplyCharacterExperienceResult {
  const metaStore = useCharacterMetaStore.getState()
  const meta = metaStore.getMeta(characterId)
  const classById = buildClassById()
  const result = applyExperienceToClass(meta.progression, classId, amount, classById)
  const legacy = syncLegacyLevelFields(result.progression)
  metaStore.updateMeta(characterId, {
    progression: result.progression,
    level: legacy.level,
    classId: legacy.classId,
  })
  if (result.events.length > 0) {
    notifyWearerLevelUp(characterId, result.events)
  }
  return { ...result, ...legacy }
}

export function applyQuestExperienceRewards(
  characterId: string,
  classId: string,
  rewards: QuestReward[],
): ApplyCharacterExperienceResult | null {
  const totalXp = rewards
    .filter((reward) => reward.kind === 'experience')
    .reduce((sum, reward) => sum + (reward.experienceAmount ?? 0), 0)
  if (totalXp <= 0) return null
  return applyCharacterExperience(characterId, classId, totalXp)
}

/** Stub for Gameotter — item triggers with on_wearer_level_up fire after level-up events. */
export function notifyWearerLevelUp(_characterId: string, _events: LevelUpEvent[]): void {
  // Runtime hook for Gameotter; no-op in Motherotter editor.
}

export function spendCharacterAbilityPoint(
  characterId: string,
  definition: AbilityDefinition,
): boolean {
  const metaStore = useCharacterMetaStore.getState()
  const meta = metaStore.getMeta(characterId)
  const classById = buildClassById()
  const next = spendAbilityPoint(meta.progression, definition, classById)
  if (!next) return false
  metaStore.updateMeta(characterId, { progression: next })
  return true
}

export function spendCharacterAttributePoint(
  characterId: string,
  definition: AttributeDefinition,
): boolean {
  const metaStore = useCharacterMetaStore.getState()
  const meta = metaStore.getMeta(characterId)
  const classById = buildClassById()
  const next = spendAttributePoint(meta.progression, definition, classById)
  if (!next) return false
  metaStore.updateMeta(characterId, { progression: next })
  return true
}

export function setCharacterProgression(
  characterId: string,
  progression: CharacterProgression,
): void {
  const legacy = syncLegacyLevelFields(progression)
  useCharacterMetaStore.getState().updateMeta(characterId, {
    progression,
    level: legacy.level,
    classId: legacy.classId,
  })
}
