/** Stable ids for built-in De-Otterer icons (see BUILTIN_DE_OTTERER_ICONS). */
export const DE_OTTERER_BUILTIN_ICON_IDS = {
  stickman: 'stickman',
  treasureChest: 'treasure-chest',
  eventStar: 'event-star',
  mapEntrance: 'map-entrance',
} as const

export type DeOttererBuiltinIconId =
  (typeof DE_OTTERER_BUILTIN_ICON_IDS)[keyof typeof DE_OTTERER_BUILTIN_ICON_IDS]
