import type { AttributeBinding, AttributeBindingKind, StackingRule, ValueKind } from './bindings.js'
import { DAMAGE_STACKING_RULES, normalizeAttributeBinding, type DamageStackingRule } from './bindings.js'
import {
  ABILITY_TARGETS,
  ATTRIBUTE_TYPES,
  DEFAULT_CONDITIONS,
  DEFAULT_MECHANICS_REGISTRY,
  abilityActionsForEffectType,
  findDamageTypeGroup,
  findRegistryEntry,
  formatDamageTypeLabel,
  RESISTANCE_ROLES,
  validateAbilityActionId,
  validateAbilityTargetId,
  validateDamageTypeId,
  validateModifierStatId,
  validateSaveTypeId,
  validateMagicEffectId,
  validateRegistryId,
  isDerivedStatModifierId,
  DERIVED_STAT_MODIFIER_PREFIX,
  type MechanicsRegistry,
} from './registry.js'

/** Composed mechanic axes — built from attribute-type blocks in the editor. */
export interface MechanicComposition {
  effectTypeId: string | null
  damageTypeId: string | null
  resistanceRoleId: string | null
  statId: string | null
  saveTypeId: string | null
  conditionId: string | null
  customHandlerId: string | null
  /** Ability builder: how the effect is applied (cause, buff, debuff, …). */
  actionTypeId: string | null
  /** Ability builder: who or what receives the effect. */
  targetId: string | null
  valueKind: ValueKind
  stacking: StackingRule
}

export function createEmptyMechanic(): MechanicComposition {
  return {
    effectTypeId: null,
    damageTypeId: null,
    resistanceRoleId: null,
    statId: null,
    saveTypeId: null,
    conditionId: null,
    customHandlerId: null,
    actionTypeId: null,
    targetId: null,
    valueKind: 'integer',
    stacking: 'add',
  }
}

export function migrateEffectTypeId(
  raw: Partial<MechanicComposition> | null | undefined,
): string | null {
  if (!raw?.effectTypeId) return null

  if (raw.effectTypeId === 'damage' && raw.resistanceRoleId) {
    return 'resistance'
  }

  const legacyMap: Record<string, string> = {
    stat: 'modifier',
    save: 'saving_throw',
    custom: 'magic',
  }

  const migrated = legacyMap[raw.effectTypeId] ?? raw.effectTypeId
  return validateRegistryId(migrated, ATTRIBUTE_TYPES, null)
}

export function normalizeMechanicComposition(
  raw: Partial<MechanicComposition> | null | undefined,
): MechanicComposition {
  if (!raw) return createEmptyMechanic()

  const effectTypeId = migrateEffectTypeId(raw)
  const damageTypeId = validateDamageTypeId(raw.damageTypeId, null)
  const resistanceRoleId = validateRegistryId(raw.resistanceRoleId, RESISTANCE_ROLES, null)
  const statId = validateModifierStatId(raw.statId, null)
  const saveTypeId = validateSaveTypeId(raw.saveTypeId, null)
  const conditionId = validateRegistryId(raw.conditionId, DEFAULT_CONDITIONS, null)
  const customHandlerId = validateMagicEffectId(raw.customHandlerId, raw.customHandlerId?.trim() || null)

  const actionTypeId = validateAbilityActionId(raw.actionTypeId, effectTypeId, null)
  const targetId = validateAbilityTargetId(raw.targetId, null)

  const mechanic: MechanicComposition = {
    effectTypeId,
    damageTypeId,
    resistanceRoleId,
    statId,
    saveTypeId,
    conditionId,
    customHandlerId: customHandlerId && customHandlerId.length > 0 ? customHandlerId : null,
    actionTypeId,
    targetId,
    valueKind: isValueKind(raw.valueKind) ? raw.valueKind : defaultValueKindForEffect(effectTypeId, resistanceRoleId),
    stacking: isStackingRule(raw.stacking) ? raw.stacking : defaultStackingForEffect(effectTypeId),
  }

  return applyEffectTypeConstraints(mechanic)
}

