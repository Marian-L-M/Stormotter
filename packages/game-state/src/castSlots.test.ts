import { describe, expect, it } from 'vitest'
import {
  attemptRest,
  buildAssignableAbilityPool,
  canStartRest,
  castConsumable,
  castFromSlot,
  createEmptyCastSlotSession,
  initializeCharacterCastState,
  initializeItemInstanceState,
  reassignSlot,
  resolveCastSlotDefinitions,
} from './castSlots.js'
import type {
  AbilityCastSlotTemplate,
  ItemCastSlotDefinition,
  LevelAssignableAbilityEntry,
  LevelCastSlotGrant,
  ResolveCastSlotsInput,
} from './castSlotTypes.js'

const HERO_ID = 'hero-1'
const MAGE_CLASS = 'class-mage'
const FIREBALL = 'ability-fireball'
const MAGIC_MISSILE = 'ability-magic-missile'
const CURE_LIGHT = 'ability-cure-light'

function assignableSlot(id: string, category: AbilityCastSlotTemplate['category'] = 'magic'): AbilityCastSlotTemplate {
  return {
    id,
    category,
    assignment: 'assignable',
    usesPerRest: 1,
    unlockLevel: 1,
    unlockConditions: null,
    chargeSource: 'rest',
  }
}

function fixedSlot(id: string, abilityId: string): AbilityCastSlotTemplate {
  return {
    id,
    category: 'class',
    assignment: 'fixed',
    fixedAbilityId: abilityId,
    usesPerRest: 1,
    unlockLevel: 1,
    unlockConditions: null,
    chargeSource: 'rest',
    ownerClassId: MAGE_CLASS,
  }
}

function classGrants(slots: AbilityCastSlotTemplate[]): LevelCastSlotGrant[] {
  return [{ level: 1, slots }]
}

function baseResolveInput(
  overrides: Partial<ResolveCastSlotsInput> = {},
): ResolveCastSlotsInput {
  return {
    characterId: HERO_ID,
    lineageTypeId: null,
    classTracks: [{ classId: MAGE_CLASS, level: 3 }],
    totalLevel: 3,
    characterGrants: [],
    typeGrants: [],
    classGrantsByClassId: {
      [MAGE_CLASS]: classGrants([assignableSlot('magic-1'), assignableSlot('magic-2')]),
    },
    equippedItemDefinitions: [],
    equippedItemInstances: [],
    abilityMetadata: {
      [FIREBALL]: { slotCategories: ['magic'] },
      [MAGIC_MISSILE]: { slotCategories: ['magic'] },
      [CURE_LIGHT]: { slotCategories: ['divine'] },
    },
    ...overrides,
  }
}

function pool(entries: LevelAssignableAbilityEntry[]) {
  return buildAssignableAbilityPool(entries, 3, [{ classId: MAGE_CLASS, level: 3 }], 3)
}

function slotDef(input: ResolveCastSlotsInput, templateId: string) {
  const definitions = resolveCastSlotDefinitions(input)
  const match = definitions.find((entry) => entry.templateId === templateId)
  if (!match) throw new Error(`Missing slot ${templateId}`)
  return match
}

describe('resolveCastSlotDefinitions', () => {
  it('only emits slots at or below current level', () => {
    const input = baseResolveInput({
      classGrantsByClassId: {
        [MAGE_CLASS]: [
          { level: 1, slots: [assignableSlot('early')] },
          { level: 5, slots: [assignableSlot('late')] },
        ],
      },
      classTracks: [{ classId: MAGE_CLASS, level: 3 }],
    })

    const ids = resolveCastSlotDefinitions(input).map((entry) => entry.templateId)
    expect(ids).toContain('early')
    expect(ids).not.toContain('late')
  })

  it('respects unlockConditions via evaluateCondition callback', () => {
    const input = baseResolveInput({
      classGrantsByClassId: {
        [MAGE_CLASS]: classGrants([assignableSlot('gated')]),
      },
      evaluateCondition: (conditions) => conditions !== 'blocked',
    })
    input.classGrantsByClassId[MAGE_CLASS]![0]!.slots[0]!.unlockConditions = 'blocked'

    expect(resolveCastSlotDefinitions(input)).toHaveLength(0)
  })
})

