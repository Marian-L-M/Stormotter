/** Layout constants matching @otter/renderer-demo grid (2rem cells, 2px gap). */
export const PREVIEW_CELL_PX = 32
export const PREVIEW_GRID_GAP_PX = 2
export const PREVIEW_AXIS_COL_PX = 32
export const PREVIEW_AXIS_ROW_PX = 20
export const PREVIEW_GRID_PADDING_PX = 8

export const PREVIEW_CELL_STRIDE_PX = PREVIEW_CELL_PX + PREVIEW_GRID_GAP_PX

export interface PreviewPan {
  x: number
  y: number
}

export function cellTopLeftPx(x: number, y: number): { x: number; y: number } {
  return {
    x: PREVIEW_GRID_PADDING_PX + PREVIEW_AXIS_COL_PX + x * PREVIEW_CELL_STRIDE_PX,
    y: PREVIEW_GRID_PADDING_PX + PREVIEW_AXIS_ROW_PX + y * PREVIEW_CELL_STRIDE_PX,
  }
}

export function gridPixelSize(width: number, height: number): { width: number; height: number } {
  return {
    width:
      PREVIEW_GRID_PADDING_PX * 2 +
      PREVIEW_AXIS_COL_PX +
      width * PREVIEW_CELL_PX +
      Math.max(0, width - 1) * PREVIEW_GRID_GAP_PX,
    height:
      PREVIEW_GRID_PADDING_PX * 2 +
      PREVIEW_AXIS_ROW_PX +
      height * PREVIEW_CELL_PX +
      Math.max(0, height - 1) * PREVIEW_GRID_GAP_PX,
  }
}

export function clampPan(
  pan: PreviewPan,
  viewportWidth: number,
  viewportHeight: number,
  gridWidth: number,
  gridHeight: number,
): PreviewPan {
  const grid = gridPixelSize(gridWidth, gridHeight)
  const maxX = Math.max(0, grid.width - viewportWidth)
  const maxY = Math.max(0, grid.height - viewportHeight)
  return {
    x: Math.min(Math.max(0, pan.x), maxX),
    y: Math.min(Math.max(0, pan.y), maxY),
  }
}

export function centerPanOnCell(
  cellX: number,
  cellY: number,
  viewportWidth: number,
  viewportHeight: number,
  gridWidth: number,
  gridHeight: number,
): PreviewPan {
  const topLeft = cellTopLeftPx(cellX, cellY)
  const centerX = topLeft.x + PREVIEW_CELL_PX / 2
  const centerY = topLeft.y + PREVIEW_CELL_PX / 2
  return clampPan(
    {
      x: centerX - viewportWidth / 2,
      y: centerY - viewportHeight / 2,
    },
    viewportWidth,
    viewportHeight,
    gridWidth,
    gridHeight,
  )
}

const FOLLOW_MARGIN_CELLS = 2

export function adjustPanToFollowCharacter(
  pan: PreviewPan,
  cellX: number,
  cellY: number,
  viewportWidth: number,
  viewportHeight: number,
  gridWidth: number,
  gridHeight: number,
): PreviewPan {
  const topLeft = cellTopLeftPx(cellX, cellY)
  const charLeft = topLeft.x
  const charRight = topLeft.x + PREVIEW_CELL_PX
  const charTop = topLeft.y
  const charBottom = topLeft.y + PREVIEW_CELL_PX
  const margin = FOLLOW_MARGIN_CELLS * PREVIEW_CELL_STRIDE_PX

  let nextX = pan.x
  let nextY = pan.y

  const visibleLeft = pan.x
  const visibleRight = pan.x + viewportWidth
  const visibleTop = pan.y
  const visibleBottom = pan.y + viewportHeight

  if (charLeft - visibleLeft < margin) {
    nextX = charLeft - margin
  } else if (visibleRight - charRight < margin) {
    nextX = charRight + margin - viewportWidth
  }

  if (charTop - visibleTop < margin) {
    nextY = charTop - margin
  } else if (visibleBottom - charBottom < margin) {
    nextY = charBottom + margin - viewportHeight
  }

  return clampPan({ x: nextX, y: nextY }, viewportWidth, viewportHeight, gridWidth, gridHeight)
}
