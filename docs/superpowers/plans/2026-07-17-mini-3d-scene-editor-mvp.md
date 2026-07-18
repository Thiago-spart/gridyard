# Mini 3D Scene Editor — MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the InLab/Artefacto technical-challenge app — a mobile-first 3D warehouse
floor-plan tool (10×8 grid, orthographic top-down camera) where 4 fixed pieces can be
dragged, rotated 90°, snapped to grid, collision-checked, measured, and persisted to
localStorage.

**Architecture:** Vite + React + TypeScript. React Three Fiber/drei render the 3D scene;
a Zustand store holds scene state (pieces, selection, view mode); pure, framework-free
`lib/` functions handle collision/grid/measurement math and are the Vitest target;
`persistence/localStorage.ts` is the storage backend behind a swappable interface.

**Tech Stack:** Vite, React 18, TypeScript, React Three Fiber, @react-three/drei, three.js,
Zustand, Vitest, React Testing Library, pnpm.

## Global Constraints

- Board is fixed 10×8 grid cells; 1 cell = 1.2m (exact values from `DESIGN.md`).
- Camera is orthographic, locked top-down (no orbit/rotation) — this is a hard
  requirement, not a default.
- 4 pieces only, fixed at scene start: pallet (1×1, `#c8a165`), shelf (2×1, `#6b8ca6`),
  crate (1×1, `#e08a3c`), workstation (2×2, `#4a4a52`) — colors and footprints from
  `DESIGN.md`, do not change them.
- An invalid drop (overlapping another piece, or off-board) must be rejected — the piece
  snaps back to its last valid position. Never persist an overlapping state.
- Interaction must work identically on touch, trackpad, and mouse (tap/click is the
  universal baseline); keyboard shortcuts (`R` rotate, `Escape` clear selection) are
  additive only, never the sole way to do something.
- `scene/` (R3F/WebGL components) is not unit tested — verified manually. `lib/`,
  `persistence/`, `store/`, and `ui/` are unit/component tested with Vitest / React
  Testing Library.
- This plan covers the MVP only (the challenge's 7 core requirements +
  localStorage persistence). Supabase persistence and bonus features (perspective
  camera toggle, color swap, performance pass) are a separate follow-up plan, per the
  staged approach in `DESIGN.md`.

---

### Task 1: Project scaffolding

**Files:**
- Create: entire project skeleton via Vite's `react-ts` template, then modify
  `package.json`, `vite.config.ts`, add `.gitignore` entries as needed.

**Interfaces:**
- Produces: a working `pnpm dev` / `pnpm build` app shell that later tasks add files
  into (`src/lib/`, `src/persistence/`, `src/store/`, `src/scene/`, `src/ui/`,
  `src/hooks/`, `src/types/`).

- [ ] **Step 1: Scaffold the Vite React-TS template**

```bash
pnpm create vite@latest . -- --template react-ts
```

- [ ] **Step 2: Install runtime dependencies**

```bash
pnpm add three @react-three/fiber @react-three/drei zustand
```

- [ ] **Step 3: Install dev/test dependencies**

```bash
pnpm add -D vitest jsdom @testing-library/react @testing-library/jest-dom @types/three
```

- [ ] **Step 4: Install Tailwind CSS**

Tailwind v4 is CSS-first — no `tailwind.config.js`, just the Vite plugin:
```bash
pnpm add -D tailwindcss @tailwindcss/vite
```

- [ ] **Step 5: Add the Vitest config block and Tailwind plugin to `vite.config.ts`**

```ts
/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  test: {
    environment: 'jsdom',
    setupFiles: './src/test-setup.ts',
  },
})
```

- [ ] **Step 6: Replace `src/index.css` with the Tailwind import and brand tokens**

Maps every color/font from `STYLE_GUIDE.md` to a real Tailwind utility (`bg-paper`,
`text-ink`, `text-accent`, `bg-pallet`/`bg-shelf`/`bg-crate`/`bg-workstation`,
`font-mono-brand`, `font-sans-brand`) via the `@theme` block — see `ARCHITECTURE.md`'s
Styling section for why. Dark mode swaps automatically through the CSS variable
indirection, no `dark:` variant needed per element.

Replace `src/index.css`:
```css
@import "tailwindcss";

:root {
  --gy-paper: #f7f6f2;
  --gy-paper-raised: #ffffff;
  --gy-ink: #2a2a28;
  --gy-ink-soft: #6b6a63;
  --gy-line: #d8d6cd;
  --gy-grid: #9a988e;
  --gy-accent: #2f6fed;
  --gy-accent-ink: #ffffff;
  --gy-pallet: #c8a165;
  --gy-shelf: #6b8ca6;
  --gy-crate: #e08a3c;
  --gy-workstation: #4a4a52;
}

@media (prefers-color-scheme: dark) {
  :root {
    --gy-paper: #1c1c1a;
    --gy-paper-raised: #242422;
    --gy-ink: #f0efe9;
    --gy-ink-soft: #a6a49b;
    --gy-line: #3a3935;
    --gy-grid: #5a584f;
    --gy-accent: #5b8bff;
    --gy-accent-ink: #0d1526;
  }
}

@theme {
  --color-paper: var(--gy-paper);
  --color-paper-raised: var(--gy-paper-raised);
  --color-ink: var(--gy-ink);
  --color-ink-soft: var(--gy-ink-soft);
  --color-line: var(--gy-line);
  --color-grid: var(--gy-grid);
  --color-accent: var(--gy-accent);
  --color-accent-ink: var(--gy-accent-ink);
  --color-pallet: var(--gy-pallet);
  --color-shelf: var(--gy-shelf);
  --color-crate: var(--gy-crate);
  --color-workstation: var(--gy-workstation);

  --font-mono-brand: ui-monospace, "SF Mono", "Cascadia Mono", "Roboto Mono", "JetBrains Mono", monospace;
  --font-sans-brand: -apple-system, BlinkMacSystemFont, "Segoe UI", ui-sans-serif, sans-serif;
}

body {
  margin: 0;
  background-color: var(--color-paper);
  color: var(--color-ink);
  font-family: var(--font-sans-brand);
}
```

- [ ] **Step 7: Create the test setup file**

Create `src/test-setup.ts`:
```ts
import '@testing-library/jest-dom/vitest';
```

- [ ] **Step 8: Add `lint`, `typecheck`, and `test` scripts to `package.json`**

The template already provides `dev`, `build`, `preview`. Add these three to the
`"scripts"` object:
```json
"lint": "eslint .",
"typecheck": "tsc --noEmit",
"test": "vitest run"
```

- [ ] **Step 9: Strip the Vite/React starter boilerplate**

