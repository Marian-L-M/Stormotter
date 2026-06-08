/** A single occupied grid cell in sparse storage. */
export interface Cell {
  x: number
  y: number
  layer: string
  /** Content reference from the otterfile (e.g. character:hero). */
  contentId: string
}

/** Headless world model — no renderer or DOM imports. */
export interface WorldModel {
  width: number
  height: number
  layers: readonly string[]
  cells: Map<string, Cell>
}

export function cellKey(x: number, y: number, layer: string): string {
  return `${x},${y},${layer}`
}

export function createEmptyWorld(
  width: number,
  height: number,
  layers: readonly string[] = ['ground'],
): WorldModel {
  return {
    width,
    height,
    layers,
    cells: new Map(),
  }
}

/** Query occupied cells intersecting an axis-aligned rect on a layer. */
export function getCellsInRect(
  world: WorldModel,
  rect: { x: number; y: number; width: number; height: number },
  layer: string,
): Cell[] {
  const result: Cell[] = []
  const xMax = rect.x + rect.width
  const yMax = rect.y + rect.height

  for (const cell of world.cells.values()) {
    if (cell.layer !== layer) continue
    if (cell.x < rect.x || cell.x >= xMax) continue
    if (cell.y < rect.y || cell.y >= yMax) continue
    result.push(cell)
  }

  return result
}
