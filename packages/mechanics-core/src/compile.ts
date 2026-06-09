import { normalizeAttributeBinding, type AttributeBinding, type StackingRule, type ValueKind } from './bindings.js'
import {
  mechanicFromLegacyBinding,
  resolveCompositionToBinding,
  type MechanicComposition,
} from './composition.js'

export type EngineScalar = number | boolean | string

export interface AttributeDefinitionLike {
  id: string
  key: string
  /** @deprecated Legacy binding — use mechanic */
  binding?: AttributeBinding | null
  mechanic?: MechanicComposition | null
}

export interface CompiledCombatStats {
  resistances: Record<string, number>
  vulnerabilities: Record<string, number>
  immunities: Record<string, boolean>
  statModifiers: Record<string, number>
  saveBonuses: Record<string, number>
  conditions: Record<string, EngineScalar>
  custom: Record<string, EngineScalar>
  narrative: Record<string, EngineScalar>
}

export function createEmptyCompiledCombatStats(): CompiledCombatStats {
  return {
    resistances: {},
    vulnerabilities: {},
    immunities: {},
    statModifiers: {},
    saveBonuses: {},
    conditions: {},
    custom: {},
    narrative: {},
  }
}

export function resolveDefinitionBinding(definition: AttributeDefinitionLike): AttributeBinding | null {
  if (definition.mechanic !== undefined) {
    const binding = resolveCompositionToBinding(definition.mechanic)
    if (binding) return binding
  }
  if (definition.binding !== undefined && definition.binding !== null) {
    return normalizeAttributeBinding(definition.binding)
  }
  if (definition.binding === undefined && definition.mechanic === undefined) {
    return null
  }
  return null
}

export function compileCombatStats(
  definitions: AttributeDefinitionLike[],
  stackedValuesByDefinitionId: Record<string, EngineScalar | null | undefined>,
): CompiledCombatStats {
  const result = createEmptyCompiledCombatStats()

  for (const definition of definitions) {
    const rawValue = stackedValuesByDefinitionId[definition.id]
    if (rawValue === null || rawValue === undefined) continue

    const binding = resolveDefinitionBinding(definition)
    if (!binding || binding.kind === 'none') {
      result.narrative[definition.key] = rawValue
      continue
    }

    const normalized = normalizeAttributeBinding(binding)
    const engineValue = toEngineScalar(normalized.valueKind, rawValue)
    if (engineValue === null) continue

    if (normalized.kind === 'custom' && normalized.handlerId?.startsWith('immunity:')) {
      const damageTypeId = normalized.handlerId.slice('immunity:'.length)
      if (damageTypeId) {
        result.immunities[damageTypeId] = Boolean(engineValue)
      }
      continue
    }

    if (normalized.kind === 'custom' && normalized.handlerId?.startsWith('condition:')) {
      const conditionId = normalized.handlerId.slice('condition:'.length)
      if (conditionId) {
        result.conditions[conditionId] = engineValue
      }
      continue
    }

    switch (normalized.kind) {
      case 'damage_resistance': {
        if (!normalized.damageTypeId) break
        result.resistances[normalized.damageTypeId] = clampRatio(asNumber(engineValue))
        break
      }
      case 'damage_vulnerability': {
        if (!normalized.damageTypeId) break
        result.vulnerabilities[normalized.damageTypeId] = clampRatio(asNumber(engineValue))
        break
      }
      case 'stat_modifier': {
        if (!normalized.statId) break
        result.statModifiers[normalized.statId] = asNumber(engineValue)
        break
      }
      case 'save_bonus': {
        if (!normalized.saveTypeId) break
        result.saveBonuses[normalized.saveTypeId] = asNumber(engineValue)
        break
      }
      case 'custom': {
        if (!normalized.handlerId) break
        result.custom[normalized.handlerId] = engineValue
        break
      }
      default:
        break
    }
  }

  return result
}

export function stackValuesByRule(
  stacking: StackingRule,
  valueKind: ValueKind,
  values: (EngineScalar | null | undefined)[],
): EngineScalar | null {
  const defined = values.filter((value) => value !== null && value !== undefined) as EngineScalar[]
  if (defined.length === 0) return null

  switch (stacking) {
    case 'add':
      if (valueKind === 'boolean') return defined.some((value) => value === true)
      if (valueKind === 'text') return defined.map(String).filter(Boolean).join(', ')
      return defined.reduce<number>((sum, value) => sum + asNumber(value), 0)
    case 'subtract':
      if (valueKind === 'boolean' || valueKind === 'text') return defined[defined.length - 1]!
      return defined
        .slice(1)
        .reduce<number>((acc, value) => acc - asNumber(value), asNumber(defined[0]!))
    case 'set':
      return defined[defined.length - 1]!
    case 'max':
      if (valueKind === 'boolean') return defined.some((value) => value === true)
      if (valueKind === 'text') return defined.map(String).filter(Boolean).join(', ')
      return Math.max(...defined.map((value) => asNumber(value)))
    case 'multiply':
      if (valueKind === 'boolean') return defined.some((value) => value === true)
      if (valueKind === 'text') return defined.map(String).filter(Boolean).join(', ')
      return defined.reduce<number>((product, value) => product * asNumber(value), 1)
    case 'or':
      return defined.some((value) => value === true)
    case 'join':
      return defined.map(String).filter(Boolean).join(', ')
  }
}

export function toEngineScalar(valueKind: ValueKind, raw: EngineScalar): EngineScalar | null {
  switch (valueKind) {
    case 'ratio': {
      const numeric = asNumber(raw)
      if (!Number.isFinite(numeric)) return null
      return clampRatio(numeric / 100)
    }
    case 'integer':
      return asNumber(raw)
    case 'boolean':
      return Boolean(raw)
    case 'text':
      return typeof raw === 'string' ? raw : String(raw)
    case 'dice':
      return typeof raw === 'string' ? raw : String(raw)
  }
}

export function formatCompiledCombatStats(stats: CompiledCombatStats): string[] {
  const lines: string[] = []

  for (const [damageTypeId, value] of Object.entries(stats.resistances)) {
    lines.push(`resistance.${damageTypeId}: ${Math.round(value * 100)}%`)
  }
  for (const [damageTypeId, value] of Object.entries(stats.vulnerabilities)) {
    lines.push(`vulnerability.${damageTypeId}: ${Math.round(value * 100)}%`)
  }
  for (const [damageTypeId, value] of Object.entries(stats.immunities)) {
    if (value) lines.push(`immunity.${damageTypeId}: true`)
  }
  for (const [statId, value] of Object.entries(stats.statModifiers)) {
    lines.push(`stat.${statId}: ${value >= 0 ? '+' : ''}${value}`)
  }
  for (const [saveTypeId, value] of Object.entries(stats.saveBonuses)) {
    lines.push(`save.${saveTypeId}: ${value >= 0 ? '+' : ''}${value}`)
  }
  for (const [conditionId, value] of Object.entries(stats.conditions)) {
    lines.push(`condition.${conditionId}: ${String(value)}`)
  }
  for (const [handlerId, value] of Object.entries(stats.custom)) {
    lines.push(`custom.${handlerId}: ${String(value)}`)
  }

  return lines
}

export { mechanicFromLegacyBinding }

function asNumber(value: EngineScalar): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'boolean') return value ? 1 : 0
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

function clampRatio(value: number): number {
  if (!Number.isFinite(value)) return 0
  return Math.min(1, Math.max(0, value))
}