describe('reassignSlot', () => {
  it('burns charge when reassigning a filled slot', () => {
    const input = baseResolveInput()
    const definitions = resolveCastSlotDefinitions(input)
    let session = createEmptyCastSlotSession()
    session.characterCastState[HERO_ID] = initializeCharacterCastState(HERO_ID, definitions)

    const magic1 = slotDef(input, 'magic-1')
    const assignable = pool([
      { level: 1, definitionId: FIREBALL, categories: ['magic'], conditions: null },
      { level: 1, definitionId: MAGIC_MISSILE, categories: ['magic'], conditions: null },
    ])

    const first = reassignSlot({
      session,
      slotId: magic1.slotId,
      abilityId: FIREBALL,
      slotDefinition: magic1,
      assignablePool: assignable,
      abilityMetadata: input.abilityMetadata,
      lineageTypeId: null,
      classIds: [MAGE_CLASS],
    })
    expect(first.ok).toBe(true)
    const slotAfterFirst = first.session.characterCastState[HERO_ID]!.slots.find(
      (entry) => entry.slotId === magic1.slotId,
    )
    expect(slotAfterFirst?.usesRemaining).toBe(1)

    const second = reassignSlot({
      session: first.session,
      slotId: magic1.slotId,
      abilityId: MAGIC_MISSILE,
      slotDefinition: magic1,
      assignablePool: assignable,
      abilityMetadata: input.abilityMetadata,
      lineageTypeId: null,
      classIds: [MAGE_CLASS],
    })
    expect(second.ok).toBe(true)
    const slotAfterSecond = second.session.characterCastState[HERO_ID]!.slots.find(
      (entry) => entry.slotId === magic1.slotId,
    )
    expect(slotAfterSecond?.usesRemaining).toBe(0)
    expect(slotAfterSecond?.assignedAbilityId).toBe(MAGIC_MISSILE)
  })

  it('does not burn charge on first assign to an empty slot', () => {
    const input = baseResolveInput({
      classGrantsByClassId: {
        [MAGE_CLASS]: classGrants([assignableSlot('magic-1')]),
      },
    })
    const definitions = resolveCastSlotDefinitions(input)
    let session = createEmptyCastSlotSession()
    session.characterCastState[HERO_ID] = initializeCharacterCastState(HERO_ID, definitions)
    const magic1 = slotDef(input, 'magic-1')

    const result = reassignSlot({
      session,
      slotId: magic1.slotId,
      abilityId: FIREBALL,
      slotDefinition: magic1,
      assignablePool: pool([
        { level: 1, definitionId: FIREBALL, categories: ['magic'], conditions: null },
      ]),
      abilityMetadata: input.abilityMetadata,
      lineageTypeId: null,
      classIds: [MAGE_CLASS],
    })

    const slot = result.session.characterCastState[HERO_ID]!.slots[0]
    expect(result.ok).toBe(true)
    expect(slot?.usesRemaining).toBe(1)
    expect(slot?.hasBeenFilled).toBe(true)
  })
})

