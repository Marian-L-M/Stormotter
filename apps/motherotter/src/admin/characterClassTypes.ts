import {
  createDefaultHitDice,
  normalizeDiceRoll,
  type DiceRoll,
} from './diceTypes'
import {
  normalizeLevelAbilityGrants,
  type LevelAbilityGrant,
} from './levelGrantTypes'
import { normalizeSlotRules, type SlotRulesMap } from './slotRules'
import {
  normalizeDerivedStatBaseMap,
  normalizeDerivedStatModifierMap,
  type DerivedStatBaseMap,
  type DerivedStatModifierMap,
} from './derivedStatTypes'
import {
  normalizeEntityRendererSettings,
  type EntityRendererSettings,
} from './entityRendererTypes'

export interface CharacterClass {
  id: string
  name: string
  description: string
  /** BG2-style per-level hit die (e.g. 1d10 for warrior) */
  hitDice: DiceRoll
  /** Role traits, proficiencies, or combat style notes */
  distinctFeatures: string[]
  /** Abilities granted at specific levels */
  levelAbilities: LevelAbilityGrant[]
  /** Slot enable/disable overrides (null = enabled by default) */
  slotRules: SlotRulesMap
  /** Whether hidden inventory can activate unequipped items (null = default false) */
  hiddenInventoryActivatesUnequipped: boolean | null
  /** Derived stat base overrides (null per stat = inherit) */
  derivedStatBases: DerivedStatBaseMap
  /** Flat bonuses applied to derived stats for this class */
  derivedStatModifiers: DerivedStatModifierMap
  /** Per-render-engine map appearance overrides */
  renderer: EntityRendererSettings
  updatedAt: string
}

export interface CharacterClassListItem {
  id: string
  title: string
  category: string
  updatedAt: string
  subtitle?: string
  characterClass: CharacterClass
}

export type CharacterClassPatch = Partial<
  Pick<
    CharacterClass,
    | 'name'
    | 'description'
    | 'hitDice'
    | 'distinctFeatures'
    | 'levelAbilities'
    | 'slotRules'
    | 'hiddenInventoryActivatesUnequipped'
    | 'derivedStatBases'
    | 'derivedStatModifiers'
    | 'renderer'
  >
>

export function normalizeCharacterClass(
  raw: Partial<CharacterClass> & { abilityIds?: string[] },
): CharacterClass {
  return {
    id: raw.id ?? '',
    name: raw.name ?? '',
    description: raw.description ?? '',
    hitDice: normalizeDiceRoll(raw.hitDice ?? createDefaultHitDice(8)),
    distinctFeatures: raw.distinctFeatures ?? [],
    levelAbilities: normalizeLevelAbilityGrants(raw.levelAbilities, raw.abilityIds),
    slotRules: normalizeSlotRules(raw.slotRules),
    hiddenInventoryActivatesUnequipped:
      raw.hiddenInventoryActivatesUnequipped === true ||
      raw.hiddenInventoryActivatesUnequipped === false
        ? raw.hiddenInventoryActivatesUnequipped
        : null,
    derivedStatBases: normalizeDerivedStatBaseMap(raw.derivedStatBases),
    derivedStatModifiers: normalizeDerivedStatModifierMap(raw.derivedStatModifiers),
    renderer: normalizeEntityRendererSettings(raw.renderer, 'C'),
    updatedAt: raw.updatedAt ?? new Date().toISOString(),
  }
}

export function migrateLegacyCharacterClassId(id: string): string {
  if (id.startsWith('cclass-')) return id
  if (id.startsWith('class-')) return `cclass-${id.slice(6)}`
  return id
}
