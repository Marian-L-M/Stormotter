import type { CharacterCategory } from './characterTypes'
import type { Dialog } from './dialogTypes'
import { normalizeItem, type Item } from './itemTypes'
import type { AdminTableFeatures, StubContentType } from './types'
import { useAbilitiesStore } from '../store/abilitiesStore'
import { useAttributesStore } from '../store/attributesStore'
import { useAudioProfilesStore } from '../store/audioProfilesStore'
import { useCharacterClassesStore } from '../store/characterClassesStore'
import { useCharacterMetaStore } from '../store/characterMetaStore'
import { useContainersStore } from '../store/containersStore'
import { useContentCatalogStore } from '../store/contentCatalogStore'
import { useDialogsStore } from '../store/dialogsStore'
import { useJournalStore } from '../store/journalStore'
import { useQuestsStore } from '../store/questsStore'
import { useStorylinesStore } from '../store/storylinesStore'
import { useItemsStore } from '../store/itemsStore'
import { useLineageTypesStore } from '../store/lineageTypesStore'
import { useStateVariablesStore } from '../store/stateVariablesStore'
import { useTaxonomyStore } from '../store/taxonomyStore'

function copySuffix(name: string): string {
  const trimmed = name.trim()
  return trimmed.endsWith('(copy)') ? trimmed : `${trimmed} (copy)`
}

export const READ_ONLY_TABLE_FEATURES: AdminTableFeatures = {
  selection: false,
  bulkDelete: false,
  rowActions: true,
}

export function duplicateItemRecord(source: Item): string {
  const newId = useItemsStore.getState().addItem(source.scope)
  useItemsStore.getState().updateItem(newId, {
    name: copySuffix(source.name),
    description: source.description,
    tooltipText: source.tooltipText,
    categoryId: source.categoryId,
    classId: source.classId,
    allowedSlotTypes: source.allowedSlotTypes ? [...source.allowedSlotTypes] : null,
    droppable: source.droppable,
    stealable: source.stealable,
    iconMediaId: source.iconMediaId,
    detailMediaId: source.detailMediaId,
    pickupSoundMediaId: source.pickupSoundMediaId,
    actionSoundMediaId: source.actionSoundMediaId,
    requirements: structuredClone(source.requirements),
    effects: structuredClone(source.effects),
    containerId: null,
  })
  useAttributesStore.getState().copyEntityAttributes(source.id, newId)
  useAbilitiesStore.getState().copyEntityAbilities(source.id, newId)
  return newId
}

export function deleteItemRecord(id: string): void {
  useItemsStore.getState().removeItem(id)
  useAttributesStore.getState().removeEntity(id)
  useAbilitiesStore.getState().removeEntity(id)
}

export function deleteDialogRecord(id: string): void {
  useDialogsStore.getState().removeDialog(id)
  useTaxonomyStore.getState().removeEntity(id)
}

export function duplicateDialogRecord(source: Dialog): string {
  const newId = useDialogsStore.getState().addDialog()
  useDialogsStore.getState().updateDialog(newId, {
    name: copySuffix(source.name),
    summary: source.summary,
    categoryId: source.categoryId,
    characterId: source.characterId,
    trigger: structuredClone(source.trigger),
    conversation: structuredClone(source.conversation),
  })
  return newId
}

export function deleteQuestRecord(id: string): void {
  useQuestsStore.getState().removeQuest(id)
  useTaxonomyStore.getState().removeEntity(id)
}

export function duplicateQuestRecord(source: import('./questTypes').Quest): string {
  const newId = useQuestsStore.getState().addQuest()
  useQuestsStore.getState().updateQuest(newId, {
    name: copySuffix(source.name),
    summary: source.summary,
    categoryId: source.categoryId,
    journalPreview: source.journalPreview,
    trigger: structuredClone(source.trigger),
    objectives: structuredClone(source.objectives),
    objectiveJoin: source.objectiveJoin,
    rewards: structuredClone(source.rewards),
    completionActions: structuredClone(source.completionActions),
  })
  return newId
}

export function deleteJournalEntryRecord(id: string): void {
  useJournalStore.getState().removeEntry(id)
  useTaxonomyStore.getState().removeEntity(id)
}

