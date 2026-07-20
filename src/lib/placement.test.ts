import { describe, expect, it } from 'vitest';
import { findFreeSpot } from './placement';
import type { PieceInstance } from './pieces';

const EMPTY: PieceInstance[] = [];

describe('findFreeSpot', () => {
  it('returns the top-left origin when the board is empty', () => {
    expect(findFreeSpot(2, 2, EMPTY)).toEqual({ gridX: 0, gridY: 0 });
  });

  it('returns null when width exceeds the board', () => {
    expect(findFreeSpot(11, 1, EMPTY)).toBeNull();
  });

  it('returns null when depth exceeds the board', () => {
    expect(findFreeSpot(1, 9, EMPTY)).toBeNull();
  });

  it('skips occupied cells and finds the next free spot', () => {
    const occupied: PieceInstance[] = [{ id: 'a', type: 'pallet', gridX: 0, gridY: 0, rotation: 0 }];
    expect(findFreeSpot(1, 1, occupied)).toEqual({ gridX: 1, gridY: 0 });
  });

  it('returns null when the board is completely full for that size', () => {
    const occupied: PieceInstance[] = [
      { id: 'a', type: 'custom', gridX: 0, gridY: 0, rotation: 0, widthOverride: 10, depthOverride: 8 },
    ];
    expect(findFreeSpot(1, 1, occupied)).toBeNull();
  });

  it('excludes the given id from collision, so a piece can find a spot around itself', () => {
    const occupied: PieceInstance[] = [{ id: 'a', type: 'pallet', gridX: 0, gridY: 0, rotation: 0 }];
    expect(findFreeSpot(1, 1, occupied, 'a')).toEqual({ gridX: 0, gridY: 0 });
  });
});
