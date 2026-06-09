import {
  DEFAULT_MECHANICS_REGISTRY,
  findRegistryEntry,
  type MechanicsRegistry,
  type RegistryEntry,
} from './registry.js'

export type AttributeBindingKind =
  | 'none'
  | 'damage_resistance'
  | 'damage_vulnerability'
  | 'stat_modifier'
  | 'save_bonus'
  | 'custom'

export type ValueKind = 'ratio' | 'integer' | 'boolean' | 'text' | 'dice'

export type StackingRule = 'add' | 'subtract' | 'set' | 'max' | 'multiply' | 'or' | 'join'

/** Stacking rules for damage attributes (logical and/or handled elsewhere). */
export const DAMAGE_STACKING_RULES = ['add', 'subtract', 'set'] as const satisfies readonly StackingRule[]

export type DamageStackingRule = (typeof DAMAGE_STACKING_RULES)[number]

export const DAMAGE_STACKING_RULE_LABELS: Record<DamageStackingRule, string> = {
  add: 'Add values',
  subtract: 'Subtract values',
  set: 'Set (use last value)',
}

export interface AttributeBinding {
  kind: AttributeBindingKind
  damageTypeId: string | null
  statId: string | null
  saveTypeId: string | null
  handlerId: string | null
  valueKind: ValueKind
  stacking: StackingRule
}

export const ATTRIBUTE_BINDING_KIND_LABELS: Record<AttributeBindingKind, string> = {
  none: 'None (display / narrative only)',
  damage_resistance: 'Damage resistance',
  damage_vulnerability: 'Damage vulnerability',
  stat_modifier: 'Stat modifier',
  save_bonus: 'Save bonus',
  custom: 'Custom handler',
}

export const VALUE_KIND_LABELS: Record<ValueKind, string> = {
  ratio: 'Ratio (0–100% stored as percentile)',
  integer: 'Integer',
  boolean: 'Boolean',
  text: 'Text',
  dice: 'Dice (N×dS)',
}

export const STACKING_RULE_LABELS: Record<StackingRule, string> = {
  add: 'Add values',
  subtract: 'Subtract values',
  set: 'Set (use last value)',
  max: 'Take maximum',
  multiply: 'Multiply values',
  or: 'Logical OR (any true)',
  join: 'Join text',
}

export function createEmptyBinding(): AttributeBinding {
  return {
    kind: 'none',
    damageTypeId: null,
    statId: null,
    saveTypeId: null,
    handlerId: null,
    valueKind: 'integer',
    stacking: 'add',
  }
}

export function defaultBindingForKind(kind: AttributeBindingKind): AttributeBinding {
  switch (kind) {
    case 'damage_resistance':
    case 'damage_vulnerability':
      return {
        kind,
        damageTypeId: DEFAULT_MECHANICS_REGISTRY.damageTypes[0]?.id ?? 'fire',
        statId: null,
        saveTypeId: null,
        handlerId: null,
        valueKind: 'ratio',
        stacking: 'add',
      }
    case 'stat_modifier':
      return {
        kind,
        damageTypeId: null,
        statId: DEFAULT_MECHANICS_REGISTRY.stats[0]?.id ?? 'strength',
        saveTypeId: null,
        handlerId: null,
        valueKind: 'integer',
        stacking: 'add',
      }
    case 'save_bonus':
      return {
        kind,
        damageTypeId: null,
        statId: null,
        saveTypeId: DEFAULT_MECHANICS_REGISTRY.saveTypes[0]?.id ?? 'spell',
        handlerId: null,
        valueKind: 'integer',
        stacking: 'add',
      }
    case 'custom':
      return {
        kind,
        damageTypeId: null,
        statId: null,
        saveTypeId: null,
        handlerId: '',
        valueKind: 'integer',
        stacking: 'add',
      }
    case 'none':
    default:
      return createEmptyBinding()
  }
}

