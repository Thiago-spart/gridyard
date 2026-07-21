# Playwright E2E Suite Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a checked-in Playwright E2E suite covering `scene/`'s canvas interactions
(select, drag-move, rotate, view toggle), per
`docs/superpowers/specs/2026-07-21-playwright-e2e-suite-design.md`.

**Architecture:** `scene/Scene.tsx`'s top-down camera is fixed (`OrthographicCamera` at
hardcoded `position={[6, 20, 4.8]}`, `zoom={40}`, `up={[0, 0, -1]}`), so a pure-TS helper
(`e2e/gridToScreen.ts`) can map grid coordinates to canvas pixels via one static affine
transform, letting tests click/drag real canvas coordinates and assert on DOM
side-effects (selection label, `MeasurementPanel` text) — no test-only hooks in app code.

**Tech Stack:** `@playwright/test` (chromium only), against `vite preview`'s production
build, wired as a new CI job.

## Global Constraints

- The projection constants in `e2e/gridToScreen.ts` are **empirically calibrated**, not
  derived from Three.js math on paper — see that file's own header comment for why (the
  `up={[0,0,-1]}` top-down camera is not perfectly overhead of world origin, producing a
  small but real shear term). Do not "simplify" or "clean up" those constants without
  re-running the calibration; `e2e/select.spec.ts` is the guard that catches drift.
- **Every task in this plan is already implemented and verified working** (all 4 specs
  green across repeated runs, `pnpm lint` / `pnpm build` / `pnpm test` all clean) — this
  was necessary because the coordinate math and Playwright API details couldn't be
  gotten right on paper (two real bugs were caught only by actually running it, see
  Task 1's Gotchas). Treat the code blocks below as the exact, proven implementation to
  apply — not a starting sketch to re-derive.
- This plan adds tests over already-shipped features; there is no application code to
  change. Steps are "write the file → run → confirm green," not red-green TDD.
- Playwright's default `test` fixture gives every test a fresh, isolated browser context
  (fresh `localStorage`), so `persistence/index.ts`'s `localStorage` fallback (no
  `VITE_SUPABASE_URL` in this environment) always starts from `INITIAL_PIECES` — no
  cross-test state leakage, no Supabase dependency.
- The Playwright viewport is pinned to exactly `1280×800` (renders the R3F canvas at
  `1000×800` CSS px inside `ResponsiveLayout`'s sidebar split) — this is load-bearing for
  the calibrated constants; do not change it without recalibrating.
- Run `pnpm lint && pnpm typecheck && pnpm test && pnpm build` before every commit (all
  four currently pass). Note: `pnpm typecheck`'s plain `tsc --noEmit` is a pre-existing
  no-op on this project's solution-style `tsconfig.json` (empty `files`, only
  `references`, no `-b` flag) — it was already a no-op before this plan and stays out of
  scope here. The real type-safety net for `e2e/**/*.ts` is `pnpm build`'s `tsc -b` step,
  confirmed in Task 1 to actually catch errors in referenced projects.

---

### Task 1: Playwright scaffolding + coordinate helper + selection spec

**Files:**
- Create: `playwright.config.ts`
- Create: `tsconfig.e2e.json`
- Create: `e2e/gridToScreen.ts`
- Create: `e2e/fixtures.ts`
- Create: `e2e/select.spec.ts`
- Modify: `package.json` (scripts)
- Modify: `vite.config.ts` (exclude `e2e/**` from Vitest)
- Modify: `tsconfig.json` (add `tsconfig.e2e.json` reference)
- Modify: `.gitignore` (Playwright output dirs)

**Interfaces:**
- Consumes: `CELL_SIZE_METERS` from `src/lib/grid.ts` (existing).
- Produces (consumed by Tasks 2-4):
  - `e2e/gridToScreen.ts`: `gridCellToCanvasPoint(gridX: number, gridY: number, widthCells: number, depthCells: number): { x: number; y: number }`
  - `e2e/fixtures.ts`: `FIXTURE_PIECES` (readonly array of `{ id, label, gridX, gridY, widthCells, depthCells }`), `waitForSceneReady(page: Page): Promise<{ x: number; y: number }>`, `clickGridCell(page, origin, cell): Promise<void>`, `dragGridCell(page, origin, from, to): Promise<void>`, `getMeasurementText(page): Promise<string>`, `isPieceLabelVisible(page, label: string): Promise<boolean>`

**Gotchas found during verification (already fixed in the code below — do not reintroduce):**
1. `projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }]` silently
   overrides the top-level `use.viewport` with `devices['Desktop Chrome']`'s own default
   (`1280×720`), breaking every calibrated coordinate. The project's `use` must
   re-specify `viewport: { width: 1280, height: 800 }` explicitly.
2. A single click immediately after `waitForSelector('canvas')` can land against a
   not-yet-settled R3F first frame (its `ResizeObserver`/camera haven't finished their
   final layout-driven size yet) and miss every piece. A real drag gesture is slow
   enough to avoid this by accident, but a single click is not. Fix: `waitForSceneReady`
   always waits 300ms after the canvas appears, before any interaction.
