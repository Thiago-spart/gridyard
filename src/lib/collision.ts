import { getFootprint, type PieceInstance } from './pieces';

export interface Rect {
  x: number;
  y: number;
  width: number;
  depth: number;
}

export function pieceRect(piece: PieceInstance): Rect {
  const { width, depth } = getFootprint(piece);
  return { x: piece.gridX, y: piece.gridY, width, depth };
}

export function rectsOverlap(a: Rect, b: Rect): boolean {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.depth &&
    a.y + a.depth > b.y
  );
}

export function hasCollision(candidate: PieceInstance, others: PieceInstance[]): boolean {
  const candidateRect = pieceRect(candidate);
  return others
    .filter((p) => p.id !== candidate.id)
    .some((p) => rectsOverlap(candidateRect, pieceRect(p)));
}