export function normalizeAttributeBinding(raw: Partial<AttributeBinding> | null | undefined): AttributeBinding {
  const kind = isBindingKind(raw?.kind) ? raw.kind : 'none'
  const defaults = defaultBindingForKind(kind)

  return {
    kind,
    damageTypeId:
      kind === 'damage_resistance' || kind === 'damage_vulnerability'
        ? validateRegistryId(raw?.damageTypeId, DEFAULT_MECHANICS_REGISTRY.damageTypes, defaults.damageTypeId)
        : null,
    statId:
      kind === 'stat_modifier'
        ? validateRegistryId(raw?.statId, DEFAULT_MECHANICS_REGISTRY.stats, defaults.statId)
        : null,
    saveTypeId:
      kind === 'save_bonus'
        ? validateRegistryId(raw?.saveTypeId, DEFAULT_MECHANICS_REGISTRY.saveTypes, defaults.saveTypeId)
        : null,
    handlerId: kind === 'custom' ? String(raw?.handlerId ?? '').trim() : null,
    valueKind: isValueKind(raw?.valueKind) ? raw.valueKind : defaults.valueKind,
    stacking: isStackingRule(raw?.stacking) ? raw.stacking : defaults.stacking,
  }
}

function validateRegistryId(
  raw: string | null | undefined,
  entries: RegistryEntry[],
  fallback: string | null,
): string | null {
  const id = typeof raw === 'string' && raw.length > 0 ? raw : fallback
  if (!id) return null
  return findRegistryEntry(entries, id) ? id : fallback
}

export function isMechanicBinding(binding: AttributeBinding | null | undefined): boolean {
  return Boolean(binding && binding.kind !== 'none')
}

export function formatAttributeBinding(
  binding: AttributeBinding | null | undefined,
  registry: MechanicsRegistry = DEFAULT_MECHANICS_REGISTRY,
): string {
  const normalized = normalizeAttributeBinding(binding)
  if (normalized.kind === 'none') return '—'

  switch (normalized.kind) {
    case 'damage_resistance':
    case 'damage_vulnerability': {
      const damageType = findRegistryEntry(registry.damageTypes, normalized.damageTypeId ?? undefined)
      const prefix = normalized.kind === 'damage_resistance' ? 'Resist' : 'Vulnerable'
      return `${prefix} ${damageType?.name ?? normalized.damageTypeId ?? '?'}`
    }
    case 'stat_modifier': {
      const stat = findRegistryEntry(registry.stats, normalized.statId ?? undefined)
      return `Mod ${stat?.name ?? normalized.statId ?? '?'}`
    }
    case 'save_bonus': {
      const save = findRegistryEntry(registry.saveTypes, normalized.saveTypeId ?? undefined)
      return `Save ${save?.name ?? normalized.saveTypeId ?? '?'}`
    }
    case 'custom':
      return normalized.handlerId ? `Custom: ${normalized.handlerId}` : 'Custom handler'
    default:
      return '—'
  }
}

export function slugifyAttributeKey(raw: string): string {
  const slug = raw
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 64)
  return slug || 'attribute'
}

export function normalizeAttributeKey(raw: string | undefined, fallbackName: string, usedKeys: Set<string>): string {
  const base = slugifyAttributeKey(raw?.trim() || fallbackName)
  if (!usedKeys.has(base)) return base

  let index = 2
  while (usedKeys.has(`${base}_${index}`)) {
    index += 1
  }
  return `${base}_${index}`
}

function isBindingKind(value: string | undefined): value is AttributeBindingKind {
  return (
    value === 'none' ||
    value === 'damage_resistance' ||
    value === 'damage_vulnerability' ||
    value === 'stat_modifier' ||
    value === 'save_bonus' ||
    value === 'custom'
  )
}

function isValueKind(value: string | undefined): value is ValueKind {
  return (
    value === 'ratio' ||
    value === 'integer' ||
    value === 'boolean' ||
    value === 'text' ||
    value === 'dice'
  )
}

function isStackingRule(value: string | undefined): value is StackingRule {
  return (
    value === 'add' ||
    value === 'subtract' ||
    value === 'set' ||
    value === 'max' ||
    value === 'multiply' ||
    value === 'or' ||
    value === 'join'
  )
}