describe('castFromSlot', () => {
  it('allows duplicate assignments in independent slots until rest', () => {
    const input = baseResolveInput()
    const definitions = resolveCastSlotDefinitions(input)
    let session = createEmptyCastSlotSession()
    session.characterCastState[HERO_ID] = initializeCharacterCastState(HERO_ID, definitions)

    const magic1 = slotDef(input, 'magic-1')
    const magic2 = slotDef(input, 'magic-2')
    const assignable = pool([
      { level: 1, definitionId: FIREBALL, categories: ['magic'], conditions: null },
    ])

    for (const def of [magic1, magic2]) {
      const result = reassignSlot({
        session,
        slotId: def.slotId,
        abilityId: FIREBALL,
        slotDefinition: def,
        assignablePool: assignable,
        abilityMetadata: input.abilityMetadata,
        lineageTypeId: null,
        classIds: [MAGE_CLASS],
      })
      session = result.session
    }

    const firstCast = castFromSlot({ session, slotId: magic1.slotId, slotDefinition: magic1 })
    expect(firstCast.ok).toBe(true)
    const secondCast = castFromSlot({
      session: firstCast.session,
      slotId: magic2.slotId,
      slotDefinition: magic2,
    })
    expect(secondCast.ok).toBe(true)

    const slots = secondCast.session.characterCastState[HERO_ID]!.slots
    expect(slots.every((entry) => entry.usesRemaining === 0)).toBe(true)
  })

  it('refreshes charges after successful rest', () => {
    const input = baseResolveInput({
      classGrantsByClassId: {
        [MAGE_CLASS]: classGrants([assignableSlot('magic-1')]),
      },
    })
    const definitions = resolveCastSlotDefinitions(input)
    let session = createEmptyCastSlotSession()
    session.characterCastState[HERO_ID] = initializeCharacterCastState(HERO_ID, definitions)
    const magic1 = slotDef(input, 'magic-1')

    const cast = castFromSlot({ session, slotId: magic1.slotId, slotDefinition: magic1 })
    expect(cast.ok).toBe(false)

    session = cast.session
    session.characterCastState[HERO_ID]!.slots[0]!.assignedAbilityId = FIREBALL
    session.characterCastState[HERO_ID]!.slots[0]!.hasBeenFilled = true

    const castWithAbility = castFromSlot({ session, slotId: magic1.slotId, slotDefinition: magic1 })
    expect(castWithAbility.ok).toBe(true)

    const rested = attemptRest(
      {
        session: castWithAbility.session,
        restZone: 'inn',
        nowMs: 60_000,
      },
      { [HERO_ID]: definitions },
    )

    expect(rested.outcome.slotsRefreshed).toBe(true)
    expect(rested.session.characterCastState[HERO_ID]!.slots[0]?.usesRemaining).toBe(1)
  })
})

describe('canStartRest / attemptRest', () => {
  it('blocks rest during combat', () => {
    const session = createEmptyCastSlotSession()
    session.rest.isInCombat = true

    const eligibility = canStartRest({ session, restZone: 'inn', nowMs: 0 })
    expect(eligibility.ok).toBe(false)
    expect(eligibility.reason).toBe('in_combat')

    const result = attemptRest({ session, restZone: 'inn', nowMs: 0 }, {})
    expect(result.outcome.completed).toBe(false)
    expect(result.session.elapsedMinutes).toBe(0)
  })

  it('blocks rest when hostiles are in aggressive range', () => {
    const session = createEmptyCastSlotSession()
    const eligibility = canStartRest({
      session,
      restZone: 'outside',
      nowMs: 60_000,
      hostilePositions: [{ x: 0, y: 0 }],
      partyPositions: [{ x: 5, y: 0 }],
      config: { durationMinutes: 480, combatCooldownSeconds: 30, aggressiveRange: 12 },
    })
    expect(eligibility.ok).toBe(false)
    expect(eligibility.reason).toBe('enemies_nearby')
  })

  it('all-or-nothing unsafe rest interruption', () => {
    const input = baseResolveInput({
      classGrantsByClassId: {
        [MAGE_CLASS]: classGrants([assignableSlot('magic-1')]),
      },
    })
    const definitions = resolveCastSlotDefinitions(input)
    let session = createEmptyCastSlotSession()
    session.characterCastState[HERO_ID] = initializeCharacterCastState(HERO_ID, definitions)
    session.characterCastState[HERO_ID]!.slots[0]!.usesRemaining = 0

    const interrupted = attemptRest(
      {
        session,
        restZone: 'outside',
        nowMs: 60_000,
        rollUnsafeRestInterrupt: () => true,
      },
      { [HERO_ID]: definitions },
    )

    expect(interrupted.outcome.interrupted).toBe(true)
    expect(interrupted.outcome.minutesAdvanced).toBe(0)
    expect(interrupted.outcome.slotsRefreshed).toBe(false)
    expect(interrupted.outcome.hooks).toContain('on_rest_unsafe')
    expect(interrupted.session.elapsedMinutes).toBe(0)
    expect(interrupted.session.characterCastState[HERO_ID]!.slots[0]?.usesRemaining).toBe(0)
  })

  it('inn rest skips unsafe roll and refreshes with time advance', () => {
    const input = baseResolveInput({
      classGrantsByClassId: {
        [MAGE_CLASS]: classGrants([assignableSlot('magic-1')]),
      },
    })
    const definitions = resolveCastSlotDefinitions(input)
    let session = createEmptyCastSlotSession()
    session.characterCastState[HERO_ID] = initializeCharacterCastState(HERO_ID, definitions)
    session.characterCastState[HERO_ID]!.slots[0]!.usesRemaining = 0

    let unsafeCalled = false
    const rested = attemptRest(
      {
        session,
        restZone: 'inn',
        nowMs: 60_000,
        rollUnsafeRestInterrupt: () => {
          unsafeCalled = true
          return true
        },
      },
      { [HERO_ID]: definitions },
    )

    expect(unsafeCalled).toBe(false)
    expect(rested.outcome.completed).toBe(true)
    expect(rested.outcome.minutesAdvanced).toBe(480)
    expect(rested.outcome.hooks).toEqual(['on_rest', 'on_rest_inside'])
    expect(rested.session.elapsedMinutes).toBe(480)
    expect(rested.session.characterCastState[HERO_ID]!.slots[0]?.usesRemaining).toBe(1)
  })
})

