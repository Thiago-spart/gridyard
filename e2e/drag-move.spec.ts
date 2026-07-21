import { test, expect } from '@playwright/test';
import { FIXTURE_PIECES, waitForSceneReady, dragGridCell, clickGridCell, getMeasurementText } from './fixtures';

test('dragging a piece to an empty cell updates its measured distance to another piece', async ({ page }) => {
  await page.goto('/');
  const origin = await waitForSceneReady(page);

  const crate = FIXTURE_PIECES.find((p) => p.id === 'crate-1')!;
  const pallet = FIXTURE_PIECES.find((p) => p.id === 'pallet-1')!;

  // Drag Crate (starts at grid (6,0)) to the empty cell at grid (5,5).
  await dragGridCell(page, origin, crate, { gridX: 5, gridY: 5, widthCells: 1, depthCells: 1 });

  // Add Pallet (stationary at grid (0,0)) to the selection to read the distance between them.
  await clickGridCell(page, origin, pallet);

  // Pallet center (0.6, 0.6) to Crate's new center (6.6, 6.6) -> hypot(6, 6) = 8.485 -> "8.5m".
  await expect.poll(() => getMeasurementText(page)).toBe('Distance: 8.5m');
});