Remove the template's demo content so `src/` is a clean base for the upcoming tasks:
```bash
rm -rf src/assets
rm -f src/App.css public/favicon.svg public/icons.svg
```
Replace `src/App.tsx` with a minimal placeholder (later replaced for real in Task 14):
```tsx
function App() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-paper text-ink">
      <h1 className="font-mono-brand text-3xl font-bold tracking-tight">Gridyard</h1>
    </main>
  )
}

export default App
```
Copy the brand SVGs and update `index.html`'s title/favicon (source files written by
`STYLE_GUIDE.md`):
```bash
cp assets/brand/logo.svg public/logo.svg
cp assets/brand/logo-mark.svg public/logo-mark.svg
```
```html
<title>Gridyard</title>
<link rel="icon" type="image/svg+xml" href="/logo-mark.svg" />
```

- [ ] **Step 10: Create the empty folder skeleton**

```bash
mkdir -p src/lib src/persistence src/store src/scene src/hooks src/types
mkdir -p src/ui/MeasurementPanel src/ui/Legend src/ui/RotateButton src/ui/ResponsiveLayout
```

- [ ] **Step 11: Verify the scaffold builds and lints clean**

```bash
pnpm typecheck && pnpm lint && pnpm build
```
Expected: all three commands exit 0. `pnpm build` produces a `dist/` folder.

- [ ] **Step 12: Commit**

```bash
git add -A
git commit -m "chore: scaffold Vite/React/TS project with Tailwind, Vitest, and folder skeleton"
```

---

### Task 2: `lib/pieces.ts` — piece type definitions

**Files:**
- Create: `src/lib/pieces.ts`
- Test: `src/lib/pieces.test.ts`

**Interfaces:**
- Produces: `PieceType`, `PieceDef`, `PIECE_DEFS`, `PieceInstance`,
  `getFootprint(instance: Pick<PieceInstance, 'type' | 'rotation'>): { width: number; depth: number }`
  — used by every later task that reasons about a piece's size or position.

- [ ] **Step 1: Write the failing test**

Create `src/lib/pieces.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { PIECE_DEFS, getFootprint } from './pieces';

describe('getFootprint', () => {
  it('returns the unrotated width/depth at rotation 0', () => {
    expect(getFootprint({ type: 'shelf', rotation: 0 })).toEqual({ width: 2, depth: 1 });
  });

  it('swaps width/depth at rotation 90', () => {
    expect(getFootprint({ type: 'shelf', rotation: 90 })).toEqual({ width: 1, depth: 2 });
  });

  it('is unchanged for a symmetric 1x1 piece', () => {
    expect(getFootprint({ type: 'pallet', rotation: 90 })).toEqual({ width: 1, depth: 1 });
  });
});

describe('PIECE_DEFS', () => {
  it('has a positive footprint for every piece type', () => {
    for (const def of Object.values(PIECE_DEFS)) {
      expect(def.width).toBeGreaterThan(0);
      expect(def.depth).toBeGreaterThan(0);
    }
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run src/lib/pieces.test.ts`
Expected: FAIL — `./pieces` has no exported member `PIECE_DEFS`/`getFootprint`.

- [ ] **Step 3: Write the implementation**

Create `src/lib/pieces.ts`:
```ts
export type PieceType = 'pallet' | 'shelf' | 'crate' | 'workstation';

export interface PieceDef {
  type: PieceType;
  label: string;
  width: number; // grid cells, at rotation 0
  depth: number;
  color: string;
}

export const PIECE_DEFS: Record<PieceType, PieceDef> = {
  pallet: { type: 'pallet', label: 'Pallet', width: 1, depth: 1, color: '#c8a165' },
  shelf: { type: 'shelf', label: 'Shelf', width: 2, depth: 1, color: '#6b8ca6' },
  crate: { type: 'crate', label: 'Crate', width: 1, depth: 1, color: '#e08a3c' },
  workstation: { type: 'workstation', label: 'Workstation', width: 2, depth: 2, color: '#4a4a52' },
};

export interface PieceInstance {
  id: string;
  type: PieceType;
  gridX: number;
  gridY: number;
  rotation: 0 | 90;
}

export function getFootprint(
  instance: Pick<PieceInstance, 'type' | 'rotation'>,
): { width: number; depth: number } {
  const def = PIECE_DEFS[instance.type];
  return instance.rotation === 90
    ? { width: def.depth, depth: def.width }
    : { width: def.width, depth: def.depth };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run src/lib/pieces.test.ts`
Expected: PASS (4 tests)

- [ ] **Step 5: Commit**

```bash
git add src/lib/pieces.ts src/lib/pieces.test.ts
git commit -m "feat: add piece type definitions and footprint helper"
```

---

### Task 3: `lib/grid.ts` — grid math

**Files:**
- Create: `src/lib/grid.ts`
- Test: `src/lib/grid.test.ts`

**Interfaces:**
- Consumes: nothing (pure constants/math).
- Produces: `BOARD_WIDTH = 10`, `BOARD_DEPTH = 8`, `CELL_SIZE_METERS = 1.2`,
  `clampToBoard(gridX: number, gridY: number, width: number, depth: number): { gridX: number; gridY: number }`,
  `worldToGrid(x: number, z: number, width: number, depth: number): { gridX: number; gridY: number }`
  — used by `store/sceneStore.ts` (Task 7) and `scene/Board.tsx` (Task 8).

- [ ] **Step 1: Write the failing test**

Create `src/lib/grid.test.ts`:
```ts
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run src/lib/grid.test.ts`
Expected: FAIL — module `./grid` not found.

- [ ] **Step 3: Write the implementation**

Create `src/lib/grid.ts`:
```ts
export const BOARD_WIDTH = 10; // cells
export const BOARD_DEPTH = 8; // cells
export const CELL_SIZE_METERS = 1.2;

export function clampToBoard(
  gridX: number,
  gridY: number,
  width: number,
  depth: number,
): { gridX: number; gridY: number } {
  const maxX = Math.max(BOARD_WIDTH - width, 0);
  const maxY = Math.max(BOARD_DEPTH - depth, 0);
  return {
    gridX: Math.min(Math.max(gridX, 0), maxX),
    gridY: Math.min(Math.max(gridY, 0), maxY),
  };
}

export function worldToGrid(
  x: number,
  z: number,
  width: number,
  depth: number,
): { gridX: number; gridY: number } {
  const rawX = Math.round(x / CELL_SIZE_METERS - width / 2);
  const rawY = Math.round(z / CELL_SIZE_METERS - depth / 2);
  return clampToBoard(rawX, rawY, width, depth);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run src/lib/grid.test.ts`
Expected: PASS (5 tests)

- [ ] **Step 5: Commit**

```bash
git add src/lib/grid.ts src/lib/grid.test.ts
git commit -m "feat: add grid constants and world-to-grid conversion"
```

---

### Task 4: `lib/collision.ts` — overlap detection

**Files:**
- Create: `src/lib/collision.ts`
- Test: `src/lib/collision.test.ts`

**Interfaces:**
- Consumes: `PieceInstance`, `getFootprint` from `src/lib/pieces.ts` (Task 2).
- Produces: `Rect`, `pieceRect(piece: PieceInstance): Rect`,
  `rectsOverlap(a: Rect, b: Rect): boolean`,
  `hasCollision(candidate: PieceInstance, others: PieceInstance[]): boolean` — used by
  `store/sceneStore.ts` (Task 7).

