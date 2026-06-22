import type { AbilityDefinition, LevelAbilityBindingGrant } from './abilityTypes'
import type { AttributeDefinition, AttributeValue, LevelAttributeGrant } from './attributeTypes'
import type { AiProfile } from './aiProfileTypes'
import {
  AI_ABILITY_USAGE_LABELS,
  AI_WEAPON_PREFERENCE_LABELS,
  resolveAiBehaviorAtHp,
  summarizeAiProfile,
  type ResolvedAiBehavior,
} from './aiProfileTypes'
import type { CharacterClass } from './characterClassTypes'
import type { Container } from './containerTypes'
import { combineLevelHitPoints, normalizeHitPointOverride, normalizeHitPointSource } from './diceTypes'
import { resolveDerivedStats } from './derivedStatResolver'
import type { CharacterLineageType } from './lineageTypes'
import type { Item } from './itemTypes'
import { totalCharacterLevel } from './progressionTypes'
import type { CharacterMeta } from '../store/characterMetaStore'

export interface FightCombatantInput {
  characterId: string
  title: string
  meta: CharacterMeta
  lineageType: CharacterLineageType | undefined
  characterClass: CharacterClass | undefined
  characterClasses: CharacterClass[]
  aiProfile: AiProfile | undefined
  attributeDefinitions: AttributeDefinition[]
  entityValues: Record<string, Record<string, AttributeValue>>
  levelAttributeGrants: Record<string, LevelAttributeGrant[]>
  abilityDefinitions: AbilityDefinition[]
  levelAbilityGrants: Record<string, LevelAbilityBindingGrant[]>
  containers: Container[]
  items: Item[]
}

export interface FightCombatantSnapshot {
  characterId: string
  title: string
  maxHp: number
  armorClass: number
  meleeAttack: number
  rangedAttack: number
  attacksPerRound: number
  aiProfileName: string | null
  aiSummary: string | null
}

export interface FightPreviewLogEntry {
  round: number
  message: string
}

export interface FightPreviewResult {
  winnerId: string | null
  rounds: number
  log: FightPreviewLogEntry[]
  sideA: { startHp: number; endHp: number }
  sideB: { startHp: number; endHp: number }
}

function diceAverage(count: number, sides: number): number {
  if (count <= 0 || sides <= 0) return 0
  return (count * (sides + 1)) / 2
}

function resolveMaxHp(input: FightCombatantInput): number {
  const source = normalizeHitPointSource(input.meta.hitPointSource)
  if (source === 'override') {
    const override = normalizeHitPointOverride(input.meta.hitPointOverride)
    if (override !== null) return override
  }

  const level = totalCharacterLevel(input.meta.progression)
  const summary = combineLevelHitPoints(
    level,
    input.characterClass?.hitDice,
    input.lineageType?.hitPointBonusDice,
  )
  if (summary.parts.length === 0) return 10

  const average = summary.parts.reduce(
    (sum, roll) => sum + diceAverage(roll.count, roll.sides),
    0,
  )
  return Math.max(1, Math.round(average))
}

export function resolveFightCombatant(input: FightCombatantInput): FightCombatantSnapshot {
  const derived = resolveDerivedStats({
    characterId: input.characterId,
    meta: input.meta,
    lineageType: input.lineageType,
    characterClass: input.characterClass,
    characterClasses: input.characterClasses,
    attributeDefinitions: input.attributeDefinitions,
    entityValues: input.entityValues,
    levelAttributeGrants: input.levelAttributeGrants,
    abilityDefinitions: input.abilityDefinitions,
    levelAbilityGrants: input.levelAbilityGrants,
    containers: input.containers,
    items: input.items,
  })

  return {
    characterId: input.characterId,
    title: input.title,
    maxHp: resolveMaxHp(input),
    armorClass: Math.round(derived.stats.armor_class.total),
    meleeAttack: Math.round(derived.stats.base_attack_melee.total),
    rangedAttack: Math.round(derived.stats.base_attack_ranged.total),
    attacksPerRound: Math.max(1, Math.round(derived.stats.attacks_per_round.total)),
    aiProfileName: input.aiProfile?.name ?? null,
    aiSummary: input.aiProfile ? summarizeAiProfile(input.aiProfile) : null,
  }
}

function rollD20(): number {
  return Math.floor(Math.random() * 20) + 1
}

function chooseAttackBonus(
  attacker: FightCombatantSnapshot,
  behavior: ResolvedAiBehavior,
): { bonus: number; mode: 'melee' | 'ranged' } {
  switch (behavior.weaponPreference) {
    case 'ranged':
      return { bonus: attacker.rangedAttack, mode: 'ranged' }
    case 'melee':
      return { bonus: attacker.meleeAttack, mode: 'melee' }
    case 'adaptive':
    default:
      return attacker.rangedAttack > attacker.meleeAttack
        ? { bonus: attacker.rangedAttack, mode: 'ranged' }
        : { bonus: attacker.meleeAttack, mode: 'melee' }
  }
}

function shouldUseAbility(behavior: ResolvedAiBehavior, hpPercent: number): boolean {
  if (behavior.abilityPriorityIds.length > 0) return true
  if (!behavior.prioritizeAbilities) return false
  switch (behavior.abilityUsage) {
    case 'aggressive':
      return true
    case 'support_first':
      return hpPercent > 50
    case 'conservative':
      return hpPercent <= 30
    case 'balanced':
    default:
      return hpPercent <= 60
  }
}