3. `selectPiece()` in `sceneStore.ts` keeps **up to 2** pieces selected at once (both
   get visible labels) — see `src/store/sceneStore.ts:64-72`. A helper that grabs
   "the first matching label on the page" breaks as soon as a second piece is selected.
   `isPieceLabelVisible(page, label)` checks "is this piece's label among the visible
   ones", not "is it the only one".

- [ ] **Step 1: Add the Playwright dependency**

  ```bash
  pnpm add -D @playwright/test@1.61.1
  ```

- [ ] **Step 2: Create `playwright.config.ts`**

  ```ts
  import { defineConfig, devices } from '@playwright/test';

  export default defineConfig({
    testDir: './e2e',
    fullyParallel: true,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 1 : 0,
    reporter: 'list',
    use: {
      baseURL: 'http://localhost:4173',
      viewport: { width: 1280, height: 800 },
      trace: 'on-first-retry',
    },
    webServer: {
      command: 'pnpm preview --port 4173',
      url: 'http://localhost:4173',
      reuseExistingServer: !process.env.CI,
    },
    projects: [
      { name: 'chromium', use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 800 } } },
    ],
  });
  ```

- [ ] **Step 3: Create `tsconfig.e2e.json`**

  ```json
  {
    "compilerOptions": {
      "tsBuildInfoFile": "./node_modules/.tmp/tsconfig.e2e.tsbuildinfo",
      "target": "es2023",
      "lib": ["ES2023"],
      "types": ["node"],
      "skipLibCheck": true,

      "module": "esnext",
      "moduleResolution": "bundler",
      "allowImportingTsExtensions": true,
      "verbatimModuleSyntax": true,
      "moduleDetection": "force",
      "noEmit": true,

      "noUnusedLocals": true,
      "noUnusedParameters": true,
      "erasableSyntaxOnly": true,
      "noFallthroughCasesInSwitch": true
    },
    "include": ["e2e", "playwright.config.ts"]
  }
  ```

- [ ] **Step 4: Reference it from the root `tsconfig.json`**

  In `tsconfig.json`, add to `references` (after `tsconfig.node.json`):

  ```json
      { "path": "./tsconfig.e2e.json" }
  ```

- [ ] **Step 5: Exclude `e2e/**` from Vitest in `vite.config.ts`**

  ```ts
  import { defineConfig } from 'vite'
  import { configDefaults } from 'vitest/config'
  import react from '@vitejs/plugin-react'
  import tailwindcss from '@tailwindcss/vite'

  // https://vite.dev/config/
  export default defineConfig({
    plugins: [react(), tailwindcss()],
    test: {
      environment: 'jsdom',
      setupFiles: './src/test-setup.ts',
      exclude: [...configDefaults.exclude, 'e2e/**'],
    },
  })
  ```

  Note: this drops the old `/// <reference types="vitest/config" />` triple-slash line
  — once `vitest/config` is imported for real (`configDefaults`), TypeScript picks up its
  ambient types from the import itself, and `@typescript-eslint/triple-slash-reference`
  flags the now-redundant reference as an error.

- [ ] **Step 6: Add `package.json` scripts** (after `"test": "vitest run",`)

  ```json
      "test:e2e": "playwright test",
      "test:e2e:install": "playwright install --with-deps chromium",
  ```

- [ ] **Step 7: Add Playwright output dirs to `.gitignore`** (after the existing
  `# Superpowers scratch` block)

  ```
  # Playwright
  /test-results/
  /playwright-report/
  /playwright/.cache/
  ```

- [ ] **Step 8: Create `e2e/gridToScreen.ts`**

  ```ts
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
  ```

- [ ] **Step 9: Create `e2e/fixtures.ts`**

  ```ts
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
  ```

- [ ] **Step 10: Create `e2e/select.spec.ts`**

  ```ts
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
  ```

- [ ] **Step 11: Verify the full gate**

  ```bash
  pnpm lint && pnpm build && pnpm test
  pnpm exec playwright install chromium   # one-time, if not already cached
  pnpm test:e2e
  ```

  Expected: lint clean; `tsc -b` (inside `pnpm build`) passes with the new
  `tsconfig.e2e.json` reference; Vitest still `119 passed (119)` (unaffected by the
  `e2e/**` exclude); `playwright test` reports `1 passed` for `select.spec.ts`.

- [ ] **Step 12: Commit**

  ```bash
  git add playwright.config.ts tsconfig.e2e.json tsconfig.json vite.config.ts \
    package.json pnpm-lock.yaml .gitignore e2e/gridToScreen.ts e2e/fixtures.ts e2e/select.spec.ts
  git commit -m "test: add Playwright E2E scaffolding, coordinate helper, and selection spec"
  ```

---

### Task 2: Drag-move spec

**Files:**
- Create: `e2e/drag-move.spec.ts`

**Interfaces:**
- Consumes: `FIXTURE_PIECES`, `waitForSceneReady`, `dragGridCell`, `clickGridCell`,
  `getMeasurementText` from `./fixtures` (Task 1).

- [ ] **Step 1: Create `e2e/drag-move.spec.ts`**

  ```ts
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
  ```