- [ ] **Step 1: Write the failing test**

Create `src/lib/collision.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { hasCollision, rectsOverlap } from './collision';
import type { PieceInstance } from './pieces';

describe('rectsOverlap', () => {
  it('detects overlapping rectangles', () => {
    expect(
      rectsOverlap({ x: 0, y: 0, width: 2, depth: 2 }, { x: 1, y: 1, width: 2, depth: 2 }),
    ).toBe(true);
  });

  it('treats touching (adjacent) rectangles as not overlapping', () => {
    expect(
      rectsOverlap({ x: 0, y: 0, width: 2, depth: 2 }, { x: 2, y: 0, width: 2, depth: 2 }),
    ).toBe(false);
  });

  it('treats separate rectangles as not overlapping', () => {
    expect(
      rectsOverlap({ x: 0, y: 0, width: 1, depth: 1 }, { x: 5, y: 5, width: 1, depth: 1 }),
    ).toBe(false);
  });
});

describe('hasCollision', () => {
  const others: PieceInstance[] = [
    { id: 'a', type: 'pallet', gridX: 0, gridY: 0, rotation: 0 },
  ];

  it('returns true when the candidate overlaps another piece', () => {
    const candidate: PieceInstance = { id: 'b', type: 'crate', gridX: 0, gridY: 0, rotation: 0 };
    expect(hasCollision(candidate, others)).toBe(true);
  });

  it('returns false when the candidate does not overlap any other piece', () => {
    const candidate: PieceInstance = { id: 'b', type: 'crate', gridX: 5, gridY: 5, rotation: 0 };
    expect(hasCollision(candidate, others)).toBe(false);
  });

  it('ignores the candidate against its own previous position (same id)', () => {
    const candidate: PieceInstance = { id: 'a', type: 'pallet', gridX: 0, gridY: 0, rotation: 0 };
    expect(hasCollision(candidate, others)).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run src/lib/collision.test.ts`
Expected: FAIL — module `./collision` not found.

- [ ] **Step 3: Write the implementation**

Create `src/lib/collision.ts`:
```ts
import { getFootprint, type PieceInstance } from './pieces';

export interface Rect {
  x: number;
  y: number;
  width: number;
  depth: number;
}

export function pieceRect(piece: PieceInstance): Rect {
  const { width, depth } = getFootprint(piece);
  return { x: piece.gridX, y: piece.gridY, width, depth };
}

export function rectsOverlap(a: Rect, b: Rect): boolean {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.depth &&
    a.y + a.depth > b.y
  );
}

export function hasCollision(candidate: PieceInstance, others: PieceInstance[]): boolean {
  const candidateRect = pieceRect(candidate);
  return others
    .filter((p) => p.id !== candidate.id)
    .some((p) => rectsOverlap(candidateRect, pieceRect(p)));
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run src/lib/collision.test.ts`
Expected: PASS (6 tests)

- [ ] **Step 5: Commit**

```bash
git add src/lib/collision.ts src/lib/collision.test.ts
git commit -m "feat: add AABB collision detection for pieces"
```

---

### Task 5: `lib/measurement.ts` — size/distance formatting

**Files:**
- Create: `src/lib/measurement.ts`
- Test: `src/lib/measurement.test.ts`

**Interfaces:**
- Consumes: `PieceInstance`, `getFootprint` from `src/lib/pieces.ts` (Task 2),
  `CELL_SIZE_METERS` from `src/lib/grid.ts` (Task 3).
- Produces: `formatSize(piece: PieceInstance): string`,
  `pieceCenter(piece: PieceInstance): { x: number; y: number }`,
  `formatDistance(a: PieceInstance, b: PieceInstance): string` — used by
  `ui/MeasurementPanel` (Task 11).

- [ ] **Step 1: Write the failing test**

Create `src/lib/measurement.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { formatSize, formatDistance } from './measurement';
import type { PieceInstance } from './pieces';

describe('formatSize', () => {
  it('formats a 1x1 piece using the 1.2m cell scale', () => {
    const pallet: PieceInstance = { id: 'a', type: 'pallet', gridX: 0, gridY: 0, rotation: 0 };
    expect(formatSize(pallet)).toBe('1.2m × 1.2m');
  });

  it('formats a 2x1 piece', () => {
    const shelf: PieceInstance = { id: 'b', type: 'shelf', gridX: 0, gridY: 0, rotation: 0 };
    expect(formatSize(shelf)).toBe('2.4m × 1.2m');
  });
});

describe('formatDistance', () => {
  it('formats the distance between two piece centers', () => {
    const a: PieceInstance = { id: 'a', type: 'pallet', gridX: 0, gridY: 0, rotation: 0 };
    const b: PieceInstance = { id: 'b', type: 'pallet', gridX: 3, gridY: 0, rotation: 0 };
    expect(formatDistance(a, b)).toBe('3.6m');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run src/lib/measurement.test.ts`
Expected: FAIL — module `./measurement` not found.

- [ ] **Step 3: Write the implementation**

Create `src/lib/measurement.ts`:
```ts
import { CELL_SIZE_METERS } from './grid';
import { getFootprint, type PieceInstance } from './pieces';

export function formatSize(piece: PieceInstance): string {
  const { width, depth } = getFootprint(piece);
  const w = (width * CELL_SIZE_METERS).toFixed(1);
  const d = (depth * CELL_SIZE_METERS).toFixed(1);
  return `${w}m × ${d}m`;
}

export function pieceCenter(piece: PieceInstance): { x: number; y: number } {
  const { width, depth } = getFootprint(piece);
  return {
    x: (piece.gridX + width / 2) * CELL_SIZE_METERS,
    y: (piece.gridY + depth / 2) * CELL_SIZE_METERS,
  };
}

export function formatDistance(a: PieceInstance, b: PieceInstance): string {
  const ca = pieceCenter(a);
  const cb = pieceCenter(b);
  const dist = Math.hypot(ca.x - cb.x, ca.y - cb.y);
  return `${dist.toFixed(1)}m`;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run src/lib/measurement.test.ts`
Expected: PASS (3 tests)

- [ ] **Step 5: Commit**

```bash
git add src/lib/measurement.ts src/lib/measurement.test.ts
git commit -m "feat: add real-world size and distance formatting"
```

---

### Task 6: `persistence/localStorage.ts`

**Files:**
- Create: `src/persistence/localStorage.ts`
- Test: `src/persistence/localStorage.test.ts`

**Interfaces:**
- Consumes: `PieceInstance` from `src/lib/pieces.ts` (Task 2).
- Produces: `saveScene(pieces: PieceInstance[]): void`,
  `loadScene(): PieceInstance[] | null` — used by `store/sceneStore.ts` (Task 7). This is
  the interface `persistence/supabase.ts` will also implement in the follow-up plan.

- [ ] **Step 1: Write the failing test**

