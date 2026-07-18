import { beforeEach, describe, expect, it } from 'vitest';
import { useSceneStore, INITIAL_PIECES } from './sceneStore';

function resetStore() {
  useSceneStore.setState({ pieces: INITIAL_PIECES, selectedIds: [], viewMode: 'top' });
}

beforeEach(() => {
  localStorage.clear();
  resetStore();
});

describe('selectPiece', () => {
  it('selects a piece when none is selected', () => {
    useSceneStore.getState().selectPiece('pallet-1');
    expect(useSceneStore.getState().selectedIds).toEqual(['pallet-1']);
  });

  it('adds a second, different piece to the selection', () => {
    useSceneStore.getState().selectPiece('pallet-1');
    useSceneStore.getState().selectPiece('shelf-1');
    expect(useSceneStore.getState().selectedIds).toEqual(['pallet-1', 'shelf-1']);
  });

  it('starts fresh when a third piece is clicked with two already selected', () => {
    useSceneStore.getState().selectPiece('pallet-1');
    useSceneStore.getState().selectPiece('shelf-1');
    useSceneStore.getState().selectPiece('crate-1');
    expect(useSceneStore.getState().selectedIds).toEqual(['crate-1']);
  });
});

describe('movePiece', () => {
  it('moves a piece to a free position and returns true', () => {
    const result = useSceneStore.getState().movePiece('pallet-1', 8 * 1.2 + 0.1, 7 * 1.2 + 0.1);
    expect(result).toBe(true);
    const moved = useSceneStore.getState().pieces.find((p) => p.id === 'pallet-1');
    expect(moved?.gridX).toBe(8);
    expect(moved?.gridY).toBe(7);
  });

  it('rejects a move onto an occupied cell and returns false', () => {
    // shelf-1 occupies gridX 3-4, gridY 0
    const result = useSceneStore.getState().movePiece('pallet-1', 3 * 1.2 + 0.1, 0 * 1.2 + 0.1);
    expect(result).toBe(false);
    const pallet = useSceneStore.getState().pieces.find((p) => p.id === 'pallet-1');
    expect(pallet?.gridX).toBe(0);
    expect(pallet?.gridY).toBe(0);
  });
});

describe('rotatePiece', () => {
  it('toggles rotation between 0 and 90', () => {
    useSceneStore.getState().rotatePiece('shelf-1');
    expect(useSceneStore.getState().pieces.find((p) => p.id === 'shelf-1')?.rotation).toBe(90);
    useSceneStore.getState().rotatePiece('shelf-1');
    expect(useSceneStore.getState().pieces.find((p) => p.id === 'shelf-1')?.rotation).toBe(0);
  });
});

describe('saveScene / loadScene', () => {
  it('persists the current pieces and restores them', () => {
    useSceneStore.getState().movePiece('pallet-1', 8 * 1.2 + 0.1, 7 * 1.2 + 0.1);
    useSceneStore.getState().saveScene();
    resetStore();
    useSceneStore.getState().loadScene();
    const pallet = useSceneStore.getState().pieces.find((p) => p.id === 'pallet-1');
    expect(pallet?.gridX).toBe(8);
    expect(pallet?.gridY).toBe(7);
  });
});
