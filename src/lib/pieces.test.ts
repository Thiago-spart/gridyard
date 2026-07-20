import { describe, expect, it } from 'vitest';
import { PIECE_DEFS, getFootprint, getPieceColor } from './pieces';

describe('getFootprint', () => {
  it('returns the unrotated width/depth at rotation 0', () => {
    expect(getFootprint({ type: 'shelf', rotation: 0 })).toEqual({ width: 2, depth: 1 });
  });

  it('swaps width/depth at rotation 90', () => {
    expect(getFootprint({ type: 'shelf', rotation: 90 })).toEqual({ width: 1, depth: 2 });
  });

  it('is unchanged for a symmetric 1x1 piece', () => {
    expect(getFootprint({ type: 'pallet', rotation: 90 })).toEqual({ width: 1, depth: 1 });
  });
});

describe('PIECE_DEFS', () => {
  it('has a positive footprint for every piece type', () => {
    for (const def of Object.values(PIECE_DEFS)) {
      expect(def.width).toBeGreaterThan(0);
      expect(def.depth).toBeGreaterThan(0);
    }
  });
});

describe('getPieceColor', () => {
  it('returns the type default when there is no override', () => {
    expect(getPieceColor({ type: 'crate' })).toBe(PIECE_DEFS.crate.color);
  });

  it('returns the override when one is set', () => {
    expect(getPieceColor({ type: 'crate', colorOverride: '#5f9e6f' })).toBe('#5f9e6f');
  });
});