Create `src/persistence/localStorage.test.ts`:
```ts
import { beforeEach, describe, expect, it } from 'vitest';
import { saveScene, loadScene } from './localStorage';
import type { PieceInstance } from '../lib/pieces';

describe('localStorage persistence', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('returns null when nothing has been saved', () => {
    expect(loadScene()).toBeNull();
  });

  it('round-trips a saved scene', () => {
    const pieces: PieceInstance[] = [{ id: 'a', type: 'pallet', gridX: 0, gridY: 0, rotation: 0 }];
    saveScene(pieces);
    expect(loadScene()).toEqual(pieces);
  });

  it('returns null for malformed stored JSON instead of throwing', () => {
    localStorage.setItem('warehouse-layout-scene', '{not json');
    expect(loadScene()).toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run src/persistence/localStorage.test.ts`
Expected: FAIL — module `./localStorage` not found.

- [ ] **Step 3: Write the implementation**

Create `src/persistence/localStorage.ts`:
```ts
import type { PieceInstance } from '../lib/pieces';

const STORAGE_KEY = 'warehouse-layout-scene';

export function saveScene(pieces: PieceInstance[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(pieces));
}

export function loadScene(): PieceInstance[] | null {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as PieceInstance[];
  } catch {
    return null;
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run src/persistence/localStorage.test.ts`
Expected: PASS (3 tests)

- [ ] **Step 5: Commit**

```bash
git add src/persistence/localStorage.ts src/persistence/localStorage.test.ts
git commit -m "feat: add localStorage persistence backend"
```

---

### Task 7: `store/sceneStore.ts` — Zustand store

**Files:**
- Create: `src/store/sceneStore.ts`
- Test: `src/store/sceneStore.test.ts`

**Interfaces:**
- Consumes: `PieceInstance`, `getFootprint` from `src/lib/pieces.ts`,
  `hasCollision` from `src/lib/collision.ts`, `worldToGrid` from `src/lib/grid.ts`,
  `saveScene`/`loadScene` from `src/persistence/localStorage.ts`.
- Produces: `useSceneStore` (Zustand hook), `INITIAL_PIECES`, and the store shape from
  `ARCHITECTURE.md`: `pieces`, `selectedIds`, `viewMode`, `selectPiece(id)`,
  `clearSelection()`, `movePiece(id, worldX, worldZ): boolean`, `rotatePiece(id)`,
  `setViewMode(mode)`, `saveScene()`, `loadScene()`. Every later `scene/` and `ui/` task
  consumes this.

- [ ] **Step 1: Write the failing test**

Create `src/store/sceneStore.test.ts`:
```ts
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run src/store/sceneStore.test.ts`
Expected: FAIL — module `./sceneStore` not found.

- [ ] **Step 3: Write the implementation**

Create `src/store/sceneStore.ts`:
```ts
import { create } from 'zustand';
import { getFootprint, type PieceInstance } from '../lib/pieces';
import { hasCollision } from '../lib/collision';
import { worldToGrid } from '../lib/grid';
import { saveScene as persistSave, loadScene as persistLoad } from '../persistence/localStorage';

interface SceneState {
  pieces: PieceInstance[];
  selectedIds: string[];
  viewMode: 'top' | 'perspective';
  selectPiece: (id: string) => void;
  clearSelection: () => void;
  movePiece: (id: string, worldX: number, worldZ: number) => boolean;
  rotatePiece: (id: string) => void;
  setViewMode: (mode: 'top' | 'perspective') => void;
  saveScene: () => void;
  loadScene: () => void;
}

export const INITIAL_PIECES: PieceInstance[] = [
  { id: 'pallet-1', type: 'pallet', gridX: 0, gridY: 0, rotation: 0 },
  { id: 'shelf-1', type: 'shelf', gridX: 3, gridY: 0, rotation: 0 },
  { id: 'crate-1', type: 'crate', gridX: 6, gridY: 0, rotation: 0 },
  { id: 'workstation-1', type: 'workstation', gridX: 0, gridY: 3, rotation: 0 },
];

export const useSceneStore = create<SceneState>((set, get) => ({
  pieces: INITIAL_PIECES,
  selectedIds: [],
  viewMode: 'top',

  selectPiece: (id) => {
    const { selectedIds } = get();
    if (selectedIds.length === 0) {
      set({ selectedIds: [id] });
    } else if (selectedIds.length === 1) {
      set({ selectedIds: selectedIds[0] === id ? selectedIds : [selectedIds[0], id] });
    } else {
      set({ selectedIds: [id] });
    }
  },

  clearSelection: () => set({ selectedIds: [] }),

  movePiece: (id, worldX, worldZ) => {
    const { pieces } = get();
    const piece = pieces.find((p) => p.id === id);
    if (!piece) return false;
    const footprint = getFootprint(piece);
    const { gridX, gridY } = worldToGrid(worldX, worldZ, footprint.width, footprint.depth);
    const candidate: PieceInstance = { ...piece, gridX, gridY };
    if (hasCollision(candidate, pieces)) return false;
    set({ pieces: pieces.map((p) => (p.id === id ? candidate : p)) });
    return true;
  },

  rotatePiece: (id) => {
    const { pieces } = get();
    const piece = pieces.find((p) => p.id === id);
    if (!piece) return;
    const candidate: PieceInstance = { ...piece, rotation: piece.rotation === 0 ? 90 : 0 };
    if (hasCollision(candidate, pieces)) return;
    set({ pieces: pieces.map((p) => (p.id === id ? candidate : p)) });
  },

  setViewMode: (viewMode) => set({ viewMode }),

  saveScene: () => persistSave(get().pieces),
  loadScene: () => {
    const loaded = persistLoad();
    if (loaded) set({ pieces: loaded, selectedIds: [] });
  },
}));
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run src/store/sceneStore.test.ts`
Expected: PASS (6 tests)

- [ ] **Step 5: Commit**

```bash
git add src/store/sceneStore.ts src/store/sceneStore.test.ts
git commit -m "feat: add Zustand scene store with selection, move, rotate, persistence"
```

---

### Task 8: `scene/Board.tsx` + `scene/DragPlane.tsx`

**Files:**
- Create: `src/scene/Board.tsx`, `src/scene/DragPlane.tsx`
- No unit test (R3F/WebGL — verified manually per the testing strategy).

**Interfaces:**
- Consumes: `BOARD_WIDTH`, `BOARD_DEPTH`, `CELL_SIZE_METERS` from `src/lib/grid.ts`.
- Produces: `<Board />` (renders the base plane + grid lines), `<DragPlane active
  onDragMove onDragEnd />` (invisible plane used for drag raycasting, see Task 9) — both
  consumed by `scene/Pieces.tsx` and `scene/Scene.tsx` (Tasks 9-10).

- [ ] **Step 1: Implement the board**

