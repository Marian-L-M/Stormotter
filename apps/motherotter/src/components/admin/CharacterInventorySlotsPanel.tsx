import { useMemo } from 'react'
import {
  CHARACTER_SLOT_DEFINITIONS,
  CHARACTER_SLOT_GROUP_LABELS,
  characterSlotDefinitionsByGroup,
  getCharacterSlotDefinition,
  type CharacterSlotDefinition,
} from '../../admin/characterSlotTypes'
import { effectiveActiveHandSlot } from '../../admin/slotRules'
import { CharacterEquipmentLayout } from './CharacterEquipmentLayout'
import { useContainersStore } from '../../store/containersStore'
import { useItemsStore } from '../../store/itemsStore'

interface CharacterInventorySlotsPanelProps {
  characterId: string
  activeMainHandSlot: number
  activeOffHandSlot: number
  slotEnabled: (slotKey: string) => boolean
  onSlotClick: (containerId: string, slotKey: string) => void
  onSetActiveMainHand: (index: number) => void
  onSetActiveOffHand: (index: number) => void
}

function sortSlotContainers<T extends { slotKey: string | null }>(entries: T[]): T[] {
  return [...entries].sort((left, right) => {
    const leftIndex = CHARACTER_SLOT_DEFINITIONS.findIndex((entry) => entry.slotKey === left.slotKey)
    const rightIndex = CHARACTER_SLOT_DEFINITIONS.findIndex((entry) => entry.slotKey === right.slotKey)
    return leftIndex - rightIndex
  })
}

export function CharacterInventorySlotsPanel({
  characterId,
  activeMainHandSlot,
  activeOffHandSlot,
  slotEnabled,
  onSlotClick,
  onSetActiveMainHand,
  onSetActiveOffHand,
}: CharacterInventorySlotsPanelProps) {
  const containers = useContainersStore((state) => state.containers)
  const items = useItemsStore((state) => state.items)

  const slotContainers = useMemo(
    () =>
      sortSlotContainers(
        containers.filter(
          (entry) => entry.kind === 'character_slot' && entry.characterId === characterId,
        ),
      ),
    [containers, characterId],
  )

  const grouped = characterSlotDefinitionsByGroup()
  const containersBySlot = useMemo(
    () => new Map(slotContainers.map((entry) => [entry.slotKey ?? '', entry.id] as const)),
    [slotContainers],
  )

  const containerIdForSlot = (slotKey: string) => containersBySlot.get(slotKey)

  const resolvedMainHand = effectiveActiveHandSlot(
    'equip:main_hand',
    4,
    activeMainHandSlot,
    items,
    containerIdForSlot,
  )
  const resolvedOffHand = effectiveActiveHandSlot(
    'equip:off_hand',
    2,
    activeOffHandSlot,
    items,
    containerIdForSlot,
  )

  if (slotContainers.length === 0) {
    return <p className="admin-empty">No inventory slots provisioned for this character yet.</p>
  }

  function renderSlotCell(containerId: string, slotKey: string) {
    const definition = getCharacterSlotDefinition(slotKey)
    const enabled = slotEnabled(slotKey)
    const slotItems = items.filter(
      (entry) => entry.scope === 'unique' && entry.containerId === containerId,
    )
    const summary =
      slotItems.length === 0
        ? 'Empty'
        : slotItems.length === 1
          ? slotItems[0].name
          : `${slotItems.length} items`

    return (
      <button
        key={containerId}
        type="button"
        className={`character-inventory-slot${enabled ? '' : ' is-disabled'}`}
        disabled={!enabled}
        onClick={() => onSlotClick(containerId, slotKey)}
      >
        <span className="character-inventory-slot-name">{definition?.name ?? slotKey}</span>
        <span className="character-inventory-slot-items">{summary}</span>
        {definition?.visibility === 'hidden' ? (
          <span className="character-inventory-slot-badge">Hidden</span>
        ) : null}
      </button>
    )
  }

  function renderSlotGroup(title: string, definitions: CharacterSlotDefinition[]) {
    return (
      <section key={title} className="admin-editor-section character-inventory-group">
        <h3>{title}</h3>
        <div className="character-inventory-grid">
          {definitions.map((definition) => {
            const containerId = containersBySlot.get(definition.slotKey)
            if (!containerId) return null
            return renderSlotCell(containerId, definition.slotKey)
          })}
        </div>
      </section>
    )
  }

  return (
    <>
      <p className="admin-editor-lead">
        Equipment slots surround the body silhouette. Main hand and off hand support multiple slots
        with one active selection. Quick slots and quiver hold fast-access items and ammunition.
      </p>

      <section className="admin-editor-section character-inventory-group">
        <h3>{CHARACTER_SLOT_GROUP_LABELS.equipment}</h3>
        <CharacterEquipmentLayout
          containersBySlot={containersBySlot}
          items={items}
          slotEnabled={slotEnabled}
          activeMainHandSlot={resolvedMainHand}
          activeOffHandSlot={resolvedOffHand}
          onOpenSlot={onSlotClick}
          onSetActiveMainHand={onSetActiveMainHand}
          onSetActiveOffHand={onSetActiveOffHand}
        />
      </section>

      {renderSlotGroup(CHARACTER_SLOT_GROUP_LABELS.quick_bar, grouped.quick_bar)}
      {renderSlotGroup(CHARACTER_SLOT_GROUP_LABELS.quiver, grouped.quiver)}
      {renderSlotGroup(CHARACTER_SLOT_GROUP_LABELS.public_storage, grouped.public_storage)}

      <section className="admin-editor-section character-inventory-group">
        <h3>{CHARACTER_SLOT_GROUP_LABELS.hidden_storage}</h3>
        <div className="character-inventory-grid">
          {grouped.hidden_storage.map((definition) => {
            const containerId = containersBySlot.get(definition.slotKey)
            if (!containerId) return null
            return renderSlotCell(containerId, definition.slotKey)
          })}
        </div>
      </section>
    </>
  )
}
