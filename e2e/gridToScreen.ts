import { CELL_SIZE_METERS } from '../src/lib/grid';

// Empirically calibrated for the fixed top-down OrthographicCamera in scene/Scene.tsx
// (position [6, 20, 4.8], zoom 40, up [0, 0, -1]) at a 1280x800 Playwright viewport,
// which renders the R3F canvas at 1000x800 CSS pixels inside ResponsiveLayout's
// sidebar-plus-canvas split. Coordinates are canvas-local (relative to the canvas
// element's own top-left corner) -- add the canvas's boundingBox().x/y before clicking.
//
// If Scene.tsx's camera position/zoom or CALIBRATED_VIEWPORT ever change, these
// constants go stale silently. e2e/select.spec.ts's test (clicking every fixture piece)
// is the guard: it fails immediately and obviously if this drifts, instead of producing
// confusing "wrong piece selected" failures deeper in the suite.
export const CALIBRATED_VIEWPORT = { width: 1280, height: 800 } as const;

const SCREEN_X_PER_WORLD_X = 38.23088685015294;
const SCREEN_X_PER_WORLD_Z = -0.3796417649629541;
const SCREEN_X_OFFSET = 497.9452162516386;
const SCREEN_Y_PER_WORLD_X = -2.943425076452576;
const SCREEN_Y_PER_WORLD_Z = 38.868501529052054;
const SCREEN_Y_OFFSET = 402.9633027522938;

export interface CanvasPoint {
  x: number;
  y: number;
}

export function worldToCanvasPoint(worldX: number, worldZ: number): CanvasPoint {
  return {
    x: SCREEN_X_PER_WORLD_X * worldX + SCREEN_X_PER_WORLD_Z * worldZ + SCREEN_X_OFFSET,
    y: SCREEN_Y_PER_WORLD_X * worldX + SCREEN_Y_PER_WORLD_Z * worldZ + SCREEN_Y_OFFSET,
  };
}

export function gridCellToCanvasPoint(
  gridX: number,
  gridY: number,
  widthCells: number,
  depthCells: number,
): CanvasPoint {
  const worldX = (gridX + widthCells / 2) * CELL_SIZE_METERS;
  const worldZ = (gridY + depthCells / 2) * CELL_SIZE_METERS;
  return worldToCanvasPoint(worldX, worldZ);
}