export function mechanicFromLegacyBinding(binding: Partial<AttributeBinding> | null | undefined): MechanicComposition {
  const normalized = normalizeAttributeBinding(binding ?? { kind: 'none' })
  if (normalized.kind === 'none') return createEmptyMechanic()

  switch (normalized.kind) {
    case 'damage_resistance':
      return normalizeMechanicComposition({
        effectTypeId: 'resistance',
        damageTypeId: normalized.damageTypeId,
        resistanceRoleId: 'resistance',
        valueKind: normalized.valueKind,
        stacking: normalized.stacking,
      })
    case 'damage_vulnerability':
      return normalizeMechanicComposition({
        effectTypeId: 'resistance',
        damageTypeId: normalized.damageTypeId,
        resistanceRoleId: 'vulnerability',
        valueKind: normalized.valueKind,
        stacking: normalized.stacking,
      })
    case 'stat_modifier':
      return normalizeMechanicComposition({
        effectTypeId: 'modifier',
        statId: normalized.statId,
        valueKind: normalized.valueKind,
        stacking: normalized.stacking,
      })
    case 'save_bonus':
      return normalizeMechanicComposition({
        effectTypeId: 'saving_throw',
        saveTypeId: normalized.saveTypeId,
        valueKind: normalized.valueKind,
        stacking: normalized.stacking,
      })
    case 'custom':
      if (normalized.handlerId?.startsWith('condition:')) {
        return normalizeMechanicComposition({
          effectTypeId: 'condition',
          conditionId: normalized.handlerId.slice('condition:'.length),
          valueKind: normalized.valueKind,
          stacking: normalized.stacking,
        })
      }
      if (normalized.handlerId?.startsWith('damage_bonus:')) {
        return normalizeMechanicComposition({
          effectTypeId: 'damage',
          damageTypeId: normalized.handlerId.slice('damage_bonus:'.length),
          valueKind: normalized.valueKind,
          stacking: normalized.stacking,
        })
      }
      return normalizeMechanicComposition({
        effectTypeId: 'magic',
        customHandlerId: normalized.handlerId,
        valueKind: normalized.valueKind,
        stacking: normalized.stacking,
      })
    default:
      return createEmptyMechanic()
  }
}

export function isActiveMechanic(mechanic: MechanicComposition | null | undefined): boolean {
  if (!mechanic?.effectTypeId) return false
  return resolveCompositionToBinding(mechanic) !== null
}

export function isActiveAbilityMechanic(mechanic: MechanicComposition | null | undefined): boolean {
  if (!isActiveMechanic(mechanic)) return false
  const normalized = normalizeMechanicComposition(mechanic)
  return Boolean(normalized.actionTypeId && normalized.targetId)
}

export function resolveCompositionToBinding(
  raw: MechanicComposition | null | undefined,
): AttributeBinding | null {
  const mechanic = normalizeMechanicComposition(raw)
  if (!mechanic.effectTypeId) return null

  switch (mechanic.effectTypeId) {
    case 'damage': {
      if (!mechanic.damageTypeId) return null
      return {
        kind: 'custom',
        damageTypeId: mechanic.damageTypeId,
        statId: null,
        saveTypeId: null,
        handlerId: `damage_bonus:${mechanic.damageTypeId}`,
        valueKind: mechanic.valueKind,
        stacking: mechanic.stacking,
      }
    }
    case 'resistance': {
      if (!mechanic.damageTypeId || !mechanic.resistanceRoleId) return null
      if (mechanic.resistanceRoleId === 'immunity' || mechanic.resistanceRoleId === 'absorption') {
        return {
          kind: 'custom',
          damageTypeId: mechanic.damageTypeId,
          statId: null,
          saveTypeId: null,
          handlerId: `${mechanic.resistanceRoleId}:${mechanic.damageTypeId}`,
          valueKind: mechanic.resistanceRoleId === 'immunity' ? 'boolean' : mechanic.valueKind,
          stacking: mechanic.stacking,
        }
      }
      const kind: AttributeBindingKind =
        mechanic.resistanceRoleId === 'vulnerability' ? 'damage_vulnerability' : 'damage_resistance'
      return {
        kind,
        damageTypeId: mechanic.damageTypeId,
        statId: null,
        saveTypeId: null,
        handlerId: null,
        valueKind: mechanic.valueKind,
        stacking: mechanic.stacking,
      }
    }
    case 'modifier':
      if (!mechanic.statId) return null
      return {
        kind: 'stat_modifier',
        damageTypeId: null,
        statId: mechanic.statId,
        saveTypeId: null,
        handlerId: null,
        valueKind: mechanic.valueKind,
        stacking: mechanic.stacking,
      }
    case 'saving_throw':
      if (!mechanic.saveTypeId) return null
      return {
        kind: 'save_bonus',
        damageTypeId: null,
        statId: null,
        saveTypeId: mechanic.saveTypeId,
        handlerId: null,
        valueKind: mechanic.valueKind,
        stacking: mechanic.stacking,
      }
    case 'condition':
      if (!mechanic.conditionId) return null
      return {
        kind: 'custom',
        damageTypeId: null,
        statId: null,
        saveTypeId: null,
        handlerId: `condition:${mechanic.conditionId}`,
        valueKind: mechanic.valueKind,
        stacking: mechanic.stacking,
      }
    case 'magic':
      if (!mechanic.customHandlerId) return null
      return {
        kind: 'custom',
        damageTypeId: null,
        statId: null,
        saveTypeId: null,
        handlerId: mechanic.customHandlerId,
        valueKind: mechanic.valueKind,
        stacking: mechanic.stacking,
      }
    default:
      return null
  }
}