Create `src/scene/Board.tsx`:
```tsx
import { Grid } from '@react-three/drei';
import { BOARD_WIDTH, BOARD_DEPTH, CELL_SIZE_METERS } from '../lib/grid';

const widthMeters = BOARD_WIDTH * CELL_SIZE_METERS;
const depthMeters = BOARD_DEPTH * CELL_SIZE_METERS;

export function Board() {
  return (
    <group>
      <mesh position={[widthMeters / 2, 0, depthMeters / 2]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[widthMeters, depthMeters]} />
        <meshStandardMaterial color="#f2f1ec" />
      </mesh>
      <Grid
        position={[widthMeters / 2, 0.01, depthMeters / 2]}
        args={[widthMeters, depthMeters]}
        cellSize={CELL_SIZE_METERS}
        cellColor="#c9c7bd"
        sectionSize={widthMeters}
        sectionColor="#9a988e"
        fadeDistance={100}
        infiniteGrid={false}
      />
    </group>
  );
}
```

- [ ] **Step 2: Implement the drag plane**

Create `src/scene/DragPlane.tsx`:
```tsx
import type { ThreeEvent } from '@react-three/fiber';
import { BOARD_WIDTH, BOARD_DEPTH, CELL_SIZE_METERS } from '../lib/grid';

interface DragPlaneProps {
  active: boolean;
  onDragMove: (event: ThreeEvent<PointerEvent>) => void;
  onDragEnd: () => void;
}

const PADDING_METERS = 5;
const planeWidth = BOARD_WIDTH * CELL_SIZE_METERS + PADDING_METERS * 2;
const planeDepth = BOARD_DEPTH * CELL_SIZE_METERS + PADDING_METERS * 2;

export function DragPlane({ active, onDragMove, onDragEnd }: DragPlaneProps) {
  return (
    <mesh
      position={[(BOARD_WIDTH * CELL_SIZE_METERS) / 2, 0.3, (BOARD_DEPTH * CELL_SIZE_METERS) / 2]}
      rotation={[-Math.PI / 2, 0, 0]}
      onPointerMove={active ? onDragMove : undefined}
      onPointerUp={active ? onDragEnd : undefined}
      onPointerLeave={active ? onDragEnd : undefined}
    >
      <planeGeometry args={[planeWidth, planeDepth]} />
      <meshBasicMaterial transparent opacity={0} depthWrite={false} />
    </mesh>
  );
}
```

The plane must stay raycastable while invisible — `transparent opacity={0}` (not
`visible={false}`, which some three.js versions exclude from raycasting) keeps it a
valid raycast target for `event.point`.

- [ ] **Step 3: Verify it typechecks**

