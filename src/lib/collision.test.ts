import { describe, expect, it } from 'vitest';
import { hasCollision, rectsOverlap } from './collision';
import type { PieceInstance } from './pieces';

describe('rectsOverlap', () => {
  it('detects overlapping rectangles', () => {
    expect(
      rectsOverlap({ x: 0, y: 0, width: 2, depth: 2 }, { x: 1, y: 1, width: 2, depth: 2 }),
    ).toBe(true);
  });

  it('treats touching (adjacent) rectangles as not overlapping', () => {
    expect(
      rectsOverlap({ x: 0, y: 0, width: 2, depth: 2 }, { x: 2, y: 0, width: 2, depth: 2 }),
    ).toBe(false);
  });

  it('treats separate rectangles as not overlapping', () => {
    expect(
      rectsOverlap({ x: 0, y: 0, width: 1, depth: 1 }, { x: 5, y: 5, width: 1, depth: 1 }),
    ).toBe(false);
  });
});

describe('hasCollision', () => {
  const others: PieceInstance[] = [
    { id: 'a', type: 'pallet', gridX: 0, gridY: 0, rotation: 0 },
  ];

  it('returns true when the candidate overlaps another piece', () => {
    const candidate: PieceInstance = { id: 'b', type: 'crate', gridX: 0, gridY: 0, rotation: 0 };
    expect(hasCollision(candidate, others)).toBe(true);
  });

  it('returns false when the candidate does not overlap any other piece', () => {
    const candidate: PieceInstance = { id: 'b', type: 'crate', gridX: 5, gridY: 5, rotation: 0 };
    expect(hasCollision(candidate, others)).toBe(false);
  });

  it('ignores the candidate against its own previous position (same id)', () => {
    const candidate: PieceInstance = { id: 'a', type: 'pallet', gridX: 0, gridY: 0, rotation: 0 };
    expect(hasCollision(candidate, others)).toBe(false);
  });
});
