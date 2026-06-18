import type { MapRenderEngine } from './renderEngineTypes'

export const PREVIEW_GRID_SIZE = 12

export const ANIMATION_RENDER_ENGINES: { id: MapRenderEngine; label: string }[] = [
  { id: 'de-otterer', label: 'De-Otterer' },
]

export type AnimationRenderEngine = MapRenderEngine

export type StepTiming = 'after_previous' | 'with_previous'

export type AnimationMotion = 'move' | 'loop_move' | 'rotate' | 'move_rotate' | 'scale' | 'fade'

export type AnimationEasing = 'linear' | 'ease_in' | 'ease_out' | 'ease_in_out'

export type PositionAnchorKind =
  | 'main_character'
  | 'acting_character'
  | 'target'
  | 'nearest_ally'
  | 'nearest_enemy'
  | 'map_center'
  | 'map_nw'
  | 'map_n'
  | 'map_ne'
  | 'map_w'
  | 'map_e'
  | 'map_sw'
  | 'map_s'
  | 'map_se'
  | 'fixed'

export interface PositionAnchor {
  kind: PositionAnchorKind
  offsetX: number
  offsetY: number
  fixedX: number | null
  fixedY: number | null
}

export interface IconStyle {
  iconId: string | null
  scale: number
  opacity: number
  rotation: number
}

export interface AnimationStep {
  id: string
  label: string
  timing: StepTiming
  startAnchor: PositionAnchor
  endAnchor: PositionAnchor
  startIcon: IconStyle
  endIcon: IconStyle
  motion: AnimationMotion
  durationMs: number
  delayMs: number
  holdBeforeMs: number
  holdAfterMs: number
  easing: AnimationEasing
  audioProfileId: string | null
  audioDelayMs: number
}

export interface AnimationDefinition {
  id: string
  name: string
  renderEngine: AnimationRenderEngine
  steps: AnimationStep[]
  updatedAt: string
}

export type AnimationTrigger =
  | 'on_use'
  | 'on_attack'
  | 'on_hit'
  | 'on_miss'
  | 'on_equip'
  | 'on_unequip'
  | 'on_event'
  | 'on_trigger'

export interface AnimationBinding {
  id: string
  animationId: string
  trigger: AnimationTrigger
  /** Same order plays in parallel; next order waits for the previous group's longest animation. */
  order: number
}

export interface AnimationsContent {
  definitions: AnimationDefinition[]
  mapEventBindings: Record<string, AnimationBinding[]>
  hookBindings: Record<string, AnimationBinding[]>
}

export const STEP_TIMING_LABELS: Record<StepTiming, string> = {
  after_previous: 'After previous step',
  with_previous: 'With previous step',
}

export const ANIMATION_MOTION_LABELS: Record<AnimationMotion, string> = {
  move: 'Move',
  loop_move: 'Loop move',
  rotate: 'Rotate',
  move_rotate: 'Move + rotate',
  scale: 'Scale',
  fade: 'Fade',
}

export const ANIMATION_EASING_LABELS: Record<AnimationEasing, string> = {
  linear: 'Linear',
  ease_in: 'Ease in',
  ease_out: 'Ease out',
  ease_in_out: 'Ease in-out',
}

export const POSITION_ANCHOR_LABELS: Record<PositionAnchorKind, string> = {
  main_character: 'Main character',
  acting_character: 'Acting character',
  target: 'Target',
  nearest_ally: 'Nearest ally',
  nearest_enemy: 'Nearest enemy',
  map_center: 'Map center',
  map_nw: 'Map NW',
  map_n: 'Map N',
  map_ne: 'Map NE',
  map_w: 'Map W',
  map_e: 'Map E',
  map_sw: 'Map SW',
  map_s: 'Map S',
  map_se: 'Map SE',
  fixed: 'Fixed coordinates',
}

export const ANIMATION_TRIGGER_LABELS: Record<AnimationTrigger, string> = {
  on_use: 'On use',
  on_attack: 'On attack',
  on_hit: 'On hit',
  on_miss: 'On miss',
  on_equip: 'On equip',
  on_unequip: 'On unequip',
  on_event: 'On event',
  on_trigger: 'On trigger',
}