- [ ] **Step 2: Run it**

  ```bash
  pnpm exec playwright test e2e/drag-move.spec.ts
  ```

  Expected: `1 passed`.

- [ ] **Step 3: Commit**

  ```bash
  git add e2e/drag-move.spec.ts
  git commit -m "test: add Playwright drag-move E2E spec"
  ```

---

### Task 3: Rotate spec

**Files:**
- Create: `e2e/rotate.spec.ts`

**Interfaces:**
- Consumes: `FIXTURE_PIECES`, `waitForSceneReady`, `clickGridCell`, `getMeasurementText`
  from `./fixtures` (Task 1).

- [ ] **Step 1: Create `e2e/rotate.spec.ts`**

  ```ts
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
  ```

- [ ] **Step 2: Run it**

  ```bash
  pnpm exec playwright test e2e/rotate.spec.ts
  ```

  Expected: `1 passed`.

- [ ] **Step 3: Commit**

  ```bash
  git add e2e/rotate.spec.ts
  git commit -m "test: add Playwright rotate E2E spec"
  ```

---

### Task 4: View-toggle spec

**Files:**
- Create: `e2e/view-toggle.spec.ts`

**Interfaces:**
- Consumes: `waitForSceneReady` from `./fixtures` (Task 1).

- [ ] **Step 1: Create `e2e/view-toggle.spec.ts`**

  ```ts
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
  ```

- [ ] **Step 2: Run it**

  ```bash
  pnpm exec playwright test e2e/view-toggle.spec.ts
  ```

  Expected: `1 passed`.

- [ ] **Step 3: Run the full E2E suite together**

  ```bash
  pnpm test:e2e
  ```

  Expected: `4 passed` (all of Tasks 1-4's specs).

- [ ] **Step 4: Commit**

  ```bash
  git add e2e/view-toggle.spec.ts
  git commit -m "test: add Playwright view-toggle E2E spec"
  ```

---

### Task 5: CI wiring + docs

**Files:**
- Modify: `.github/workflows/ci.yml`
- Modify: `ARCHITECTURE.md`

**Interfaces:**
- Consumes: `pnpm test:e2e` / `pnpm build` scripts from Task 1. No new interfaces
  produced (final integration task).

- [ ] **Step 1: Add the `e2e` job to `.github/workflows/ci.yml`**

  Full updated file:

  ```yaml
  name: CI

  on:
    push:
      branches: [master, dev]
    pull_request:
      branches: [master, dev]

  jobs:
    quality:
      runs-on: ubuntu-latest
      steps:
        - uses: actions/checkout@v4

        - uses: pnpm/action-setup@v4

        - uses: actions/setup-node@v4
          with:
            node-version: 20
            cache: pnpm

        - run: pnpm install --frozen-lockfile
        - run: pnpm lint
        - run: pnpm typecheck
        - run: pnpm test
        - run: pnpm build

    e2e:
      needs: quality
      runs-on: ubuntu-latest
      steps:
        - uses: actions/checkout@v4

        - uses: pnpm/action-setup@v4

        - uses: actions/setup-node@v4
          with:
            node-version: 20
            cache: pnpm

        - run: pnpm install --frozen-lockfile

        - name: Cache Playwright browsers
          uses: actions/cache@v4
          with:
            path: ~/.cache/ms-playwright
            key: playwright-chromium-${{ runner.os }}-${{ hashFiles('pnpm-lock.yaml') }}

        - run: pnpm exec playwright install --with-deps chromium
        - run: pnpm build
        - run: pnpm test:e2e
  ```

- [ ] **Step 2: Update `ARCHITECTURE.md`'s "Tooling & testing strategy" table**

  Change the Cypress row (currently: `| Stretch, only if time remains | **Cypress** | E2E
  against a WebGL canvas is inherently brittle (no DOM to target for drag-and-drop on
  pieces) |`) to:

  ```markdown
  | Added post-MVP | **Playwright** | E2E for `scene/`'s canvas interactions (select, drag-move, rotate, view toggle). The WebGL-canvas-has-no-DOM problem is solved with a small calibrated grid→screen coordinate helper (`e2e/gridToScreen.ts`) rather than a DOM query; assertions stay DOM-only (selection label, measurement panel text) — see `docs/superpowers/specs/2026-07-21-playwright-e2e-suite-design.md`. |
  ```

  Also update the `scene/` comment in the folder-structure section (currently
  `# R3F / WebGL-rendered — NOT covered by RTL`) to note the Playwright coverage:

  ```
  ├── scene/                    # R3F / WebGL-rendered — not RTL-testable, covered by e2e/ (Playwright) instead
  ```

- [ ] **Step 3: Verify**

  ```bash
  pnpm lint && pnpm typecheck && pnpm test && pnpm build && pnpm test:e2e
  ```

  Expected: all green (lint clean, `tsc -b` clean, `119 passed`, build succeeds,
  `4 passed` for e2e).

- [ ] **Step 4: Commit**

  ```bash
  git add .github/workflows/ci.yml ARCHITECTURE.md
  git commit -m "ci: run Playwright E2E suite as a separate job after the quality gate"
  ```