export function duplicateJournalEntryRecord(source: import('./journalTypes').JournalEntry): string {
  const newId = useJournalStore.getState().addEntry()
  useJournalStore.getState().updateEntry(newId, {
    title: copySuffix(source.title),
    body: source.body,
    categoryId: source.categoryId,
    linkedQuestId: source.linkedQuestId,
    displayConditions: structuredClone(source.displayConditions),
  })
  return newId
}

export function deleteStorylineRecord(id: string): void {
  useStorylinesStore.getState().removeStoryline(id)
  useTaxonomyStore.getState().removeEntity(id)
}

export function duplicateStorylineRecord(source: import('./storylineTypes').Storyline): string {
  const newId = useStorylinesStore.getState().addStoryline()
  useStorylinesStore.getState().updateStoryline(newId, {
    name: copySuffix(source.name),
    summary: source.summary,
    flow: structuredClone(source.flow),
  })
  return newId
}

export function deleteCharacterRecord(id: string): void {
  const removeCharacterInventory = useContainersStore.getState().removeCharacterInventory
  const clearContainerFromItems = useItemsStore.getState().clearContainerFromItems
  for (const containerId of removeCharacterInventory(id)) {
    clearContainerFromItems(containerId)
  }
  useContentCatalogStore.getState().removeItem('characters', id)
  useCharacterMetaStore.getState().removeMeta(id)
  useTaxonomyStore.getState().removeEntity(id)
  useAttributesStore.getState().removeEntity(id)
  useAbilitiesStore.getState().removeEntity(id)
}

export function duplicateCharacterRecord(sourceId: string, characterType: CharacterCategory): string {
  const catalog = useContentCatalogStore.getState()
  const source = catalog.getItem('characters', sourceId)
  const meta = useCharacterMetaStore.getState().getMeta(sourceId)
  const newId = catalog.addItem('characters', characterType)
  catalog.updateItem('characters', newId, { title: copySuffix(source?.title ?? 'Character') })
  useCharacterMetaStore.getState().updateMeta(newId, { ...structuredClone(meta), characterType })
  useAttributesStore.getState().copyEntityAttributes(sourceId, newId)
  useAbilitiesStore.getState().copyEntityAbilities(sourceId, newId)
  const created = catalog.getItem('characters', newId)
  useContainersStore.getState().ensureCharacterInventory(newId, created?.title ?? 'Character')
  return newId
}

export function deleteContainerRecord(id: string): void {
  useItemsStore.getState().clearContainerFromItems(id)
  useContainersStore.getState().removeContainer(id)
}

export function duplicateContainerRecord(sourceId: string): string {
  const source = useContainersStore.getState().getContainer(sourceId)
  if (!source) return sourceId
  const newId = useContainersStore.getState().addContainer(source.kind)
  useContainersStore.getState().updateContainer(newId, {
    name: copySuffix(source.name),
    description: source.description,
    visibility: source.visibility,
    lootEntries: structuredClone(source.lootEntries),
  })
  return newId
}

export function deleteLineageTypeRecord(id: string): void {
  useLineageTypesStore.getState().removeLineageType(id)
  useTaxonomyStore.getState().removeEntity(id)
  useAttributesStore.getState().removeEntity(id)
  useAbilitiesStore.getState().removeEntity(id)
}

export function duplicateLineageTypeRecord(sourceId: string): string {
  const source = useLineageTypesStore.getState().getLineageType(sourceId)
  if (!source) return sourceId
  const newId = useLineageTypesStore.getState().addLineageType()
  useLineageTypesStore.getState().updateLineageType(newId, {
    name: copySuffix(source.name),
    description: source.description,
    statRanges: structuredClone(source.statRanges),
    hitPointBonusDice: structuredClone(source.hitPointBonusDice),
    levelAbilities: structuredClone(source.levelAbilities),
    slotRules: structuredClone(source.slotRules),
    hiddenInventoryActivatesUnequipped: source.hiddenInventoryActivatesUnequipped,
    derivedStatBases: structuredClone(source.derivedStatBases),
    derivedStatModifiers: structuredClone(source.derivedStatModifiers),
  })
  useAttributesStore.getState().copyEntityAttributes(sourceId, newId)
  useAbilitiesStore.getState().copyEntityAbilities(sourceId, newId)
  return newId
}

export function deleteCharacterClassRecord(id: string): void {
  useCharacterClassesStore.getState().removeCharacterClass(id)
  useTaxonomyStore.getState().removeEntity(id)
  useAttributesStore.getState().removeEntity(id)
  useAbilitiesStore.getState().removeEntity(id)
}