export const PREVIEW_DUMMY_POSITIONS = {
  main: { x: 5, y: 6 },
  acting: { x: 5, y: 5 },
  ally: { x: 4, y: 6 },
  enemy1: { x: 7, y: 4 },
  enemy2: { x: 7, y: 8 },
  target: { x: 6, y: 5 },
} as const

export function createAnimationId(): string {
  return `anim-${crypto.randomUUID().slice(0, 8)}`
}

export function createAnimationStepId(): string {
  return `anim-step-${crypto.randomUUID().slice(0, 8)}`
}

export function createAnimationBindingId(): string {
  return `anim-bind-${crypto.randomUUID().slice(0, 8)}`
}

export function createDefaultPositionAnchor(kind: PositionAnchorKind = 'main_character'): PositionAnchor {
  return {
    kind,
    offsetX: 0,
    offsetY: 0,
    fixedX: null,
    fixedY: null,
  }
}

export function createDefaultIconStyle(): IconStyle {
  return {
    iconId: null,
    scale: 1,
    opacity: 1,
    rotation: 0,
  }
}

export function createEmptyAnimationStep(index = 1): AnimationStep {
  return {
    id: createAnimationStepId(),
    label: `Step ${index}`,
    timing: 'after_previous',
    startAnchor: createDefaultPositionAnchor('main_character'),
    endAnchor: createDefaultPositionAnchor('target'),
    startIcon: createDefaultIconStyle(),
    endIcon: createDefaultIconStyle(),
    motion: 'move',
    durationMs: 400,
    delayMs: 0,
    holdBeforeMs: 0,
    holdAfterMs: 0,
    easing: 'ease_out',
    audioProfileId: null,
    audioDelayMs: 0,
  }
}

export function createEmptyAnimationDefinition(
  renderEngine: AnimationRenderEngine = 'de-otterer',
  name = 'New animation',
): AnimationDefinition {
  return {
    id: createAnimationId(),
    name,
    renderEngine,
    steps: [],
    updatedAt: new Date().toISOString(),
  }
}

export function createEmptyAnimationsContent(): AnimationsContent {
  return { definitions: [], mapEventBindings: {}, hookBindings: {} }
}

function clampNumber(value: unknown, fallback: number, min: number, max: number): number {
  const parsed = typeof value === 'number' && Number.isFinite(value) ? value : fallback
  return Math.min(max, Math.max(min, parsed))
}

function normalizePositionAnchorKind(value: unknown): PositionAnchorKind {
  if (typeof value === 'string' && value in POSITION_ANCHOR_LABELS) {
    return value as PositionAnchorKind
  }
  return 'main_character'
}

export function normalizePositionAnchor(raw: Partial<PositionAnchor> | undefined): PositionAnchor {
  const kind = normalizePositionAnchorKind(raw?.kind)
  return {
    kind,
    offsetX: clampNumber(raw?.offsetX, 0, -PREVIEW_GRID_SIZE, PREVIEW_GRID_SIZE),
    offsetY: clampNumber(raw?.offsetY, 0, -PREVIEW_GRID_SIZE, PREVIEW_GRID_SIZE),
    fixedX:
      kind === 'fixed' && typeof raw?.fixedX === 'number' && Number.isFinite(raw.fixedX)
        ? clampNumber(raw.fixedX, 0, 0, PREVIEW_GRID_SIZE - 1)
        : null,
    fixedY:
      kind === 'fixed' && typeof raw?.fixedY === 'number' && Number.isFinite(raw.fixedY)
        ? clampNumber(raw.fixedY, 0, 0, PREVIEW_GRID_SIZE - 1)
        : null,
  }
}

export function normalizeIconStyle(raw: Partial<IconStyle> | undefined): IconStyle {
  return {
    iconId: typeof raw?.iconId === 'string' && raw.iconId.trim() ? raw.iconId.trim() : null,
    scale: clampNumber(raw?.scale, 1, 0.1, 4),
    opacity: clampNumber(raw?.opacity, 1, 0, 1),
    rotation: clampNumber(raw?.rotation, 0, -360, 360),
  }
}

function normalizeStepTiming(value: unknown): StepTiming {
  return value === 'with_previous' ? 'with_previous' : 'after_previous'
}

function normalizeMotion(value: unknown): AnimationMotion {
  if (typeof value === 'string' && value in ANIMATION_MOTION_LABELS) {
    return value as AnimationMotion
  }
  return 'move'
}

