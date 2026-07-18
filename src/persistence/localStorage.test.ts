import { beforeEach, describe, expect, it } from 'vitest';
import { saveScene, loadScene } from './localStorage';
import type { PieceInstance } from '../lib/pieces';

describe('localStorage persistence', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('returns null when nothing has been saved', () => {
    expect(loadScene()).toBeNull();
  });

  it('round-trips a saved scene', () => {
    const pieces: PieceInstance[] = [{ id: 'a', type: 'pallet', gridX: 0, gridY: 0, rotation: 0 }];
    saveScene(pieces);
    expect(loadScene()).toEqual(pieces);
  });

  it('returns null for malformed stored JSON instead of throwing', () => {
    localStorage.setItem('warehouse-layout-scene', '{not json');
    expect(loadScene()).toBeNull();
  });
});
