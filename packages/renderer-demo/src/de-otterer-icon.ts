import type { DeOttererIconSnapshot } from '@otter/renderer-api'

export function createDeOttererIconElement(
  icon: DeOttererIconSnapshot,
  size = 24,
): SVGSVGElement {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
  svg.setAttribute('viewBox', icon.viewBox)
  svg.setAttribute('width', String(size))
  svg.setAttribute('height', String(size))
  svg.setAttribute('aria-hidden', 'true')

  for (const pathData of icon.paths) {
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path')
    path.setAttribute('d', pathData)
    path.setAttribute('fill', icon.fill)
    path.setAttribute('stroke', icon.stroke)
    path.setAttribute('stroke-width', String(icon.strokeWidth))
    path.setAttribute('stroke-linejoin', 'round')
    path.setAttribute('stroke-linecap', 'round')
    svg.appendChild(path)
  }

  return svg
}
