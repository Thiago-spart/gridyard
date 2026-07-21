import { test, expect } from '@playwright/test';
import { FIXTURE_PIECES, waitForSceneReady, clickGridCell, isPieceLabelVisible } from './fixtures';

test('clicking each fixture piece selects it and shows its label', async ({ page }) => {
  await page.goto('/');
  const origin = await waitForSceneReady(page);

  for (const piece of FIXTURE_PIECES) {
    await clickGridCell(page, origin, piece);
    await expect.poll(() => isPieceLabelVisible(page, piece.label)).toBe(true);
  }
});
