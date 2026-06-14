import type { LineageStatKey } from './lineageTypes'

export const DERIVED_STAT_KEYS = [
  'base_attack_melee',
  'base_attack_ranged',
  'armor_class',
  'to_hit',
  'block_melee',
  'block_ranged',
  'movement_speed',
  'attacks_per_round',
  'initiative',
  'magic_resistance',
  'lore',
  'carry_weight',
  'spell_power',
  'divine_power',
  'mental_fortitude',
  'analysis',
  'empathy',
  'find_hidden',
  'detect_illusion',
  'save_fortitude',
  'save_reflex',
  'save_will',
  'save_spell',
  'save_breath',
  'save_death',
  'save_stunning',
  'save_polymorph',
  'save_charisma',
  'save_luck',
] as const

export type DerivedStatKey = (typeof DERIVED_STAT_KEYS)[number]

export type DerivedStatGroup = 'combat' | 'utility' | 'saving_throw'

export const DERIVED_STAT_GROUP_LABELS: Record<DerivedStatGroup, string> = {
  combat: 'Combat & defense',
  utility: 'Utility',
  saving_throw: 'Saving throws',
}

export const DERIVED_STAT_LABELS: Record<DerivedStatKey, string> = {
  base_attack_melee: 'Base Attack',
  base_attack_ranged: 'Base Attack Ranged',
  armor_class: 'Armor Class',
  to_hit: 'To Hit',
  block_melee: 'Block Melee',
  block_ranged: 'Block Ranged',
  movement_speed: 'Movement Speed',
  attacks_per_round: 'Attacks per Round',
  initiative: 'Initiative',
  magic_resistance: 'Magic Resistance',
  lore: 'Lore',
  carry_weight: 'Carry Weight',
  spell_power: 'Spell Power',
  divine_power: 'Divine Power',
  mental_fortitude: 'Mental Fortitude',
  analysis: 'Analysis',
  empathy: 'Empathy',
  find_hidden: 'Find Hidden',
  detect_illusion: 'Detect Illusion',
  save_fortitude: 'Fortitude',
  save_reflex: 'Reflex',
  save_will: 'Will',
  save_spell: 'Spell',
  save_breath: 'Breath Weapon',
  save_death: 'Death Magic',
  save_stunning: 'Stunning',
  save_polymorph: 'Polymorph',
  save_charisma: 'Charisma',
  save_luck: 'Luck',
}

export const DERIVED_STAT_HINTS: Record<DerivedStatKey, string> = {
  base_attack_melee: 'Melee attack bonus before equipment and situational modifiers.',
  base_attack_ranged: 'Ranged attack bonus before equipment and situational modifiers.',
  armor_class: 'Difficulty to land a hit; typically includes dexterity.',
  to_hit: 'General attack roll bonus (often overlaps with weapon-specific attack).',
  block_melee: 'Damage reduction or deflection against melee attacks (shields, parry).',
  block_ranged: 'Damage reduction or deflection against ranged attacks (shields, cover).',
  movement_speed: 'Distance moved per round in game units (default 30 ft).',
  attacks_per_round: 'Number of attack actions available each round.',
  initiative: 'Turn order in combat (dexterity-based).',
  magic_resistance: 'Resistance to hostile magic before situational bonuses.',
  lore: 'Knowledge and recall checks (intelligence-based).',
  carry_weight: 'Maximum encumbrance in weight units (strength-based).',
  spell_power: 'Arcane spell potency and spell DC (intelligence-based).',
  divine_power: 'Divine spell potency and miracle DC (wisdom-based).',
  mental_fortitude: 'Resist mental stress and manipulation (wisdom and charisma).',
  analysis: 'Deduction, puzzles, and logical reasoning (perception and intelligence).',
  empathy: 'Read motives and emotional cues (perception and charisma).',
  find_hidden: 'Spot concealed objects, doors, and creatures (perception-based).',
  detect_illusion: 'See through glamers and false images (perception and wisdom).',
  save_fortitude: 'Resist poison, disease, and physical endurance effects (constitution).',
  save_reflex: 'Dodge traps, explosions, and area effects (dexterity).',
  save_will: 'Resist fear, charm, and mental influence (wisdom and constitution).',
  save_spell: 'Resist targeted spells and magical effects (wisdom and intelligence).',
  save_breath: 'Resist dragon breath and similar cone effects (dexterity).',
  save_death: 'Resist death magic and instant-kill effects (wisdom and constitution).',
  save_stunning: 'Resist paralysis, stun, and hold effects (constitution).',
  save_polymorph: 'Resist unwanted shape change (wisdom).',
  save_charisma: 'Resist social magic, banishment, and possession (charisma).',
  save_luck: 'Resist curses, critical failures, and fate effects (luck).',
}

