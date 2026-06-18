import type {
  AnimationBinding,
  AnimationDefinition,
  AnimationEasing,
  AnimationStep,
  IconStyle,
} from './animationTypes'
import { resolvePositionAnchor, type PreviewStagingContext } from './animationAnchorUtils'

export interface StepTimelineEntry {
  stepId: string
  startMs: number
  motionStartMs: number
  motionEndMs: number
  endMs: number
}

export interface PlaybackSample {
  stepId: string
  progress: number
  x: number
  y: number
  icon: IconStyle
  visible: boolean
}

export function computeStepTimeline(steps: AnimationStep[]): StepTimelineEntry[] {
  const timeline: StepTimelineEntry[] = []
  let previousEndMs = 0
  let previousStartMs = 0

  for (const step of steps) {
    const startMs =
      step.timing === 'with_previous' && timeline.length > 0 ? previousStartMs : previousEndMs
    const motionStartMs = startMs + step.holdBeforeMs + step.delayMs
    const motionEndMs = motionStartMs + step.durationMs
    const endMs = motionEndMs + step.holdAfterMs

    timeline.push({ stepId: step.id, startMs, motionStartMs, motionEndMs, endMs })
    previousStartMs = startMs
    previousEndMs = Math.max(previousEndMs, endMs)
  }

  return timeline
}

export function getAnimationDurationMs(definition: AnimationDefinition): number {
  const timeline = computeStepTimeline(definition.steps)
  if (timeline.length === 0) return 0
  return Math.max(...timeline.map((entry) => entry.endMs))
}

export function applyEasing(progress: number, easing: AnimationEasing): number {
  const t = Math.min(1, Math.max(0, progress))
  switch (easing) {
    case 'ease_in':
      return t * t
    case 'ease_out':
      return 1 - (1 - t) * (1 - t)
    case 'ease_in_out':
      return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2
    default:
      return t
  }
}

function lerp(start: number, end: number, progress: number): number {
  return start + (end - start) * progress
}

function interpolateIconStyle(start: IconStyle, end: IconStyle, progress: number): IconStyle {
  const iconId = progress < 0.5 ? start.iconId : end.iconId
  return {
    iconId: iconId ?? start.iconId ?? end.iconId,
    scale: lerp(start.scale, end.scale, progress),
    opacity: lerp(start.opacity, end.opacity, progress),
    rotation: lerp(start.rotation, end.rotation, progress),
  }
}

export function sampleAnimationAtTime(
  definition: AnimationDefinition,
  elapsedMs: number,
  context: PreviewStagingContext,
): PlaybackSample[] {
  const timeline = computeStepTimeline(definition.steps)
  const samples: PlaybackSample[] = []

  for (let index = 0; index < definition.steps.length; index += 1) {
    const step = definition.steps[index]
    const entry = timeline[index]
    if (!entry || elapsedMs < entry.startMs || elapsedMs > entry.endMs) continue

    const startPos = resolvePositionAnchor(step.startAnchor, context)
    const endPos = resolvePositionAnchor(step.endAnchor, context)

    if (elapsedMs < entry.motionStartMs) {
      samples.push({
        stepId: step.id,
        progress: 0,
        x: startPos.x,
        y: startPos.y,
        icon: step.startIcon,
        visible: step.motion !== 'fade' || step.startIcon.opacity > 0,
      })
      continue
    }

    if (elapsedMs >= entry.motionEndMs) {
      samples.push({
        stepId: step.id,
        progress: 1,
        x: endPos.x,
        y: endPos.y,
        icon: step.endIcon,
        visible: step.motion !== 'fade' || step.endIcon.opacity > 0,
      })
      continue
    }

    const rawProgress =
      entry.motionEndMs === entry.motionStartMs
        ? 1
        : (elapsedMs - entry.motionStartMs) / (entry.motionEndMs - entry.motionStartMs)
    const eased = applyEasing(rawProgress, step.easing)

    let x = startPos.x
    let y = startPos.y
    if (step.motion === 'move' || step.motion === 'loop_move' || step.motion === 'move_rotate') {
      x = lerp(startPos.x, endPos.x, eased)
      y = lerp(startPos.y, endPos.y, eased)
      if (step.motion === 'loop_move' && rawProgress > 0.5) {
        const loopProgress = (rawProgress - 0.5) * 2
        const loopEased = applyEasing(loopProgress, step.easing)
        x = lerp(endPos.x, startPos.x, loopEased)
        y = lerp(endPos.y, startPos.y, loopEased)
      }
    }

    const icon = interpolateIconStyle(step.startIcon, step.endIcon, eased)
    if (step.motion === 'rotate' || step.motion === 'move_rotate') {
      icon.rotation = lerp(step.startIcon.rotation, step.endIcon.rotation, eased)
    }
    if (step.motion === 'scale') {
      icon.scale = lerp(step.startIcon.scale, step.endIcon.scale, eased)
    }
    if (step.motion === 'fade') {
      icon.opacity = lerp(step.startIcon.opacity, step.endIcon.opacity, eased)
    }

    samples.push({
      stepId: step.id,
      progress: eased,
      x,
      y,
      icon,
      visible: icon.opacity > 0.01,
    })
  }

  return samples
}

/** Playback rule C: group bindings by order; same order runs in parallel. */
export function groupBindingsByOrder(bindings: AnimationBinding[]): AnimationBinding[][] {
  const groups = new Map<number, AnimationBinding[]>()
  for (const binding of bindings) {
    const list = groups.get(binding.order) ?? []
    list.push(binding)
    groups.set(binding.order, list)
  }
  return [...groups.entries()]
    .sort(([left], [right]) => left - right)
    .map(([, group]) => group)
}

export async function playBindingGroupsSequentially(
  bindings: AnimationBinding[],
  playAnimation: (animationId: string) => Promise<void>,
): Promise<void> {
  for (const group of groupBindingsByOrder(bindings)) {
    await Promise.all(group.map((binding) => playAnimation(binding.animationId)))
  }
}
