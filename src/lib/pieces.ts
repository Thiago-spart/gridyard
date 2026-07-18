export type PieceType = 'pallet' | 'shelf' | 'crate' | 'workstation';

export interface PieceDef {
  type: PieceType;
  label: string;
  width: number; // grid cells, at rotation 0
  depth: number;
  color: string;
}

export const PIECE_DEFS: Record<PieceType, PieceDef> = {
  pallet: { type: 'pallet', label: 'Pallet', width: 1, depth: 1, color: '#c8a165' },
  shelf: { type: 'shelf', label: 'Shelf', width: 2, depth: 1, color: '#6b8ca6' },
  crate: { type: 'crate', label: 'Crate', width: 1, depth: 1, color: '#e08a3c' },
  workstation: { type: 'workstation', label: 'Workstation', width: 2, depth: 2, color: '#4a4a52' },
};

export interface PieceInstance {
  id: string;
  type: PieceType;
  gridX: number;
  gridY: number;
  rotation: 0 | 90;
}

export function getFootprint(
  instance: Pick<PieceInstance, 'type' | 'rotation'>,
): { width: number; depth: number } {
  const def = PIECE_DEFS[instance.type];
  return instance.rotation === 90
    ? { width: def.depth, depth: def.width }
    : { width: def.width, depth: def.depth };
}