/** Additional concepts worth adding later. */
export const SAVING_THROW_SUGGESTIONS = [
  'Sanity / Corruption — horror or eldritch exposure (wisdom or intelligence)',
  'Concentration — maintaining spells under damage (constitution)',
] as const

export const DERIVED_STAT_SUGGESTIONS = [
  'Dodge — evasion without a shield (dexterity-based defensive bonus)',
  ...SAVING_THROW_SUGGESTIONS,
] as const

export type DerivedStatStatContribution = 'modifier' | 'score_multiplier' | null

export type DerivedStatStatCombination = 'single' | 'sum_modifiers' | 'max_modifier'

/** Maps special save derived stats to mechanics-core save type ids for attribute save_bonus stacking. */
export const DERIVED_STAT_SAVE_TYPE_IDS: Partial<Record<DerivedStatKey, string>> = {
  save_spell: 'spell',
  save_breath: 'breath',
  save_death: 'death',
  save_stunning: 'petrification',
  save_polymorph: 'polymorph',
  save_charisma: 'charisma',
  save_luck: 'luck',
}

export interface DerivedStatDefinition {
  key: DerivedStatKey
  group: DerivedStatGroup
  defaultBase: number
  linkedStats: LineageStatKey[]
  statCombination: DerivedStatStatCombination
  statContribution: DerivedStatStatContribution
  scoreMultiplier: number
}

