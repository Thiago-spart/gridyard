import { beforeEach, describe, expect, it } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useKeyboardShortcuts } from './useKeyboardShortcuts';
import { useSceneStore, INITIAL_PIECES } from '../store/sceneStore';

beforeEach(() => {
  useSceneStore.setState({ pieces: INITIAL_PIECES, selectedIds: ['shelf-1'], viewMode: 'top' });
});

describe('useKeyboardShortcuts', () => {
  it('rotates the selected piece on "r"', () => {
    renderHook(() => useKeyboardShortcuts());
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'r' }));
    const shelf = useSceneStore.getState().pieces.find((p) => p.id === 'shelf-1');
    expect(shelf?.rotation).toBe(90);
  });

  it('clears the selection on "Escape"', () => {
    renderHook(() => useKeyboardShortcuts());
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(useSceneStore.getState().selectedIds).toEqual([]);
  });
});
