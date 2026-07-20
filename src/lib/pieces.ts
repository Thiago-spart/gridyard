export type PieceType = 'pallet' | 'shelf' | 'crate' | 'workstation' | 'custom';

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
  custom: { type: 'custom', label: 'Custom', width: 1, depth: 1, color: '#c65b4a' },
};

export interface PieceInstance {
  id: string;
  type: PieceType;
  gridX: number;
  gridY: number;
  rotation: 0 | 90;
  colorOverride?: string;
  widthOverride?: number;
  depthOverride?: number;
  labelOverride?: string;
}

export function getBaseFootprint(
  instance: Pick<PieceInstance, 'type' | 'widthOverride' | 'depthOverride'>,
): { width: number; depth: number } {
  const def = PIECE_DEFS[instance.type];
  return {
    width: instance.widthOverride ?? def.width,
    depth: instance.depthOverride ?? def.depth,
  };
}

export function getFootprint(
  instance: Pick<PieceInstance, 'type' | 'rotation' | 'widthOverride' | 'depthOverride'>,
): { width: number; depth: number } {
  const { width, depth } = getBaseFootprint(instance);
  return instance.rotation === 90 ? { width: depth, depth: width } : { width, depth };
}

export function getPieceColor(instance: Pick<PieceInstance, 'type' | 'colorOverride'>): string {
  return instance.colorOverride ?? PIECE_DEFS[instance.type].color;
}

export function getPieceLabel(instance: Pick<PieceInstance, 'type' | 'labelOverride'>): string {
  return instance.labelOverride ?? PIECE_DEFS[instance.type].label;
}