export const DERIVED_STAT_DEFINITIONS: DerivedStatDefinition[] = [
  {
    key: 'base_attack_melee',
    group: 'combat',
    defaultBase: 0,
    linkedStats: ['strength'],
    statCombination: 'single',
    statContribution: 'modifier',
    scoreMultiplier: 1,
  },
  {
    key: 'base_attack_ranged',
    group: 'combat',
    defaultBase: 0,
    linkedStats: ['dexterity'],
    statCombination: 'single',
    statContribution: 'modifier',
    scoreMultiplier: 1,
  },
  {
    key: 'armor_class',
    group: 'combat',
    defaultBase: 10,
    linkedStats: ['dexterity'],
    statCombination: 'single',
    statContribution: 'modifier',
    scoreMultiplier: 1,
  },
  {
    key: 'to_hit',
    group: 'combat',
    defaultBase: 0,
    linkedStats: ['dexterity'],
    statCombination: 'single',
    statContribution: 'modifier',
    scoreMultiplier: 1,
  },
  {
    key: 'block_melee',
    group: 'combat',
    defaultBase: 0,
    linkedStats: [],
    statCombination: 'single',
    statContribution: null,
    scoreMultiplier: 1,
  },
  {
    key: 'block_ranged',
    group: 'combat',
    defaultBase: 0,
    linkedStats: [],
    statCombination: 'single',
    statContribution: null,
    scoreMultiplier: 1,
  },
  {
    key: 'movement_speed',
    group: 'utility',
    defaultBase: 30,
    linkedStats: [],
    statCombination: 'single',
    statContribution: null,
    scoreMultiplier: 1,
  },
  {
    key: 'attacks_per_round',
    group: 'combat',
    defaultBase: 1,
    linkedStats: [],
    statCombination: 'single',
    statContribution: null,
    scoreMultiplier: 1,
  },
  {
    key: 'initiative',
    group: 'combat',
    defaultBase: 0,
    linkedStats: ['dexterity'],
    statCombination: 'single',
    statContribution: 'modifier',
    scoreMultiplier: 1,
  },
  {
    key: 'magic_resistance',
    group: 'combat',
    defaultBase: 0,
    linkedStats: [],
    statCombination: 'single',
    statContribution: null,
    scoreMultiplier: 1,
  },
  {
    key: 'lore',
    group: 'utility',
    defaultBase: 0,
    linkedStats: ['intelligence'],
    statCombination: 'single',
    statContribution: 'modifier',
    scoreMultiplier: 1,
  },
  {
    key: 'carry_weight',
    group: 'utility',
    defaultBase: 0,
    linkedStats: ['strength'],
    statCombination: 'single',
    statContribution: 'score_multiplier',
    scoreMultiplier: 15,
  },
  {
    key: 'spell_power',
    group: 'utility',
    defaultBase: 0,
    linkedStats: ['intelligence'],
    statCombination: 'single',
    statContribution: 'modifier',
    scoreMultiplier: 1,
  },
  {
    key: 'divine_power',
    group: 'utility',
    defaultBase: 0,
    linkedStats: ['wisdom'],
    statCombination: 'single',
    statContribution: 'modifier',
    scoreMultiplier: 1,
  },
  {
    key: 'mental_fortitude',
    group: 'utility',
    defaultBase: 0,
    linkedStats: ['wisdom', 'charisma'],
    statCombination: 'sum_modifiers',
    statContribution: 'modifier',
    scoreMultiplier: 1,
  },
  {
    key: 'analysis',
    group: 'utility',
    defaultBase: 0,
    linkedStats: ['perception', 'intelligence'],
    statCombination: 'sum_modifiers',
    statContribution: 'modifier',
    scoreMultiplier: 1,
  },
  {
    key: 'empathy',
    group: 'utility',
    defaultBase: 0,
    linkedStats: ['perception', 'charisma'],
    statCombination: 'sum_modifiers',
    statContribution: 'modifier',
    scoreMultiplier: 1,
  },
  {
    key: 'find_hidden',
    group: 'utility',
    defaultBase: 0,
    linkedStats: ['perception'],
    statCombination: 'single',
    statContribution: 'modifier',
    scoreMultiplier: 1,
  },
  {
    key: 'detect_illusion',
    group: 'utility',
    defaultBase: 0,
    linkedStats: ['perception', 'wisdom'],
    statCombination: 'sum_modifiers',
    statContribution: 'modifier',
    scoreMultiplier: 1,
  },
  {
    key: 'save_fortitude',
    group: 'saving_throw',
    defaultBase: 0,
    linkedStats: ['constitution'],
    statCombination: 'single',
    statContribution: 'modifier',
    scoreMultiplier: 1,
  },
  {
    key: 'save_reflex',
    group: 'saving_throw',
    defaultBase: 0,
    linkedStats: ['dexterity'],
    statCombination: 'single',
    statContribution: 'modifier',
    scoreMultiplier: 1,
  },
  {
    key: 'save_will',
    group: 'saving_throw',
    defaultBase: 0,
    linkedStats: ['wisdom', 'constitution'],
    statCombination: 'sum_modifiers',
    statContribution: 'modifier',
    scoreMultiplier: 1,
  },
  {
    key: 'save_spell',
    group: 'saving_throw',
    defaultBase: 0,
    linkedStats: ['wisdom', 'intelligence'],
    statCombination: 'sum_modifiers',
    statContribution: 'modifier',
    scoreMultiplier: 1,
  },
  {
    key: 'save_breath',
    group: 'saving_throw',
    defaultBase: 0,
    linkedStats: ['dexterity'],
    statCombination: 'single',
    statContribution: 'modifier',
    scoreMultiplier: 1,
  },
  {
    key: 'save_death',
    group: 'saving_throw',
    defaultBase: 0,
    linkedStats: ['wisdom', 'constitution'],
    statCombination: 'sum_modifiers',
    statContribution: 'modifier',
    scoreMultiplier: 1,
  },
  {
    key: 'save_stunning',
    group: 'saving_throw',
    defaultBase: 0,
    linkedStats: ['constitution'],
    statCombination: 'single',
    statContribution: 'modifier',
    scoreMultiplier: 1,
  },
  {
    key: 'save_polymorph',
    group: 'saving_throw',
    defaultBase: 0,
    linkedStats: ['wisdom'],
    statCombination: 'single',
    statContribution: 'modifier',
    scoreMultiplier: 1,
  },
  {
    key: 'save_charisma',
    group: 'saving_throw',
    defaultBase: 0,
    linkedStats: ['charisma'],
    statCombination: 'single',
    statContribution: 'modifier',
    scoreMultiplier: 1,
  },
  {
    key: 'save_luck',
    group: 'saving_throw',
    defaultBase: 0,
    linkedStats: ['luck'],
    statCombination: 'single',
    statContribution: 'modifier',
    scoreMultiplier: 1,
  },
]

export const DERIVED_STAT_DEFINITION_BY_KEY = Object.fromEntries(
  DERIVED_STAT_DEFINITIONS.map((entry) => [entry.key, entry]),
) as Record<DerivedStatKey, DerivedStatDefinition>

export const DERIVED_STAT_DEFAULT_BASES = Object.fromEntries(
  DERIVED_STAT_DEFINITIONS.map((entry) => [entry.key, entry.defaultBase]),
) as Record<DerivedStatKey, number>

export const DERIVED_STAT_GROUP_ORDER: DerivedStatGroup[] = ['combat', 'utility', 'saving_throw']

