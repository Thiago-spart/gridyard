import { test, expect } from '@playwright/test';
import { FIXTURE_PIECES, waitForSceneReady, clickGridCell, getMeasurementText } from './fixtures';

test('rotating a selected piece swaps its measured width and depth', async ({ page }) => {
  await page.goto('/');
  const origin = await waitForSceneReady(page);

  const shelf = FIXTURE_PIECES.find((p) => p.id === 'shelf-1')!;
  await clickGridCell(page, origin, shelf);
  await expect.poll(() => getMeasurementText(page)).toBe('Size: 2.4m × 1.2m');

  await page.getByRole('button', { name: 'Rotate 90°' }).click();
  await expect.poll(() => getMeasurementText(page)).toBe('Size: 1.2m × 2.4m');
});
