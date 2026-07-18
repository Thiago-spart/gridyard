import { CELL_SIZE_METERS } from './grid';
import { getFootprint, type PieceInstance } from './pieces';

export function formatSize(piece: PieceInstance): string {
  const { width, depth } = getFootprint(piece);
  const w = (width * CELL_SIZE_METERS).toFixed(1);
  const d = (depth * CELL_SIZE_METERS).toFixed(1);
  return `${w}m × ${d}m`;
}

export function pieceCenter(piece: PieceInstance): { x: number; y: number } {
  const { width, depth } = getFootprint(piece);
  return {
    x: (piece.gridX + width / 2) * CELL_SIZE_METERS,
    y: (piece.gridY + depth / 2) * CELL_SIZE_METERS,
  };
}

export function formatDistance(a: PieceInstance, b: PieceInstance): string {
  const ca = pieceCenter(a);
  const cb = pieceCenter(b);
  const dist = Math.hypot(ca.x - cb.x, ca.y - cb.y);
  return `${dist.toFixed(1)}m`;
}
