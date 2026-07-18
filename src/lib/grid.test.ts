import { describe, expect, it } from 'vitest';
import { BOARD_WIDTH, BOARD_DEPTH, CELL_SIZE_METERS, worldToGrid, clampToBoard } from './grid';

describe('clampToBoard', () => {
  it('keeps an in-bounds position unchanged', () => {
    expect(clampToBoard(3, 2, 2, 1)).toEqual({ gridX: 3, gridY: 2 });
  });

  it('clamps a position past the right/bottom edge', () => {
    expect(clampToBoard(20, 20, 2, 2)).toEqual({
      gridX: BOARD_WIDTH - 2,
      gridY: BOARD_DEPTH - 2,
    });
  });

  it('clamps a negative position to 0', () => {
    expect(clampToBoard(-5, -5, 1, 1)).toEqual({ gridX: 0, gridY: 0 });
  });
});

describe('worldToGrid', () => {
  it('converts a world-space point to the grid cell containing it', () => {
    const { gridX, gridY } = worldToGrid(3 * CELL_SIZE_METERS, 2 * CELL_SIZE_METERS, 1, 1);
    expect(gridX).toBe(3);
    expect(gridY).toBe(2);
  });

  it('clamps the result to stay on the board', () => {
    const { gridX, gridY } = worldToGrid(1000, 1000, 1, 1);
    expect(gridX).toBeLessThanOrEqual(BOARD_WIDTH - 1);
    expect(gridY).toBeLessThanOrEqual(BOARD_DEPTH - 1);
  });
});