Run: `pnpm typecheck`
Expected: no errors (these components aren't wired into the app yet, but must compile).

- [ ] **Step 4: Commit**

```bash
git add src/scene/Board.tsx src/scene/DragPlane.tsx
git commit -m "feat: add 3D board plane, grid lines, and drag raycast plane"
```

---

### Task 9: `scene/Piece.tsx` + `scene/Pieces.tsx`

**Files:**
- Create: `src/scene/Piece.tsx`, `src/scene/Pieces.tsx`
- No unit test (R3F/WebGL — verified manually).

**Interfaces:**
- Consumes: `useSceneStore` (Task 7), `PIECE_DEFS`/`getFootprint`/`PieceInstance` (Task
  2), `CELL_SIZE_METERS` (Task 3), `DragPlane` (Task 8).
- Produces: `<Pieces onDragStateChange={(isDragging: boolean) => void} />` — consumed by
  `scene/Scene.tsx` (Task 10), which uses `isDragging` to disable camera pan while a
  piece is being dragged.

- [ ] **Step 1: Implement the piece component**

Create `src/scene/Piece.tsx`:
```tsx
import type { ThreeEvent } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import { PIECE_DEFS, getFootprint, type PieceInstance } from '../lib/pieces';
import { CELL_SIZE_METERS } from '../lib/grid';
import { useSceneStore } from '../store/sceneStore';

interface PieceProps {
  piece: PieceInstance;
  dragPoint: { x: number; z: number } | null;
  onDragStart: () => void;
}

export function Piece({ piece, dragPoint, onDragStart }: PieceProps) {
  const def = PIECE_DEFS[piece.type];
  const { width, depth } = getFootprint(piece);
  const selectedIds = useSceneStore((s) => s.selectedIds);
  const selectPiece = useSceneStore((s) => s.selectPiece);
  const isSelected = selectedIds.includes(piece.id);

  const restPosition: [number, number, number] = [
    (piece.gridX + width / 2) * CELL_SIZE_METERS,
    0.3,
    (piece.gridY + depth / 2) * CELL_SIZE_METERS,
  ];
  const position: [number, number, number] = dragPoint
    ? [dragPoint.x, 0.3, dragPoint.z]
    : restPosition;

  function handlePointerDown(event: ThreeEvent<PointerEvent>) {
    event.stopPropagation();
    selectPiece(piece.id);
    onDragStart();
  }

  return (
    <group position={position} onPointerDown={handlePointerDown}>
      <mesh>
        <boxGeometry args={[width * CELL_SIZE_METERS * 0.9, 0.6, depth * CELL_SIZE_METERS * 0.9]} />
        <meshStandardMaterial color={isSelected ? '#2f6fed' : def.color} />
      </mesh>
      {isSelected && (
        <Html position={[0, 0.6, 0]} center>
          <div className="whitespace-nowrap rounded bg-paper-raised px-1.5 py-0.5 text-xs text-ink shadow-sm">
            {def.label}
          </div>
        </Html>
      )}
    </group>
  );
}
```

- [ ] **Step 2: Implement the pieces container**

Create `src/scene/Pieces.tsx`:
```tsx
import { useState } from 'react';
import type { ThreeEvent } from '@react-three/fiber';
import { useSceneStore } from '../store/sceneStore';
import { Piece } from './Piece';
import { DragPlane } from './DragPlane';

interface PiecesProps {
  onDragStateChange: (isDragging: boolean) => void;
}

export function Pieces({ onDragStateChange }: PiecesProps) {
  const pieces = useSceneStore((s) => s.pieces);
  const movePiece = useSceneStore((s) => s.movePiece);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragPoint, setDragPoint] = useState<{ x: number; z: number } | null>(null);

  function startDrag(id: string) {
    setDraggingId(id);
    onDragStateChange(true);
  }

  function handleDragMove(event: ThreeEvent<PointerEvent>) {
    setDragPoint({ x: event.point.x, z: event.point.z });
  }

  function handleDragEnd() {
    if (draggingId && dragPoint) {
      movePiece(draggingId, dragPoint.x, dragPoint.z);
    }
    setDraggingId(null);
    setDragPoint(null);
    onDragStateChange(false);
  }

  return (
    <>
      <DragPlane active={draggingId !== null} onDragMove={handleDragMove} onDragEnd={handleDragEnd} />
      {pieces.map((piece) => (
        <Piece
          key={piece.id}
          piece={piece}
          dragPoint={piece.id === draggingId ? dragPoint : null}
          onDragStart={() => startDrag(piece.id)}
        />
      ))}
    </>
  );
}
```

Note on the interaction model from `DESIGN.md`: plain click already implements
"tap a piece to select, tap a second to add to selection" via `selectPiece`'s rule
(Task 7) — `Shift`+click needs no special handling, since a second click already does
the same thing regardless of the modifier key.

- [ ] **Step 3: Verify it typechecks**

Run: `pnpm typecheck`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/scene/Piece.tsx src/scene/Pieces.tsx
git commit -m "feat: add draggable/selectable piece components"
```

---

### Task 10: `scene/Scene.tsx` — camera and canvas wiring

**Files:**
- Create: `src/scene/Scene.tsx`
- No unit test (R3F/WebGL — verified manually).

**Interfaces:**
- Consumes: `Board` (Task 8), `Pieces` (Task 9), `useSceneStore` (Task 7).
- Produces: `<Scene />` — the full 3D canvas, consumed by `App.tsx` (Task 14).

- [ ] **Step 1: Implement the scene**

Create `src/scene/Scene.tsx`:
```tsx
import { useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrthographicCamera, MapControls } from '@react-three/drei';
import { Board } from './Board';
import { Pieces } from './Pieces';
import { useSceneStore } from '../store/sceneStore';

export function Scene() {
  const [isDragging, setIsDragging] = useState(false);
  const clearSelection = useSceneStore((s) => s.clearSelection);

  return (
    <Canvas onPointerMissed={clearSelection}>
      <OrthographicCamera makeDefault position={[6, 20, 4.8]} zoom={40} up={[0, 0, -1]} />
      <ambientLight intensity={0.9} />
      <directionalLight position={[5, 10, 5]} intensity={0.5} />
      <Board />
      <Pieces onDragStateChange={setIsDragging} />
      <MapControls enabled={!isDragging} enableRotate={false} screenSpacePanning />
    </Canvas>
  );
}
```

`enableRotate={false}` on `MapControls` is what enforces the "locked top-down, no
orbit" hard requirement — pan and zoom (pinch/scroll-wheel) still work, satisfying the
mobile-first interaction spec from `DESIGN.md`.

- [ ] **Step 2: Verify it typechecks**

Run: `pnpm typecheck`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/scene/Scene.tsx
git commit -m "feat: add Scene with locked orthographic top-down camera"
```

---

### Task 11: `ui/Legend`, `ui/MeasurementPanel`, `ui/RotateButton`

**Files:**
- Create: `src/ui/Legend/Legend.tsx`, `src/ui/Legend/Legend.test.tsx`, `src/ui/Legend/index.ts`
- Create: `src/ui/MeasurementPanel/MeasurementPanel.tsx`,
  `src/ui/MeasurementPanel/MeasurementPanel.test.tsx`, `src/ui/MeasurementPanel/index.ts`
- Create: `src/ui/RotateButton/RotateButton.tsx`, `src/ui/RotateButton/RotateButton.test.tsx`,
  `src/ui/RotateButton/index.ts`

**Interfaces:**
- Consumes: `useSceneStore` (Task 7), `PIECE_DEFS` (Task 2), `formatSize`/`formatDistance`
  (Task 5).
- Produces: `<Legend />`, `<MeasurementPanel />`, `<RotateButton />` — consumed by
  `App.tsx` (Task 14).

Styling is Tailwind utility classes directly in JSX (see `ARCHITECTURE.md`'s Styling
section) — `bg-accent`/`text-ink`/etc. resolve to the `STYLE_GUIDE.md` palette via the
`@theme` tokens defined in `src/index.css` (added in Task 1). No per-component `.css`
file for any of these three.

- [ ] **Step 1: Write the failing Legend test**

Create `src/ui/Legend/Legend.test.tsx`:
```tsx
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Legend } from './Legend';

describe('Legend', () => {
  it('lists every piece type by label', () => {
    render(<Legend />);
    expect(screen.getByText('Pallet')).toBeInTheDocument();
    expect(screen.getByText('Shelf')).toBeInTheDocument();
    expect(screen.getByText('Crate')).toBeInTheDocument();
    expect(screen.getByText('Workstation')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run src/ui/Legend/Legend.test.tsx`
Expected: FAIL — `./Legend` not found.

- [ ] **Step 3: Implement Legend**

Create `src/ui/Legend/Legend.tsx`:
```tsx
import { PIECE_DEFS } from '../../lib/pieces';

export function Legend() {
  return (
    <ul className="flex flex-col gap-1 text-sm text-ink">
      {Object.values(PIECE_DEFS).map((def) => (
        <li key={def.type} className="flex items-center gap-2">
          <span className="inline-block h-3 w-3 rounded-sm" style={{ backgroundColor: def.color }} />
          {def.label}
        </li>
      ))}
    </ul>
  );
}
```

Create `src/ui/Legend/index.ts`:
```ts
export * from './Legend';
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run src/ui/Legend/Legend.test.tsx`
Expected: PASS (1 test)

- [ ] **Step 5: Write the failing MeasurementPanel test**

Create `src/ui/MeasurementPanel/MeasurementPanel.test.tsx`:
```tsx
import { beforeEach, describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MeasurementPanel } from './MeasurementPanel';
import { useSceneStore, INITIAL_PIECES } from '../../store/sceneStore';

beforeEach(() => {
  useSceneStore.setState({ pieces: INITIAL_PIECES, selectedIds: [], viewMode: 'top' });
});

describe('MeasurementPanel', () => {
  it('prompts for a selection when nothing is selected', () => {
    render(<MeasurementPanel />);
    expect(screen.getByText(/select a piece/i)).toBeInTheDocument();
  });

  it('shows the size of a single selected piece', () => {
    useSceneStore.setState({ selectedIds: ['pallet-1'] });
    render(<MeasurementPanel />);
    expect(screen.getByText(/1\.2m × 1\.2m/)).toBeInTheDocument();
  });

  it('shows the distance between two selected pieces', () => {
    // pallet-1 at (0,0) center (0.6,0.6); crate-1 at (6,0) center (7.8,0.6) -> 7.2m
    useSceneStore.setState({ selectedIds: ['pallet-1', 'crate-1'] });
    render(<MeasurementPanel />);
    expect(screen.getByText(/7\.2m/)).toBeInTheDocument();
  });
});
```

- [ ] **Step 6: Run test to verify it fails**

Run: `pnpm vitest run src/ui/MeasurementPanel/MeasurementPanel.test.tsx`
Expected: FAIL — `./MeasurementPanel` not found.

- [ ] **Step 7: Implement MeasurementPanel**

Create `src/ui/MeasurementPanel/MeasurementPanel.tsx`:
```tsx
import { useSceneStore } from '../../store/sceneStore';
import { formatSize, formatDistance } from '../../lib/measurement';

export function MeasurementPanel() {
  const selectedIds = useSceneStore((s) => s.selectedIds);
  const pieces = useSceneStore((s) => s.pieces);

  const selected = selectedIds
    .map((id) => pieces.find((p) => p.id === id))
    .filter((p): p is NonNullable<typeof p> => p !== undefined);

  if (selected.length === 0) {
    return <div className="text-sm text-ink">Select a piece to see its size.</div>;
  }
  if (selected.length === 1) {
    return <div className="text-sm text-ink">Size: {formatSize(selected[0])}</div>;
  }
  return <div className="text-sm text-ink">Distance: {formatDistance(selected[0], selected[1])}</div>;
}
```

Create `src/ui/MeasurementPanel/index.ts`:
```ts
export * from './MeasurementPanel';
```

- [ ] **Step 8: Run test to verify it passes**

Run: `pnpm vitest run src/ui/MeasurementPanel/MeasurementPanel.test.tsx`
Expected: PASS (3 tests)

- [ ] **Step 9: Write the failing RotateButton test**

Create `src/ui/RotateButton/RotateButton.test.tsx`:
```tsx
import { beforeEach, describe, expect, it } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { RotateButton } from './RotateButton';
import { useSceneStore, INITIAL_PIECES } from '../../store/sceneStore';

beforeEach(() => {
  useSceneStore.setState({ pieces: INITIAL_PIECES, selectedIds: [], viewMode: 'top' });
});

describe('RotateButton', () => {
  it('renders nothing when no piece is selected', () => {
    render(<RotateButton />);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('renders nothing when two pieces are selected', () => {
    useSceneStore.setState({ selectedIds: ['pallet-1', 'shelf-1'] });
    render(<RotateButton />);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('rotates the selected piece when clicked', () => {
    useSceneStore.setState({ selectedIds: ['shelf-1'] });
    render(<RotateButton />);
    fireEvent.click(screen.getByRole('button', { name: /rotate/i }));
    const shelf = useSceneStore.getState().pieces.find((p) => p.id === 'shelf-1');
    expect(shelf?.rotation).toBe(90);
  });
});
```

- [ ] **Step 10: Run test to verify it fails**

Run: `pnpm vitest run src/ui/RotateButton/RotateButton.test.tsx`
Expected: FAIL — `./RotateButton` not found.

- [ ] **Step 11: Implement RotateButton**

Create `src/ui/RotateButton/RotateButton.tsx`:
```tsx
import { useSceneStore } from '../../store/sceneStore';

export function RotateButton() {
  const selectedIds = useSceneStore((s) => s.selectedIds);
  const rotatePiece = useSceneStore((s) => s.rotatePiece);

  if (selectedIds.length !== 1) return null;

  return (
    <button
      type="button"
      onClick={() => rotatePiece(selectedIds[0])}
      className="cursor-pointer self-start rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-ink"
    >
      Rotate 90°
    </button>
  );
}
```

Create `src/ui/RotateButton/index.ts`:
```ts
export * from './RotateButton';
```

- [ ] **Step 12: Run test to verify it passes**

Run: `pnpm vitest run src/ui/RotateButton/RotateButton.test.tsx`
Expected: PASS (3 tests)

- [ ] **Step 13: Commit**

```bash
git add src/ui/Legend src/ui/MeasurementPanel src/ui/RotateButton
git commit -m "feat: add Legend, MeasurementPanel, and RotateButton UI components"
```

---

### Task 12: `ui/ResponsiveLayout`

**Files:**
- Create: `src/ui/ResponsiveLayout/ResponsiveLayout.tsx`,
  `src/ui/ResponsiveLayout/ResponsiveLayout.test.tsx`, `src/ui/ResponsiveLayout/index.ts`

**Interfaces:**
- Consumes: nothing (pure layout wrapper, takes `scene`/`panel` as `ReactNode` props).
- Produces: `<ResponsiveLayout scene={ReactNode} panel={ReactNode} />` — consumed by
  `App.tsx` (Task 14).

- [ ] **Step 1: Write the failing test**

Create `src/ui/ResponsiveLayout/ResponsiveLayout.test.tsx`:
```tsx
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ResponsiveLayout } from './ResponsiveLayout';

describe('ResponsiveLayout', () => {
  it('renders both the scene and panel content', () => {
    render(<ResponsiveLayout scene={<div>scene-content</div>} panel={<div>panel-content</div>} />);
    expect(screen.getByText('scene-content')).toBeInTheDocument();
    expect(screen.getByText('panel-content')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run src/ui/ResponsiveLayout/ResponsiveLayout.test.tsx`
Expected: FAIL — `./ResponsiveLayout` not found.

- [ ] **Step 3: Implement the component**

Tailwind's default `md` breakpoint (768px) matches the mobile/desktop split from
`DESIGN.md`: column layout (bottom sheet) below it, row layout (sidebar) at/above it.

Create `src/ui/ResponsiveLayout/ResponsiveLayout.tsx`:
```tsx
import type { ReactNode } from 'react';

interface ResponsiveLayoutProps {
  scene: ReactNode;
  panel: ReactNode;
}

export function ResponsiveLayout({ scene, panel }: ResponsiveLayoutProps) {
  return (
    <div className="flex h-screen w-screen flex-col md:flex-row">
      <div className="min-h-0 flex-1">{scene}</div>
      <div className="max-h-[40vh] w-full overflow-y-auto bg-paper-raised p-3 md:max-h-none md:w-[280px]">
        {panel}
      </div>
    </div>
  );
}
```

Create `src/ui/ResponsiveLayout/index.ts`:
```ts
export * from './ResponsiveLayout';
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run src/ui/ResponsiveLayout/ResponsiveLayout.test.tsx`
Expected: PASS (1 test)

- [ ] **Step 5: Commit**

```bash
git add src/ui/ResponsiveLayout
git commit -m "feat: add responsive sidebar/bottom-sheet layout wrapper"
```

---

### Task 13: `hooks/useKeyboardShortcuts.ts`

**Files:**
- Create: `src/hooks/useKeyboardShortcuts.ts`, `src/hooks/useKeyboardShortcuts.test.ts`

**Interfaces:**
- Consumes: `useSceneStore` (Task 7).
- Produces: `useKeyboardShortcuts(): void` — consumed by `App.tsx` (Task 14).

- [ ] **Step 1: Write the failing test**

Create `src/hooks/useKeyboardShortcuts.test.ts`:
```ts
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run src/hooks/useKeyboardShortcuts.test.ts`
Expected: FAIL — module `./useKeyboardShortcuts` not found.

- [ ] **Step 3: Write the implementation**

Create `src/hooks/useKeyboardShortcuts.ts`:
```ts
import { useEffect } from 'react';
import { useSceneStore } from '../store/sceneStore';

export function useKeyboardShortcuts(): void {
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      const { selectedIds, rotatePiece, clearSelection } = useSceneStore.getState();
      if (event.key === 'r' || event.key === 'R') {
        if (selectedIds.length === 1) rotatePiece(selectedIds[0]);
      } else if (event.key === 'Escape') {
        clearSelection();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run src/hooks/useKeyboardShortcuts.test.ts`
Expected: PASS (2 tests)

- [ ] **Step 5: Commit**

```bash
git add src/hooks/useKeyboardShortcuts.ts src/hooks/useKeyboardShortcuts.test.ts
git commit -m "feat: add R-to-rotate and Escape-to-clear keyboard shortcuts"
```

---

### Task 14: `App.tsx` wiring

**Files:**
- Modify: `src/App.tsx` (replace template content), `src/main.tsx` (verify it still
  points at `App`), `index.html` (set title, wire favicon).
- Create: `public/logo.svg`, `public/logo-mark.svg` (copied from `assets/brand/`, see
  `STYLE_GUIDE.md`).

No `src/App.css` — styling is Tailwind utility classes (see `ARCHITECTURE.md`'s Styling
section, added in Task 1).

**Interfaces:**
- Consumes: `Scene` (Task 10), `Legend`/`MeasurementPanel`/`RotateButton` (Task 11),
  `ResponsiveLayout` (Task 12), `useKeyboardShortcuts` (Task 13), `useSceneStore` (Task 7).
- Produces: the assembled app — no further tasks consume this directly, it's the root.

- [ ] **Step 1: Replace `src/App.tsx`**

```tsx
import { useEffect } from 'react';
import { Scene } from './scene/Scene';
import { MeasurementPanel } from './ui/MeasurementPanel';
import { Legend } from './ui/Legend';
import { RotateButton } from './ui/RotateButton';
import { ResponsiveLayout } from './ui/ResponsiveLayout';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { useSceneStore } from './store/sceneStore';

export function App() {
  useKeyboardShortcuts();
  const loadScene = useSceneStore((s) => s.loadScene);
  const saveScene = useSceneStore((s) => s.saveScene);
  const pieces = useSceneStore((s) => s.pieces);

  useEffect(() => {
    loadScene();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    saveScene();
  }, [pieces, saveScene]);

  return (
    <ResponsiveLayout
      scene={<Scene />}
      panel={
        <div className="flex flex-col gap-3">
          <Legend />
          <MeasurementPanel />
          <RotateButton />
        </div>
      }
    />
  );
}
```

Loading only runs once on mount; saving runs on every `pieces` change — this
auto-save/auto-load is what satisfies the "save and reload" requirement without needing
an explicit save button.

- [ ] **Step 2: Confirm `src/main.tsx` imports `App` as a named export**

`src/main.tsx` (Vite's template default uses `import App from './App.tsx'` with a
default export — since `App.tsx` now uses a named export, update the import):
```tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
```

- [ ] **Step 3: Confirm the brand SVGs and favicon/title are in place**

If Task 1 already did this (it does, per the current scaffold), this is just a check —
otherwise copy the two source files from `assets/brand/` (written in `STYLE_GUIDE.md`):
```bash
cp assets/brand/logo.svg public/logo.svg
cp assets/brand/logo-mark.svg public/logo-mark.svg
```
And confirm `index.html`'s `<head>` has:
```html
<title>Gridyard</title>
<link rel="icon" type="image/svg+xml" href="/logo-mark.svg" />
```
(The PNG favicon fallback and apple-touch-icon from `STYLE_GUIDE.md`'s asset
instructions are optional polish — add them later if there's time; the SVG favicon
above is sufficient for all evergreen browsers.)

- [ ] **Step 4: Manual verification — run the dev server**

Run: `pnpm dev`

Open the printed local URL and verify:
- The browser tab shows "Gridyard" as the title and the grid/snap-cell mark as the favicon
- The board renders top-down with visible grid lines, no perspective distortion
- All 4 pieces are visible in distinct colors, positioned per `INITIAL_PIECES`
- Clicking a piece selects it (turns blue, label appears, rotate button appears)
- Dragging a piece moves it; releasing over an occupied cell snaps it back
- Releasing over a free cell snaps it to the nearest grid cell
- Rotate button rotates the piece 90°
- Selecting a second piece shows the distance in the measurement panel
- Reloading the browser tab restores the last saved layout

- [ ] **Step 5: Commit**

```bash
git add src/App.tsx src/main.tsx index.html public/logo.svg public/logo-mark.svg
git commit -m "feat: wire scene, panels, and persistence into the app shell"
```

---

### Task 15: Finalize lint config and add CI workflow

**Files:**
- Modify: `eslint.config.js` (keep the Vite template default — no changes needed unless
  lint step in Step 1 below reports issues)
- Create: `.github/workflows/ci.yml`

**Interfaces:** none — this task wires up quality gates over everything built so far.

- [ ] **Step 1: Run the full quality gate locally and fix any issues**

```bash
pnpm lint && pnpm typecheck && pnpm test && pnpm build
```
Expected: all four commands exit 0. If `pnpm lint` reports issues (e.g. unused imports
left over from scaffolding), fix them directly in the flagged files before proceeding.

- [ ] **Step 2: Create the CI workflow**

Create `.github/workflows/ci.yml`:
```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  quality:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v4
        with:
          version: 9

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: pnpm

      - run: pnpm install --frozen-lockfile
      - run: pnpm lint
      - run: pnpm typecheck
      - run: pnpm test
      - run: pnpm build
```

- [ ] **Step 3: Commit**

```bash
git add .github/workflows/ci.yml
git commit -m "ci: add GitHub Actions workflow for lint, typecheck, test, and build"
```

Note: this workflow only runs once the repo is pushed to GitHub — `git init` and repo
creation are deferred per the project's own decision (see `DESIGN.md`), so this file sits
ready but inactive until then.

---

### Task 16: End-to-end manual verification

**Files:** none — verification only, against the running app from Task 14/Step 5.

**Interfaces:** none.

- [x] **Step 1: Verify the 7 challenge requirements against the running app**

Run `pnpm dev` and check off each, per `Teste_Tecnico_Dev_InLab_ENVIAR_5dias.pdf`:
- [x] Fixed 10×8 board, top-down, orthographic (no perspective distortion when panning)
- [x] 4 distinct pieces, each occupying its own space
- [x] Drag-to-move works with the mouse
- [x] Overlapping drop is rejected (piece snaps back, never overlaps another)
- [x] Pieces snap to the grid on release
- [x] Measurement panel shows piece size (1 selected) and distance (2 selected)
- [x] Reloading the page restores the saved layout

- [x] **Step 2: Verify mobile-first interaction (touch)**

In the browser devtools, enable device/touch emulation (or test on an actual phone) and
verify:
- [x] Tap selects a piece, tap-drag moves it
- [x] Tapping a second piece adds it to selection (distance shows)
- [x] The on-screen rotate button rotates the selected piece
- [x] Pinch zooms the camera; dragging empty board space pans it
- [x] The panel appears as a bottom sheet, not a sidebar, on a narrow viewport

- [x] **Step 3: Verify desktop keyboard shortcuts**

- [x] Selecting a piece and pressing `R` rotates it
- [x] Pressing `Escape` clears the selection

- [x] **Step 4: Record results in `AI_LOG.md`**

Append an entry to `AI_LOG.md` (following the established template) describing the
scaffolding/implementation pass: what was built, what worked first try, what needed a
fix, and what's next (Supabase follow-up, bonus features).