export function deriveMechanicKey(
  mechanic: MechanicComposition | null | undefined,
  fallbackName: string,
): string {
  const normalized = normalizeMechanicComposition(mechanic)
  const parts: string[] = []

  if (normalized.effectTypeId === 'damage' && normalized.damageTypeId) {
    parts.push(normalized.damageTypeId, 'damage')
  } else if (normalized.effectTypeId === 'resistance' && normalized.damageTypeId && normalized.resistanceRoleId) {
    parts.push(normalized.damageTypeId, normalized.resistanceRoleId)
  } else if (normalized.effectTypeId === 'modifier' && normalized.statId) {
    parts.push(normalized.statId, 'modifier')
  } else if (normalized.effectTypeId === 'saving_throw' && normalized.saveTypeId) {
    parts.push('save', normalized.saveTypeId)
  } else if (normalized.effectTypeId === 'condition' && normalized.conditionId) {
    parts.push('condition', normalized.conditionId)
  } else if (normalized.effectTypeId === 'magic' && normalized.customHandlerId) {
    parts.push(normalized.customHandlerId)
  }

  if (normalized.actionTypeId) {
    parts.unshift(normalized.actionTypeId)
  }
  if (normalized.targetId) {
    parts.push(normalized.targetId)
  }

  if (parts.length === 0) {
    return slugify(fallbackName)
  }

  return parts.join('_')
}

function appendDamageBlocks(blocks: MechanicBlock[], damageTypeId: string | null | undefined) {
  if (!damageTypeId) return
  const group = findDamageTypeGroup(damageTypeId)
  if (!group) {
    blocks.push({ id: 'damage', label: formatDamageTypeLabel(damageTypeId), kind: 'damage' })
    return
  }
  if (group.id === damageTypeId) {
    blocks.push({ id: 'damage-group', label: group.name, kind: 'damage' })
    return
  }
  blocks.push({ id: 'damage-group', label: group.name, kind: 'damage' })
  const type = group.types.find((entry) => entry.id === damageTypeId)
  if (type) blocks.push({ id: 'damage', label: type.name, kind: 'damage' })
}

export interface MechanicBlock {
  id: string
  label: string
  kind: 'action' | 'type' | 'damage' | 'role' | 'stat' | 'save' | 'condition' | 'magic' | 'target' | 'value' | 'stacking'
}

