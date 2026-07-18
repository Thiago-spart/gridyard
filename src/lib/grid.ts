export const BOARD_WIDTH = 10; // cells
export const BOARD_DEPTH = 8; // cells
export const CELL_SIZE_METERS = 1.2;

export function clampToBoard(
  gridX: number,
  gridY: number,
  width: number,
  depth: number,
): { gridX: number; gridY: number } {
  const maxX = Math.max(BOARD_WIDTH - width, 0);
  const maxY = Math.max(BOARD_DEPTH - depth, 0);
  return {
    gridX: Math.min(Math.max(gridX, 0), maxX),
    gridY: Math.min(Math.max(gridY, 0), maxY),
  };
}

export function worldToGrid(
  x: number,
  z: number,
  width: number,
  depth: number,
): { gridX: number; gridY: number } {
  const rawX = Math.round(x / CELL_SIZE_METERS - width / 2);
  const rawY = Math.round(z / CELL_SIZE_METERS - depth / 2);
  return clampToBoard(rawX, rawY, width, depth);
}
