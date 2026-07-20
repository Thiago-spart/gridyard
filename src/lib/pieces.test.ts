import { describe, expect, it } from 'vitest';
import { PIECE_DEFS, getFootprint, getPieceColor, getBaseFootprint, getPieceLabel } from './pieces';

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

describe('getBaseFootprint', () => {
  it('returns the type default when there is no override', () => {
    expect(getBaseFootprint({ type: 'shelf' })).toEqual({ width: 2, depth: 1 });
  });

  it('returns overridden width/depth independently', () => {
    expect(getBaseFootprint({ type: 'shelf', widthOverride: 5 })).toEqual({ width: 5, depth: 1 });
    expect(getBaseFootprint({ type: 'shelf', depthOverride: 3 })).toEqual({ width: 2, depth: 3 });
    expect(getBaseFootprint({ type: 'shelf', widthOverride: 5, depthOverride: 3 })).toEqual({
      width: 5,
      depth: 3,
    });
  });
});

describe('getFootprint (with overrides)', () => {
  it('applies the rotation swap on top of resolved overrides', () => {
    expect(getFootprint({ type: 'shelf', rotation: 90, widthOverride: 5, depthOverride: 3 })).toEqual({
      width: 3,
      depth: 5,
    });
  });
});

describe('getPieceLabel', () => {
  it('returns the type default when there is no override', () => {
    expect(getPieceLabel({ type: 'crate' })).toBe(PIECE_DEFS.crate.label);
  });

  it('returns the override when one is set', () => {
    expect(getPieceLabel({ type: 'crate', labelOverride: 'My Crate' })).toBe('My Crate');
  });
});