export function getMechanicBlocks(
  mechanic: MechanicComposition | null | undefined,
  registry: MechanicsRegistry = DEFAULT_MECHANICS_REGISTRY,
): MechanicBlock[] {
  const normalized = normalizeMechanicComposition(mechanic)
  if (!normalized.effectTypeId) return []

  const blocks: MechanicBlock[] = []
  const actionEntry = findRegistryEntry(abilityActionsForEffectType(normalized.effectTypeId), normalized.actionTypeId ?? undefined)
  if (actionEntry) {
    blocks.push({ id: 'action', label: actionEntry.name, kind: 'action' })
  }

  const typeEntry = findRegistryEntry(registry.attributeTypes, normalized.effectTypeId)
  blocks.push({ id: 'type', label: typeEntry?.name ?? normalized.effectTypeId, kind: 'type' })

  switch (normalized.effectTypeId) {
    case 'damage':
      appendDamageBlocks(blocks, normalized.damageTypeId)
      break
    case 'resistance': {
      appendDamageBlocks(blocks, normalized.damageTypeId)
      const role = findRegistryEntry(registry.resistanceRoles, normalized.resistanceRoleId ?? undefined)
      if (role) blocks.push({ id: 'role', label: role.name, kind: 'role' })
      break
    }
    case 'modifier': {
      const stat = findRegistryEntry(registry.stats, normalized.statId ?? undefined)
      if (stat) {
        blocks.push({ id: 'stat', label: stat.name, kind: 'stat' })
      } else if (isDerivedStatModifierId(normalized.statId)) {
        blocks.push({
          id: 'stat',
          label: formatDerivedStatModifierLabel(normalized.statId),
          kind: 'stat',
        })
      }
      break
    }
    case 'saving_throw': {
      const save = findRegistryEntry(registry.saveTypes, normalized.saveTypeId ?? undefined)
      if (save) blocks.push({ id: 'save', label: save.name, kind: 'save' })
      break
    }
    case 'condition': {
      const condition = findRegistryEntry(registry.conditions, normalized.conditionId ?? undefined)
      if (condition) blocks.push({ id: 'condition', label: condition.name, kind: 'condition' })
      break
    }
    case 'magic': {
      const magic = findRegistryEntry(registry.magicEffects, normalized.customHandlerId ?? undefined)
      if (magic) blocks.push({ id: 'magic', label: magic.name, kind: 'magic' })
      break
    }
  }

  const targetEntry = findRegistryEntry(ABILITY_TARGETS, normalized.targetId ?? undefined)
  if (targetEntry) {
    blocks.push({ id: 'target', label: targetEntry.name, kind: 'target' })
  }

  return blocks
}

export function formatMechanicComposition(
  mechanic: MechanicComposition | null | undefined,
  registry: MechanicsRegistry = DEFAULT_MECHANICS_REGISTRY,
): string {
  const blocks = getMechanicBlocks(mechanic, registry)
  if (blocks.length === 0) return '—'
  return blocks.map((block) => block.label).join(' · ')
}

export function applyEffectTypeConstraints(mechanic: MechanicComposition): MechanicComposition {
  const next = { ...mechanic }

  if (!next.effectTypeId) {
    return createEmptyMechanic()
  }

  if (next.effectTypeId !== 'damage' && next.effectTypeId !== 'resistance') {
    next.damageTypeId = null
  }
  if (next.effectTypeId !== 'resistance') {
    next.resistanceRoleId = null
  }
  if (next.effectTypeId !== 'modifier') {
    next.statId = null
  }
  if (next.effectTypeId !== 'saving_throw') {
    next.saveTypeId = null
  }
  if (next.effectTypeId !== 'condition') {
    next.conditionId = null
  }
  if (next.effectTypeId !== 'magic') {
    next.customHandlerId = null
  }

  next.actionTypeId = validateAbilityActionId(next.actionTypeId, next.effectTypeId, null)
  next.targetId = validateAbilityTargetId(next.targetId, null)

  if (next.effectTypeId === 'resistance' && next.resistanceRoleId === 'immunity') {
    next.valueKind = 'boolean'
    next.stacking = 'or'
  } else if (next.effectTypeId === 'condition') {
    next.valueKind = 'boolean'
    next.stacking = 'or'
  }

  if (next.effectTypeId === 'damage' && !DAMAGE_STACKING_RULES.includes(next.stacking as DamageStackingRule)) {
    next.stacking = 'add'
  }

  return next
}

function defaultValueKindForEffect(
  effectTypeId: string | null,
  resistanceRoleId: string | null = null,
): ValueKind {
  if (effectTypeId === 'damage' || effectTypeId === 'resistance') {
    return resistanceRoleId === 'immunity' ? 'boolean' : 'ratio'
  }
  if (effectTypeId === 'condition') return 'boolean'
  return 'integer'
}

function defaultStackingForEffect(effectTypeId: string | null): StackingRule {
  if (effectTypeId === 'damage' || effectTypeId === 'resistance') return 'add'
  if (effectTypeId === 'condition') return 'or'
  return 'add'
}

function formatDerivedStatModifierLabel(statId: string): string {
  const slug = statId.slice(DERIVED_STAT_MODIFIER_PREFIX.length)
  return slug
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

function slugify(raw: string): string {
  const slug = raw
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 64)
  return slug || 'attribute'
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
