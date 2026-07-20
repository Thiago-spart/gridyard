import { BOARD_WIDTH, BOARD_DEPTH } from './grid';
import { hasCollision } from './collision';
import type { PieceInstance } from './pieces';

export function findFreeSpot(
  width: number,
  depth: number,
  pieces: PieceInstance[],
  excludeId?: string,
): { gridX: number; gridY: number } | null {
  if (width > BOARD_WIDTH || depth > BOARD_DEPTH) return null;

  for (let gridY = 0; gridY <= BOARD_DEPTH - depth; gridY++) {
    for (let gridX = 0; gridX <= BOARD_WIDTH - width; gridX++) {
      const candidate: PieceInstance = {
        id: excludeId ?? '__placement-probe__',
        type: 'custom',
        gridX,
        gridY,
        rotation: 0,
        widthOverride: width,
        depthOverride: depth,
      };
      if (!hasCollision(candidate, pieces)) {
        return { gridX, gridY };
      }
    }
  }
  return null;
}
