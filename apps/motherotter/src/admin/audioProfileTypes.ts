export type AudioTriggerGroupId =
  | 'combat'
  | 'selection'
  | 'actions'
  | 'environment'
  | 'skills'

export type AudioTriggerId =
  | 'battle-cry-1'
  | 'battle-cry-2'
  | 'battle-cry-3'
  | 'becoming-leader'
  | 'badly-wounded'
  | 'being-hit'
  | 'dying'
  | 'critical-hit'
  | 'critical-miss'
  | 'target-immune'
  | 'spell-disrupted'
  | 'party-member-death'
  | 'selected-1'
  | 'selected-2'
  | 'selected-3'
  | 'selected-4'
  | 'tired'
  | 'bored'
  | 'action-1'
  | 'action-2'
  | 'action-3'
  | 'action-4'
  | 'action-5'
  | 'action-6'
  | 'action-7'
  | 'rare-action-1'
  | 'rare-action-2'
  | 'in-forest'
  | 'in-city'
  | 'in-dungeon'
  | 'daytime'
  | 'nighttime'
  | 'inventory-full'
  | 'pickpocket-success'
  | 'hide-in-shadows-success'
  | 'trap-set-success'

export interface AudioTriggerDefinition {
  id: AudioTriggerId
  label: string
  description: string
  group: AudioTriggerGroupId
}

export const AUDIO_TRIGGER_GROUP_LABELS: Record<AudioTriggerGroupId, string> = {
  combat: 'Battle & combat',
  selection: 'Selection & idle',
  actions: 'Action acknowledgements',
  environment: 'Environment',
  skills: 'Skills & misc',
}

/** Standard voice trigger slots for character audio profiles. */
export const AUDIO_TRIGGER_DEFINITIONS: AudioTriggerDefinition[] = [
  {
    id: 'battle-cry-1',
    label: 'Battle cry 1',
    description: 'Shouted when entering combat.',
    group: 'combat',
  },
  {
    id: 'battle-cry-2',
    label: 'Battle cry 2',
    description: 'Alternate combat entry shout.',
    group: 'combat',
  },
  {
    id: 'battle-cry-3',
    label: 'Battle cry 3',
    description: 'Third combat entry shout variant.',
    group: 'combat',
  },
  {
    id: 'becoming-leader',
    label: 'Becoming leader',
    description: 'Spoken when this character becomes party leader.',
    group: 'combat',
  },
  {
    id: 'badly-wounded',
    label: 'Badly wounded',
    description: 'Pain reaction at low hit points.',
    group: 'combat',
  },
  {
    id: 'being-hit',
    label: 'Being hit',
    description: 'Grunt or cry when taking damage.',
    group: 'combat',
  },
  {
    id: 'dying',
    label: 'Dying',
    description: 'Death cry.',
    group: 'combat',
  },
  {
    id: 'critical-hit',
    label: 'Critical hit',
    description: 'Celebratory line on a critical strike.',
    group: 'combat',
  },
  {
    id: 'critical-miss',
    label: 'Critical miss',
    description: 'Frustrated reaction on a critical miss.',
    group: 'combat',
  },
  {
    id: 'target-immune',
    label: 'Target immune',
    description: 'Reaction when an attack has no effect.',
    group: 'combat',
  },
  {
    id: 'spell-disrupted',
    label: 'Spell disrupted',
    description: 'Reaction when casting is interrupted.',
    group: 'combat',
  },
  {
    id: 'party-member-death',
    label: 'Party member death',
    description: 'Reaction to another party member dying.',
    group: 'combat',
  },
  {
    id: 'selected-1',
    label: 'Selected 1',
    description: 'First selection acknowledgement.',
    group: 'selection',
  },
  {
    id: 'selected-2',
    label: 'Selected 2',
    description: 'Second selection acknowledgement.',
    group: 'selection',
  },
  {
    id: 'selected-3',
    label: 'Selected 3',
    description: 'Third selection acknowledgement.',
    group: 'selection',
  },
  {
    id: 'selected-4',
    label: 'Selected 4',
    description: 'Fourth selection acknowledgement.',
    group: 'selection',
  },
  {
    id: 'tired',
    label: 'Tired',
    description: 'Spoken when the party has been idle a long time.',
    group: 'selection',
  },
  {
    id: 'bored',
    label: 'Bored',
    description: 'Idle banter when nothing is happening.',
    group: 'selection',
  },
  {
    id: 'action-1',
    label: 'Action 1',
    description: 'Acknowledgement when given an order.',
    group: 'actions',
  },
  {
    id: 'action-2',
    label: 'Action 2',
    description: 'Second action acknowledgement.',
    group: 'actions',
  },
  {
    id: 'action-3',
    label: 'Action 3',
    description: 'Third action acknowledgement.',
    group: 'actions',
  },
  {
    id: 'action-4',
    label: 'Action 4',
    description: 'Fourth action acknowledgement.',
    group: 'actions',
  },
  {
    id: 'action-5',
    label: 'Action 5',
    description: 'Fifth action acknowledgement.',
    group: 'actions',
  },
  {
    id: 'action-6',
    label: 'Action 6',
    description: 'Sixth action acknowledgement.',
    group: 'actions',
  },
  {
    id: 'action-7',
    label: 'Action 7',
    description: 'Seventh action acknowledgement.',
    group: 'actions',
  },
  {
    id: 'rare-action-1',
    label: 'Rare action 1',
    description: 'Infrequent action acknowledgement variant.',
    group: 'actions',
  },
  {
    id: 'rare-action-2',
    label: 'Rare action 2',
    description: 'Second infrequent action acknowledgement.',
    group: 'actions',
  },
  {
    id: 'in-forest',
    label: 'In forest',
    description: 'Ambient remark in forest areas.',
    group: 'environment',
  },
  {
    id: 'in-city',
    label: 'In city',
    description: 'Ambient remark in towns and cities.',
    group: 'environment',
  },
  {
    id: 'in-dungeon',
    label: 'In dungeon',
    description: 'Ambient remark underground.',
    group: 'environment',
  },
  {
    id: 'daytime',
    label: 'Daytime',
    description: 'Ambient remark during the day.',
    group: 'environment',
  },
  {
    id: 'nighttime',
    label: 'Nighttime',
    description: 'Ambient remark at night.',
    group: 'environment',
  },
  {
    id: 'inventory-full',
    label: 'Inventory full',
    description: 'Reaction when loot cannot be picked up.',
    group: 'skills',
  },
  {
    id: 'pickpocket-success',
    label: 'Pickpocket success',
    description: 'Reaction after a successful steal.',
    group: 'skills',
  },
  {
    id: 'hide-in-shadows-success',
    label: 'Hide in shadows success',
    description: 'Reaction after hiding successfully.',
    group: 'skills',
  },
  {
    id: 'trap-set-success',
    label: 'Trap set successfully',
    description: 'Reaction after placing a trap.',
    group: 'skills',
  },
]