export function duplicateCharacterClassRecord(sourceId: string): string {
  const source = useCharacterClassesStore.getState().getCharacterClass(sourceId)
  if (!source) return sourceId
  const newId = useCharacterClassesStore.getState().addCharacterClass()
  useCharacterClassesStore.getState().updateCharacterClass(newId, {
    name: copySuffix(source.name),
    description: source.description,
    hitDice: structuredClone(source.hitDice),
    distinctFeatures: [...source.distinctFeatures],
    levelAbilities: structuredClone(source.levelAbilities),
    slotRules: structuredClone(source.slotRules),
    hiddenInventoryActivatesUnequipped: source.hiddenInventoryActivatesUnequipped,
    derivedStatBases: structuredClone(source.derivedStatBases),
    derivedStatModifiers: structuredClone(source.derivedStatModifiers),
  })
  useAttributesStore.getState().copyEntityAttributes(sourceId, newId)
  useAbilitiesStore.getState().copyEntityAbilities(sourceId, newId)
  return newId
}

export function deleteAttributeDefinitionRecord(id: string): void {
  useAttributesStore.getState().removeDefinition(id)
}

export function duplicateAttributeDefinitionRecord(sourceId: string): string {
  const source = useAttributesStore.getState().getDefinition(sourceId)
  if (!source) return sourceId
  const newId = useAttributesStore.getState().addDefinition(source.source, source.inputType)
  useAttributesStore.getState().updateDefinition(newId, {
    name: copySuffix(source.name),
    description: source.description,
    mechanic: source.mechanic ? structuredClone(source.mechanic) : null,
  })
  return newId
}

export function deleteAbilityDefinitionRecord(id: string): void {
  useAbilitiesStore.getState().removeDefinition(id)
}

export function duplicateAbilityDefinitionRecord(sourceId: string): string {
  const source = useAbilitiesStore.getState().getDefinition(sourceId)
  if (!source) return sourceId
  const newId = useAbilitiesStore.getState().addDefinition(source.inputType)
  useAbilitiesStore.getState().updateDefinition(newId, {
    name: copySuffix(source.name),
    description: source.description,
    mechanic: source.mechanic ? structuredClone(source.mechanic) : null,
  })
  return newId
}

export function deleteAudioProfileRecord(id: string): void {
  useAudioProfilesStore.getState().removeAudioProfile(id)
  useTaxonomyStore.getState().removeEntity(id)
}

export function duplicateAudioProfileRecord(sourceId: string): string {
  const source = useAudioProfilesStore.getState().getAudioProfile(sourceId)
  if (!source) return sourceId
  const newId = useAudioProfilesStore.getState().addAudioProfile()
  useAudioProfilesStore.getState().updateAudioProfile(newId, {
    name: copySuffix(source.name),
    description: source.description,
    triggers: structuredClone(source.triggers),
    customTriggers: structuredClone(source.customTriggers),
  })
  return newId
}

export function deleteStateVariableRecord(id: string): void {
  useStateVariablesStore.getState().removeVariable(id)
}

export function duplicateStateVariableRecord(sourceId: string): string {
  const source = useStateVariablesStore.getState().getVariable(sourceId)
  if (!source) return sourceId
  const newId = useStateVariablesStore.getState().addVariable(source.scope)
  useStateVariablesStore.getState().updateVariable(newId, {
    title: copySuffix(source.title),
    key: `${source.key}_copy`,
    description: source.description,
    varType: source.varType,
    defaultValue: structuredClone(source.defaultValue),
    characterId: source.characterId,
  })
  return newId
}

export function deleteStubRecord(type: StubContentType, id: string): void {
  useContentCatalogStore.getState().removeItem(type, id)
  useTaxonomyStore.getState().removeEntity(id)
}

export function duplicateStubRecord(type: StubContentType, sourceId: string): string {
  const source = useContentCatalogStore.getState().getItem(type, sourceId)
  const newId = useContentCatalogStore.getState().addItem(type, source?.category)
  if (source) {
    useContentCatalogStore.getState().updateItem(type, newId, {
      title: copySuffix(source.title),
      subtitle: source.subtitle,
    })
  }
  useAttributesStore.getState().copyEntityAttributes(sourceId, newId)
  return newId
}

export function cloneItemSnapshot(item: Item): Item {
  return normalizeItem(structuredClone(item))
}