describe('item slots and consumables', () => {
  const WAND_DEF_ID = 'item-wand'
  const WAND_INSTANCE = 'wand-instance-1'
  const SCROLL_INSTANCE = 'scroll-instance-1'

  const wandDefinition: ItemCastSlotDefinition = {
    itemDefinitionId: WAND_DEF_ID,
    maxItemCharges: 7,
    castSlots: [
      {
        id: 'wand-slot',
        category: 'magic',
        assignment: 'fixed',
        fixedAbilityId: MAGIC_MISSILE,
        usesPerRest: 1,
        unlockLevel: 1,
        unlockConditions: null,
        chargeSource: 'item',
      },
    ],
  }

  const scrollDefinition: ItemCastSlotDefinition = {
    itemDefinitionId: 'item-scroll',
    maxItemCharges: 1,
    castSlots: [],
    consumable: {
      abilityId: FIREBALL,
      maxCharges: 1,
      destroyAtZero: true,
      castFrom: ['inventory', 'quick'],
    },
  }

  it('wand item charge casts do not refresh on rest', () => {
    const input = baseResolveInput({
      classGrantsByClassId: { [MAGE_CLASS]: [] },
      equippedItemDefinitions: [wandDefinition],
      equippedItemInstances: [
        { instanceId: WAND_INSTANCE, definitionId: WAND_DEF_ID, ownerCharacterId: HERO_ID },
      ],
    })
    const definitions = resolveCastSlotDefinitions(input)
    let session = createEmptyCastSlotSession()
    session.itemInstances[WAND_INSTANCE] = initializeItemInstanceState(
      WAND_INSTANCE,
      WAND_DEF_ID,
      HERO_ID,
      wandDefinition,
      definitions,
    )

    const wandSlot = definitions.find((entry) => entry.owner.type === 'item')!
    const cast = castFromSlot({ session, slotId: wandSlot.slotId, slotDefinition: wandSlot })
    expect(cast.ok).toBe(true)
    expect(cast.session.itemInstances[WAND_INSTANCE]?.itemChargesRemaining).toBe(6)

    const rested = attemptRest(
      { session: cast.session, restZone: 'inn', nowMs: 60_000 },
      { [HERO_ID]: definitions },
    )
    expect(rested.session.itemInstances[WAND_INSTANCE]?.itemChargesRemaining).toBe(6)
  })

  it('reassign on item rest-charged slot burns rest charge only', () => {
    const staffDefinition: ItemCastSlotDefinition = {
      itemDefinitionId: 'item-staff',
      maxItemCharges: null,
      castSlots: [assignableSlot('staff-slot')],
    }
    staffDefinition.castSlots[0]!.chargeSource = 'rest'

    const input = baseResolveInput({
      classGrantsByClassId: { [MAGE_CLASS]: [] },
      equippedItemDefinitions: [staffDefinition],
      equippedItemInstances: [
        { instanceId: 'staff-1', definitionId: 'item-staff', ownerCharacterId: HERO_ID },
      ],
    })
    const definitions = resolveCastSlotDefinitions(input)
    let session = createEmptyCastSlotSession()
    session.itemInstances['staff-1'] = initializeItemInstanceState(
      'staff-1',
      'item-staff',
      HERO_ID,
      staffDefinition,
      definitions,
    )

    const staffSlot = definitions.find((entry) => entry.owner.type === 'item')!
    const assignable = pool([
      { level: 1, definitionId: FIREBALL, categories: ['magic'], conditions: null },
      { level: 1, definitionId: MAGIC_MISSILE, categories: ['magic'], conditions: null },
    ])

    const first = reassignSlot({
      session,
      slotId: staffSlot.slotId,
      abilityId: FIREBALL,
      slotDefinition: staffSlot,
      assignablePool: assignable,
      abilityMetadata: input.abilityMetadata,
      lineageTypeId: null,
      classIds: [MAGE_CLASS],
    })
    const second = reassignSlot({
      session: first.session,
      slotId: staffSlot.slotId,
      abilityId: MAGIC_MISSILE,
      slotDefinition: staffSlot,
      assignablePool: assignable,
      abilityMetadata: input.abilityMetadata,
      lineageTypeId: null,
      classIds: [MAGE_CLASS],
    })

    const slot = second.session.itemInstances['staff-1']!.slots[0]
    expect(slot?.usesRemaining).toBe(0)
  })

  it('reassign on item-charge wand does not drain wand charges', () => {
    const input = baseResolveInput({
      classGrantsByClassId: { [MAGE_CLASS]: [] },
      equippedItemDefinitions: [
        {
          ...wandDefinition,
          castSlots: [{ ...wandDefinition.castSlots[0]!, assignment: 'assignable', fixedAbilityId: undefined }],
        },
      ],
      equippedItemInstances: [
        { instanceId: WAND_INSTANCE, definitionId: WAND_DEF_ID, ownerCharacterId: HERO_ID },
      ],
    })
    const definitions = resolveCastSlotDefinitions(input)
    let session = createEmptyCastSlotSession()
    session.itemInstances[WAND_INSTANCE] = initializeItemInstanceState(
      WAND_INSTANCE,
      WAND_DEF_ID,
      HERO_ID,
      input.equippedItemDefinitions[0]!,
      definitions,
    )

    const wandSlot = definitions.find((entry) => entry.owner.type === 'item')!
    const assignable = pool([
      { level: 1, definitionId: FIREBALL, categories: ['magic'], conditions: null },
      { level: 1, definitionId: MAGIC_MISSILE, categories: ['magic'], conditions: null },
    ])

    session = reassignSlot({
      session,
      slotId: wandSlot.slotId,
      abilityId: FIREBALL,
      slotDefinition: wandSlot,
      assignablePool: assignable,
      abilityMetadata: input.abilityMetadata,
      lineageTypeId: null,
      classIds: [MAGE_CLASS],
    }).session

    session = reassignSlot({
      session,
      slotId: wandSlot.slotId,
      abilityId: MAGIC_MISSILE,
      slotDefinition: wandSlot,
      assignablePool: assignable,
      abilityMetadata: input.abilityMetadata,
      lineageTypeId: null,
      classIds: [MAGE_CLASS],
    }).session

    expect(session.itemInstances[WAND_INSTANCE]?.itemChargesRemaining).toBe(7)
  })

  it('scroll cast from quick slot destroys item at zero charges', () => {
    let session = createEmptyCastSlotSession()
    session.itemInstances[SCROLL_INSTANCE] = initializeItemInstanceState(
      SCROLL_INSTANCE,
      'item-scroll',
      HERO_ID,
      scrollDefinition,
      [],
    )

    const cast = castConsumable({
      session,
      itemInstanceId: SCROLL_INSTANCE,
      fromLocation: 'quick',
    })

    expect(cast.ok).toBe(true)
    expect(cast.session.itemInstances[SCROLL_INSTANCE]?.destroyed).toBe(true)
    expect(cast.session.itemInstances[SCROLL_INSTANCE]?.itemChargesRemaining).toBe(0)

    const blocked = castConsumable({
      session: cast.session,
      itemInstanceId: SCROLL_INSTANCE,
      fromLocation: 'inventory',
    })
    expect(blocked.ok).toBe(false)
  })
})