function pickAbilityLabel(
  behavior: ResolvedAiBehavior,
  abilityNamesById: Record<string, string>,
): string | null {
  for (const definitionId of behavior.abilityPriorityIds) {
    const name = abilityNamesById[definitionId]
    if (name) return name
  }
  return null
}

function averageDamage(attacker: FightCombatantSnapshot, mode: 'melee' | 'ranged'): number {
  const base = mode === 'ranged' ? attacker.rangedAttack : attacker.meleeAttack
  return Math.max(1, Math.round(4 + base * 0.3))
}

function describeAiIntent(behavior: ResolvedAiBehavior): string {
  const target = behavior.targetPriority.replace('_', ' ')
  const weapon = AI_WEAPON_PREFERENCE_LABELS[behavior.weaponPreference].split(' — ')[0]
  const parts = [
    AI_ABILITY_USAGE_LABELS[behavior.abilityUsage].split(' — ')[0],
    weapon,
    `targets ${target}`,
  ]
  if (behavior.retreatFromMelee) parts.push('avoids melee')
  return ` (${parts.join(', ')})`
}

export function runFightPreview(options: {
  sideA: FightCombatantSnapshot
  sideB: FightCombatantSnapshot
  profileA: AiProfile | undefined
  profileB: AiProfile | undefined
  abilityNamesById?: Record<string, string>
  maxRounds?: number
}): FightPreviewResult {
  const maxRounds = options.maxRounds ?? 20
  const abilityNamesById = options.abilityNamesById ?? {}
  let hpA = options.sideA.maxHp
  let hpB = options.sideB.maxHp
  const startA = hpA
  const startB = hpB
  const log: FightPreviewLogEntry[] = []
  let round = 0
  let winnerId: string | null = null

  log.push({
    round: 0,
    message: `${options.sideA.title} (${hpA} HP, AC ${options.sideA.armorClass}) vs ${options.sideB.title} (${hpB} HP, AC ${options.sideB.armorClass})`,
  })

  while (round < maxRounds && hpA > 0 && hpB > 0) {
    round += 1

    for (const [attacker, defender, profile] of [
      [options.sideA, options.sideB, options.profileA] as const,
      [options.sideB, options.sideA, options.profileB] as const,
    ]) {
      if (hpA <= 0 || hpB <= 0) break

      const attackerHp = attacker.characterId === options.sideA.characterId ? hpA : hpB
      const hpPercent = Math.round((attackerHp / attacker.maxHp) * 100)
      const behavior = profile ? resolveAiBehaviorAtHp(profile, hpPercent) : null
      const intent = behavior ? describeAiIntent(behavior) : ''

      if (behavior?.retreatFromMelee) {
        log.push({
          round,
          message: `${attacker.title} keeps distance / retreats from melee${intent}`,
        })
      }

      if (behavior && behavior.retreatBehavior === 'low_hp') {
        if (hpPercent <= behavior.retreatThreshold) {
          log.push({
            round,
            message: `${attacker.title} considers retreating (${hpPercent}% HP)${intent}`,
          })
        }
      }

      if (behavior && shouldUseAbility(behavior, hpPercent)) {
        const abilityName = pickAbilityLabel(behavior, abilityNamesById)
        log.push({
          round,
          message: abilityName
            ? `${attacker.title} uses ${abilityName}${intent}`
            : `${attacker.title} uses an ability${intent}`,
        })
      }

      const attack = behavior
        ? chooseAttackBonus(attacker, behavior)
        : { bonus: attacker.meleeAttack, mode: 'melee' as const }
      const { bonus, mode } = attack
      const roll = rollD20()
      const total = roll + bonus
      const targetAc = defender.armorClass

      if (total >= targetAc) {
        const damage = averageDamage(attacker, mode)
        if (defender.characterId === options.sideA.characterId) {
          hpA = Math.max(0, hpA - damage)
        } else {
          hpB = Math.max(0, hpB - damage)
        }
        log.push({
          round,
          message: `${attacker.title} hits with ${mode} attack (${roll}+${bonus}=${total} vs AC ${targetAc}) for ${damage} damage${intent}`,
        })
      } else {
        log.push({
          round,
          message: `${attacker.title} misses with ${mode} attack (${roll}+${bonus}=${total} vs AC ${targetAc})${intent}`,
        })
      }
    }
  }

  if (hpA <= 0 && hpB <= 0) {
    winnerId = null
    log.push({ round, message: 'Mutual knockout — draw.' })
  } else if (hpA <= 0) {
    winnerId = options.sideB.characterId
    log.push({ round, message: `${options.sideB.title} wins.` })
  } else if (hpB <= 0) {
    winnerId = options.sideA.characterId
    log.push({ round, message: `${options.sideA.title} wins.` })
  } else {
    log.push({ round, message: `Fight stopped after ${maxRounds} rounds — no winner.` })
  }

  return {
    winnerId,
    rounds: round,
    log,
    sideA: { startHp: startA, endHp: hpA },
    sideB: { startHp: startB, endHp: hpB },
  }
}