function normalizeEasing(value: unknown): AnimationEasing {
  if (typeof value === 'string' && value in ANIMATION_EASING_LABELS) {
    return value as AnimationEasing
  }
  return 'ease_out'
}

export function normalizeAnimationStep(raw: Partial<AnimationStep> | undefined): AnimationStep {
  return {
    id: typeof raw?.id === 'string' && raw.id.trim() ? raw.id.trim() : createAnimationStepId(),
    label: typeof raw?.label === 'string' && raw.label.trim() ? raw.label.trim() : 'Step',
    timing: normalizeStepTiming(raw?.timing),
    startAnchor: normalizePositionAnchor(raw?.startAnchor),
    endAnchor: normalizePositionAnchor(raw?.endAnchor),
    startIcon: normalizeIconStyle(raw?.startIcon),
    endIcon: normalizeIconStyle(raw?.endIcon),
    motion: normalizeMotion(raw?.motion),
    durationMs: clampNumber(raw?.durationMs, 400, 0, 60_000),
    delayMs: clampNumber(raw?.delayMs, 0, 0, 60_000),
    holdBeforeMs: clampNumber(raw?.holdBeforeMs, 0, 0, 60_000),
    holdAfterMs: clampNumber(raw?.holdAfterMs, 0, 0, 60_000),
    easing: normalizeEasing(raw?.easing),
    audioProfileId:
      typeof raw?.audioProfileId === 'string' && raw.audioProfileId.trim()
        ? raw.audioProfileId.trim()
        : null,
    audioDelayMs: clampNumber(raw?.audioDelayMs, 0, 0, 60_000),
  }
}

export function normalizeAnimationDefinition(
  raw: Partial<AnimationDefinition> | undefined,
): AnimationDefinition {
  const renderEngine: AnimationRenderEngine =
    raw?.renderEngine === 'de-otterer' ? 'de-otterer' : 'de-otterer'
  return {
    id: typeof raw?.id === 'string' && raw.id.trim() ? raw.id.trim() : createAnimationId(),
    name: typeof raw?.name === 'string' && raw.name.trim() ? raw.name.trim() : 'New animation',
    renderEngine,
    steps: Array.isArray(raw?.steps) ? raw.steps.map((step) => normalizeAnimationStep(step)) : [],
    updatedAt:
      typeof raw?.updatedAt === 'string' && raw.updatedAt.trim()
        ? raw.updatedAt
        : new Date().toISOString(),
  }
}

function normalizeAnimationTrigger(value: unknown): AnimationTrigger {
  if (typeof value === 'string' && value in ANIMATION_TRIGGER_LABELS) {
    return value as AnimationTrigger
  }
  return 'on_use'
}

export function normalizeAnimationBinding(raw: Partial<AnimationBinding> | undefined): AnimationBinding {
  return {
    id:
      typeof raw?.id === 'string' && raw.id.trim() ? raw.id.trim() : createAnimationBindingId(),
    animationId: typeof raw?.animationId === 'string' ? raw.animationId : '',
    trigger: normalizeAnimationTrigger(raw?.trigger),
    order: clampNumber(raw?.order, 0, 0, 999),
  }
}

export function normalizeAnimationsContent(raw: AnimationsContent | undefined): AnimationsContent {
  const mapEventBindings: Record<string, AnimationBinding[]> = {}
  for (const [eventId, bindings] of Object.entries(raw?.mapEventBindings ?? {})) {
    if (!eventId.trim()) continue
    mapEventBindings[eventId] = Array.isArray(bindings)
      ? bindings.map((entry) => normalizeAnimationBinding(entry))
      : []
  }

  const hookBindings: Record<string, AnimationBinding[]> = {}
  for (const [hookId, bindings] of Object.entries(raw?.hookBindings ?? {})) {
    if (!hookId.trim()) continue
    hookBindings[hookId] = Array.isArray(bindings)
      ? bindings.map((entry) => normalizeAnimationBinding(entry))
      : []
  }

  return {
    definitions: Array.isArray(raw?.definitions)
      ? raw.definitions.map((entry) => normalizeAnimationDefinition(entry))
      : [],
    mapEventBindings,
    hookBindings,
  }
}
