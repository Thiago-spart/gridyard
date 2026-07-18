import { describe, expect, it } from 'vitest';
import { formatSize, formatDistance } from './measurement';
import type { PieceInstance } from './pieces';

describe('formatSize', () => {
  it('formats a 1x1 piece using the 1.2m cell scale', () => {
    const pallet: PieceInstance = { id: 'a', type: 'pallet', gridX: 0, gridY: 0, rotation: 0 };
    expect(formatSize(pallet)).toBe('1.2m × 1.2m');
  });

  it('formats a 2x1 piece', () => {
    const shelf: PieceInstance = { id: 'b', type: 'shelf', gridX: 0, gridY: 0, rotation: 0 };
    expect(formatSize(shelf)).toBe('2.4m × 1.2m');
  });
});

describe('formatDistance', () => {
  it('formats the distance between two piece centers', () => {
    const a: PieceInstance = { id: 'a', type: 'pallet', gridX: 0, gridY: 0, rotation: 0 };
    const b: PieceInstance = { id: 'b', type: 'pallet', gridX: 3, gridY: 0, rotation: 0 };
    expect(formatDistance(a, b)).toBe('3.6m');
  });
});