export const AUDIO_TRIGGER_IDS = AUDIO_TRIGGER_DEFINITIONS.map((entry) => entry.id)

export type AudioProfileTriggers = Record<AudioTriggerId, string | null>

export interface AudioProfileCustomTrigger {
  id: string
  label: string
  description: string
  mediaId: string | null
}

export interface AudioProfile {
  id: string
  name: string
  description: string
  triggers: AudioProfileTriggers
  customTriggers: AudioProfileCustomTrigger[]
  updatedAt: string
}

export type AudioProfilePatch = Partial<
  Pick<AudioProfile, 'name' | 'description' | 'triggers' | 'customTriggers'>
>

export type AudioProfileCustomTriggerPatch = Partial<
  Pick<AudioProfileCustomTrigger, 'label' | 'description' | 'mediaId'>
>

export function createAudioProfileId(): string {
  return `audio-profile-${crypto.randomUUID().slice(0, 8)}`
}

export function createCustomTriggerId(): string {
  return `audio-trigger-${crypto.randomUUID().slice(0, 8)}`
}

export function createEmptyTriggers(): AudioProfileTriggers {
  return Object.fromEntries(AUDIO_TRIGGER_IDS.map((id) => [id, null])) as AudioProfileTriggers
}

export function normalizeTriggers(raw: Partial<AudioProfileTriggers> | undefined): AudioProfileTriggers {
  const empty = createEmptyTriggers()
  if (!raw) return empty

  for (const id of AUDIO_TRIGGER_IDS) {
    const value = raw[id]
    empty[id] = typeof value === 'string' && value.length > 0 ? value : null
  }

  return empty
}

export function normalizeCustomTrigger(
  raw: Partial<AudioProfileCustomTrigger> & { id: string },
): AudioProfileCustomTrigger {
  return {
    id: raw.id,
    label: raw.label?.trim() || 'Untitled trigger',
    description: raw.description ?? '',
    mediaId: typeof raw.mediaId === 'string' && raw.mediaId.length > 0 ? raw.mediaId : null,
  }
}

export function normalizeCustomTriggers(
  raw: Partial<AudioProfileCustomTrigger>[] | undefined,
): AudioProfileCustomTrigger[] {
  if (!raw?.length) return []
  return raw.map((entry) => normalizeCustomTrigger({ id: entry.id ?? createCustomTriggerId(), ...entry }))
}

export function normalizeAudioProfile(raw: Partial<AudioProfile> & { id: string }): AudioProfile {
  return {
    id: raw.id,
    name: raw.name ?? 'Untitled profile',
    description: raw.description ?? '',
    triggers: normalizeTriggers(raw.triggers),
    customTriggers: normalizeCustomTriggers(raw.customTriggers),
    updatedAt: raw.updatedAt ?? new Date().toISOString(),
  }
}

export function countFilledStandardTriggers(triggers: AudioProfileTriggers): number {
  return AUDIO_TRIGGER_IDS.filter((id) => triggers[id] !== null).length
}

export function countFilledCustomTriggers(customTriggers: AudioProfileCustomTrigger[]): number {
  return customTriggers.filter((trigger) => trigger.mediaId !== null).length
}

export function countFilledProfileTriggers(
  profile: Pick<AudioProfile, 'triggers' | 'customTriggers'>,
): number {
  return countFilledStandardTriggers(profile.triggers) + countFilledCustomTriggers(profile.customTriggers)
}

/** @deprecated Use countFilledProfileTriggers or countFilledStandardTriggers */
export function countFilledTriggers(triggers: AudioProfileTriggers): number {
  return countFilledStandardTriggers(triggers)
}

export function triggersByGroup(): Record<AudioTriggerGroupId, AudioTriggerDefinition[]> {
  const grouped = Object.fromEntries(
    Object.keys(AUDIO_TRIGGER_GROUP_LABELS).map((group) => [group, [] as AudioTriggerDefinition[]]),
  ) as Record<AudioTriggerGroupId, AudioTriggerDefinition[]>

  for (const definition of AUDIO_TRIGGER_DEFINITIONS) {
    grouped[definition.group].push(definition)
  }

  return grouped
}