export function groupDerivedStatKeys(): { group: DerivedStatGroup; keys: DerivedStatKey[] }[] {
  return DERIVED_STAT_GROUP_ORDER.map((group) => ({
    group,
    keys: DERIVED_STAT_DEFINITIONS.filter((entry) => entry.group === group).map((entry) => entry.key),
  })).filter((entry) => entry.keys.length > 0)
}

export function formatDerivedStatLinkedStats(definition: DerivedStatDefinition): string | null {
  if (definition.linkedStats.length === 0) return null
  if (definition.statCombination === 'sum_modifiers' && definition.linkedStats.length > 1) {
    return definition.linkedStats.join(' + ')
  }
  return definition.linkedStats[0] ?? null
}

/** null = inherit from more general layer (character → class → type → system default) */
export type DerivedStatBaseMap = Partial<Record<DerivedStatKey, number | null>>

/** Explicit numeric bonuses on an entity (additive across type, class, character, items, etc.) */
export type DerivedStatModifierMap = Partial<Record<DerivedStatKey, number>>

export const DERIVED_STAT_HANDLER_PREFIX = 'derived_stat:'

const LEGACY_DERIVED_STAT_KEY_ALIASES: Record<string, DerivedStatKey> = {
  save_petrification: 'save_stunning',
  perception: 'find_hidden',
}

function migrateLegacyDerivedStatKey(key: string): DerivedStatKey | null {
  if (isDerivedStatKey(key)) return key
  const migrated = LEGACY_DERIVED_STAT_KEY_ALIASES[key]
  return migrated ?? null
}

function migrateLegacyDerivedStatMap<T extends number | null>(
  raw: Record<string, T | undefined> | undefined,
): Partial<Record<DerivedStatKey, T>> {
  if (!raw) return {}
  const migrated: Partial<Record<DerivedStatKey, T>> = {}
  for (const [key, value] of Object.entries(raw)) {
    const normalizedKey = migrateLegacyDerivedStatKey(key)
    if (!normalizedKey || value === undefined) continue
    if (migrated[normalizedKey] === undefined) {
      migrated[normalizedKey] = value
    }
  }
  return migrated
}

export function isDerivedStatKey(value: string): value is DerivedStatKey {
  return (DERIVED_STAT_KEYS as readonly string[]).includes(value)
}

export function resolveDerivedStatKey(key: string): DerivedStatKey | null {
  return migrateLegacyDerivedStatKey(key)
}

export function abilityScoreModifier(score: number | null | undefined): number {
  if (score === null || score === undefined || !Number.isFinite(score)) return 0
  return Math.floor((score - 10) / 2)
}

export function normalizeDerivedStatBaseMap(raw: Partial<DerivedStatBaseMap> | undefined): DerivedStatBaseMap {
  const migrated = migrateLegacyDerivedStatMap(raw as Record<string, number | null | undefined>)
  if (!raw && Object.keys(migrated).length === 0) return {}
  const normalized: DerivedStatBaseMap = {}
  for (const key of DERIVED_STAT_KEYS) {
    const value = migrated[key]
    if (value === null) {
      normalized[key] = null
    } else if (value !== undefined && Number.isFinite(value)) {
      normalized[key] = value
    }
  }
  return normalized
}

export function normalizeDerivedStatModifierMap(
  raw: Partial<DerivedStatModifierMap> | undefined,
): DerivedStatModifierMap {
  const migrated = migrateLegacyDerivedStatMap(raw as Record<string, number | undefined>)
  if (!raw && Object.keys(migrated).length === 0) return {}
  const normalized: DerivedStatModifierMap = {}
  for (const key of DERIVED_STAT_KEYS) {
    const value = migrated[key]
    if (value !== undefined && Number.isFinite(value)) {
      normalized[key] = value
    }
  }
  return normalized
}

export function resolveDerivedStatBase(
  key: DerivedStatKey,
  characterBases: DerivedStatBaseMap,
  classBases: DerivedStatBaseMap,
  typeBases: DerivedStatBaseMap,
): number {
  for (const map of [characterBases, classBases, typeBases]) {
    const value = map[key]
    if (value !== null && value !== undefined && Number.isFinite(value)) {
      return value
    }
  }
  return DERIVED_STAT_DEFAULT_BASES[key]
}

export function getDerivedStatModifierTotal(
  key: DerivedStatKey,
  ...maps: DerivedStatModifierMap[]
): number {
  return maps.reduce((sum, map) => {
    const value = map[key]
    return sum + (Number.isFinite(value) ? value! : 0)
  }, 0)
}
