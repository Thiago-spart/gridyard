import type { Page } from '@playwright/test';
import { gridCellToCanvasPoint } from './gridToScreen';

// Mirrors INITIAL_PIECES in src/store/sceneStore.ts -- the scene's starting layout on
// every fresh browser context (no localStorage yet, so persistence/index.ts's
// localStorage backend resolves to null and the store falls back to these defaults).
export const FIXTURE_PIECES = [
  { id: 'pallet-1', label: 'Pallet', gridX: 0, gridY: 0, widthCells: 1, depthCells: 1 },
  { id: 'shelf-1', label: 'Shelf', gridX: 3, gridY: 0, widthCells: 2, depthCells: 1 },
  { id: 'crate-1', label: 'Crate', gridX: 6, gridY: 0, widthCells: 1, depthCells: 1 },
  { id: 'workstation-1', label: 'Workstation', gridX: 0, gridY: 3, widthCells: 2, depthCells: 2 },
] as const;

export async function waitForSceneReady(page: Page): Promise<CanvasPoint> {
  await page.waitForSelector('canvas');
  // R3F's first frame can render before its ResizeObserver/camera settle into their
  // final layout-driven size; without this, an immediate click can land against a
  // stale/mid-resize frame. A real drag gesture takes long enough to avoid this, but a
  // single click does not, so every spec waits here before its first interaction.
  await page.waitForTimeout(300);
  const box = await page.locator('canvas').boundingBox();
  if (!box) throw new Error('canvas not found or not visible');
  return { x: box.x, y: box.y };
}

interface CanvasPoint {
  x: number;
  y: number;
}

interface GridCell {
  gridX: number;
  gridY: number;
  widthCells: number;
  depthCells: number;
}

export async function clickGridCell(page: Page, origin: CanvasPoint, cell: GridCell): Promise<void> {
  const point = gridCellToCanvasPoint(cell.gridX, cell.gridY, cell.widthCells, cell.depthCells);
  await page.mouse.click(origin.x + point.x, origin.y + point.y);
}

export async function dragGridCell(page: Page, origin: CanvasPoint, from: GridCell, to: GridCell): Promise<void> {
  const start = gridCellToCanvasPoint(from.gridX, from.gridY, from.widthCells, from.depthCells);
  const end = gridCellToCanvasPoint(to.gridX, to.gridY, to.widthCells, to.depthCells);
  const startPoint = { x: origin.x + start.x, y: origin.y + start.y };
  const endPoint = { x: origin.x + end.x, y: origin.y + end.y };

  await page.mouse.move(startPoint.x, startPoint.y);
  await page.mouse.down();
  const steps = 10;
  for (let i = 1; i <= steps; i++) {
    await page.mouse.move(
      startPoint.x + (endPoint.x - startPoint.x) * (i / steps),
      startPoint.y + (endPoint.y - startPoint.y) * (i / steps),
    );
    await page.waitForTimeout(20);
  }
  await page.mouse.up();
}

// selectPiece() in sceneStore.ts keeps up to 2 pieces selected at once (both get
// labels), so "selecting a piece" is checked as "its label is visible", not as "it is
// the only visible label".
export async function isPieceLabelVisible(page: Page, label: string): Promise<boolean> {
  const count = await page.locator('.whitespace-nowrap.shadow-sm').filter({ hasText: label }).count();
  return count > 0;
}

export async function getMeasurementText(page: Page): Promise<string> {
  const panel = page.getByText(/^(Size:|Distance:|Select a piece)/);
  return (await panel.first().textContent())?.trim() ?? '';
}
