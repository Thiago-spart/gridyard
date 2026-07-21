import { test, expect } from '@playwright/test';
import { waitForSceneReady } from './fixtures';

test('toggling the view swaps the button label and Reset view control', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (err) => errors.push(err.message));
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text());
  });

  await page.goto('/');
  await waitForSceneReady(page);

  const toggle = page.getByRole('button', { name: /^Switch to/ });
  await expect(toggle).toHaveText('Switch to 3D view');
  await expect(page.getByRole('button', { name: 'Reset view' })).toHaveCount(0);

  await toggle.click();
  await expect(toggle).toHaveText('Switch to top view');
  await expect(page.getByRole('button', { name: 'Reset view' })).toHaveCount(1);

  await toggle.click();
  await expect(toggle).toHaveText('Switch to 3D view');
  await expect(page.getByRole('button', { name: 'Reset view' })).toHaveCount(0);

  expect(errors).toEqual([]);
});
