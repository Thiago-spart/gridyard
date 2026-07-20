# Per-Piece Color Swap Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let a user recolor an individual selected piece via a curated swatch picker,
per `docs/superpowers/specs/2026-07-20-per-piece-color-swap-design.md`.

**Architecture:** `PieceInstance` gains an optional `colorOverride?: string`. A pure
helper `getPieceColor` in `lib/pieces.ts` resolves the effective color (override or type
default). A new store action `setPieceColor` sets/clears it — persistence is automatic
since `colorOverride` rides along on the same `pieces` array already flowing through the
existing debounced autosave. `scene/Piece.tsx` always renders the resolved color and
switches its selection highlight from a full color replacement to a drei `<Outlines>`
shell, so a custom color stays visible while selected. A new `ColorSwatchPicker` UI
component (mirroring `RotateButton`) exposes the picker next to `RotateButton`.

**Tech Stack:** React, TypeScript, React Three Fiber, @react-three/drei (`Outlines`),
Zustand, Vitest, React Testing Library, pnpm.

## Global Constraints

- Color customization is per piece **instance**, not per type — `PIECE_DEFS` (the 4 type
  defaults) and `Legend` are unchanged.
- The swatch picker offers exactly 7 buttons: one "Default" (clears the override) plus 6
  curated colors — no free-form color input. Exact hex values (do not deviate):
  - Default: piece's type color, from `PIECE_DEFS[piece.type].color`
  - Terracotta `#c65b4a`, Sage `#5f9e6f`, Violet `#8a6bb0`, Teal `#4a9a95`,
    Mustard `#d1a940`, Rose `#c76b93`
- Selection highlight changes from replacing the mesh color with `#2f6fed` to a
  `<Outlines thickness={0.05} color="#2f6fed" />` shell — the piece's real (default or
  custom) color must always be visible, including while selected.
- `scene/` (R3F/WebGL components) is not unit tested — verified manually in the running
  app. `lib/`, `store/`, and `ui/` are unit/component tested with Vitest / React Testing
  Library.
- Run `pnpm lint && pnpm typecheck && pnpm test` before every commit in this plan; all
  three must pass clean.

---

### Task 1: `colorOverride` field + `getPieceColor` helper in `lib/pieces.ts`

**Files:**
- Modify: `src/lib/pieces.ts`
- Test: `src/lib/pieces.test.ts`

**Interfaces:**
- Consumes: nothing new.
- Produces: `PieceInstance.colorOverride?: string` and
  `getPieceColor(instance: Pick<PieceInstance, 'type' | 'colorOverride'>): string` —
  consumed by Task 2 (store, for the persisted field shape), Task 3 (`Piece.tsx`
  rendering), and Task 4 (`ColorSwatchPicker`, to determine the active swatch).

- [ ] **Step 1: Write the failing tests**

  Add to `src/lib/pieces.test.ts` (after the existing `describe('PIECE_DEFS', ...)`
  block):

  ```ts
  describe('getPieceColor', () => {
    it('returns the type default when there is no override', () => {
      expect(getPieceColor({ type: 'crate' })).toBe(PIECE_DEFS.crate.color);
    });

    it('returns the override when one is set', () => {
      expect(getPieceColor({ type: 'crate', colorOverride: '#5f9e6f' })).toBe('#5f9e6f');
    });
  });
  ```

  Update the import at the top of the file to include `getPieceColor`:

  ```ts
  import { PIECE_DEFS, getFootprint, getPieceColor } from './pieces';
  ```

- [ ] **Step 2: Run tests to verify they fail**

  Run: `pnpm test -- pieces.test`
  Expected: FAIL — `getPieceColor` is not exported.

- [ ] **Step 3: Implement `colorOverride` and `getPieceColor`**

  In `src/lib/pieces.ts`, update the `PieceInstance` interface (currently `id`, `type`,
  `gridX`, `gridY`, `rotation`) to add the new optional field — full updated interface:

  ```ts
  export interface PieceInstance {
    id: string;
    type: PieceType;
    gridX: number;
    gridY: number;
    rotation: 0 | 90;
    colorOverride?: string;
  }
  ```

  Add the helper at the end of the file:

  ```ts
  export function getPieceColor(
    instance: Pick<PieceInstance, 'type' | 'colorOverride'>,
  ): string {
    return instance.colorOverride ?? PIECE_DEFS[instance.type].color;
  }
  ```

- [ ] **Step 4: Run tests to verify they pass**

  Run: `pnpm test -- pieces.test`
  Expected: PASS, all tests including the two new ones.

- [ ] **Step 5: Commit**

  ```bash
  git add src/lib/pieces.ts src/lib/pieces.test.ts
  git commit -m "feat: add colorOverride field and getPieceColor helper"
  ```

---

### Task 2: `setPieceColor` store action

**Files:**
- Modify: `src/store/sceneStore.ts`
- Test: `src/store/sceneStore.test.ts`

**Interfaces:**
- Consumes: `PieceInstance.colorOverride` (Task 1).
- Produces: `setPieceColor: (id: string, color: string | null) => void` on
  `SceneState` — consumed by Task 4 (`ColorSwatchPicker`).

- [ ] **Step 1: Write the failing tests**

  In `src/store/sceneStore.test.ts`, add a new `describe` block right after the existing
  `describe('rotatePiece', ...)` block (currently ends at line 82, right before
  `describe('setViewMode', ...)`):

  ```ts
  describe('setPieceColor', () => {
    it('sets a colorOverride on the target piece only', () => {
      useSceneStore.getState().setPieceColor('crate-1', '#5f9e6f');
      const pieces = useSceneStore.getState().pieces;
      expect(pieces.find((p) => p.id === 'crate-1')?.colorOverride).toBe('#5f9e6f');
      expect(pieces.find((p) => p.id === 'pallet-1')?.colorOverride).toBeUndefined();
    });

    it('clears colorOverride when passed null', () => {
      useSceneStore.getState().setPieceColor('crate-1', '#5f9e6f');
      useSceneStore.getState().setPieceColor('crate-1', null);
      const crate = useSceneStore.getState().pieces.find((p) => p.id === 'crate-1');
      expect(crate?.colorOverride).toBeUndefined();
    });
  });
  ```

- [ ] **Step 2: Run tests to verify they fail**

  Run: `pnpm test -- sceneStore`
  Expected: FAIL — `setPieceColor` is not a function.

- [ ] **Step 3: Implement `setPieceColor`**

  In `src/store/sceneStore.ts`, add to the `SceneState` interface, right after
  `rotatePiece: (id: string) => void;`:

  ```ts
  setPieceColor: (id: string, color: string | null) => void;
  ```

  Add the action in the store body, right after the `rotatePiece` action (before
  `setViewMode`):

  ```ts
  setPieceColor: (id, color) => {
    const { pieces } = get();
    set({
      pieces: pieces.map((p) => (p.id === id ? { ...p, colorOverride: color ?? undefined } : p)),
    });
  },
  ```

- [ ] **Step 4: Run tests to verify they pass**

  Run: `pnpm test -- sceneStore`
  Expected: PASS, all tests including the two new ones.

- [ ] **Step 5: Commit**

  ```bash
  git add src/store/sceneStore.ts src/store/sceneStore.test.ts
  git commit -m "feat: add setPieceColor action to scene store"
  ```

---

### Task 3: Render resolved color + outline-on-select in `scene/Piece.tsx`

**Files:**
- Modify: `src/scene/Piece.tsx`

**Interfaces:**
- Consumes: `getPieceColor` from `src/lib/pieces` (Task 1). `Outlines` from
  `@react-three/drei` (already a project dependency, used elsewhere in the codebase's
  drei imports).
- Produces: nothing consumed by later tasks — this is the rendering leaf.

- [ ] **Step 1: Replace `Piece.tsx` with the color-resolving, outline-highlighting version**

  This file is in `scene/`, which per the Global Constraints is not unit tested — write
  the implementation directly, then verify manually in Task 5.

  Full new content for `src/scene/Piece.tsx`:

  ```tsx
  import type { ThreeEvent } from '@react-three/fiber';
  import { Html, Outlines } from '@react-three/drei';
  import { PIECE_DEFS, getFootprint, getPieceColor, type PieceInstance } from '../lib/pieces';
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
          <meshStandardMaterial color={getPieceColor(piece)} />
          {isSelected && <Outlines thickness={0.05} color="#2f6fed" />}
        </mesh>
        {isSelected && (
          <Html position={[0, 0.6, 0]} center wrapperClass="pointer-events-none">
            <div className="whitespace-nowrap rounded bg-paper-raised px-1.5 py-0.5 text-xs text-ink shadow-sm">
              {def.label}
            </div>
          </Html>
        )}
      </group>
    );
  }
  ```

  Note: this is the same `mesh` that previously had `color={isSelected ? '#2f6fed' :
  def.color}` — the ternary is replaced by `getPieceColor(piece)` (always the real
  color), and the `Outlines` child provides the "this is selected" signal instead.

- [ ] **Step 2: Typecheck and lint**

  Run: `pnpm typecheck && pnpm lint`
  Expected: both clean, no errors.

- [ ] **Step 3: Run the full test suite to confirm nothing else broke**

  Run: `pnpm test`
  Expected: PASS, same count as before plus Tasks 1-2's new tests.

- [ ] **Step 4: Commit**

  ```bash
  git add src/scene/Piece.tsx
  git commit -m "feat: render resolved piece color and outline selected pieces"
  ```

---

### Task 4: `ColorSwatchPicker` UI component

**Files:**
- Create: `src/ui/ColorSwatchPicker/ColorSwatchPicker.tsx`
- Create: `src/ui/ColorSwatchPicker/index.ts`
- Test: `src/ui/ColorSwatchPicker/ColorSwatchPicker.test.tsx`

**Interfaces:**
- Consumes: `selectedIds`, `pieces`, `setPieceColor` from `useSceneStore` (Tasks 1-2).
  `PIECE_DEFS` from `src/lib/pieces`.
- Produces: `ColorSwatchPicker` component, exported from `src/ui/ColorSwatchPicker`
  (barrel) — consumed by Task 5 (`App.tsx`).

- [ ] **Step 1: Write the failing component tests**

  Create `src/ui/ColorSwatchPicker/ColorSwatchPicker.test.tsx`:

  ```tsx
  import { beforeEach, describe, expect, it } from 'vitest';
  import { render, screen, fireEvent } from '@testing-library/react';
  import { ColorSwatchPicker } from './ColorSwatchPicker';
  import { useSceneStore, INITIAL_PIECES } from '../../store/sceneStore';

  beforeEach(() => {
    useSceneStore.setState({ pieces: INITIAL_PIECES, selectedIds: [] });
  });

  describe('ColorSwatchPicker', () => {
    it('renders nothing when no piece is selected', () => {
      render(<ColorSwatchPicker />);
      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });

    it('renders nothing when two pieces are selected', () => {
      useSceneStore.setState({ selectedIds: ['pallet-1', 'shelf-1'] });
      render(<ColorSwatchPicker />);
      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });

    it('renders a Default swatch plus 6 color swatches when one piece is selected', () => {
      useSceneStore.setState({ selectedIds: ['crate-1'] });
      render(<ColorSwatchPicker />);
      expect(screen.getAllByRole('button')).toHaveLength(7);
      expect(screen.getByRole('button', { name: /default/i })).toBeInTheDocument();
    });

    it('sets the piece color when a swatch is clicked', () => {
      useSceneStore.setState({ selectedIds: ['crate-1'] });
      render(<ColorSwatchPicker />);
      fireEvent.click(screen.getByRole('button', { name: /sage/i }));
      const crate = useSceneStore.getState().pieces.find((p) => p.id === 'crate-1');
      expect(crate?.colorOverride).toBe('#5f9e6f');
    });

    it('clears the override when Default is clicked', () => {
      useSceneStore.setState({
        selectedIds: ['crate-1'],
        pieces: INITIAL_PIECES.map((p) =>
          p.id === 'crate-1' ? { ...p, colorOverride: '#5f9e6f' } : p,
        ),
      });
      render(<ColorSwatchPicker />);
      fireEvent.click(screen.getByRole('button', { name: /default/i }));
      const crate = useSceneStore.getState().pieces.find((p) => p.id === 'crate-1');
      expect(crate?.colorOverride).toBeUndefined();
    });
  });
  ```

- [ ] **Step 2: Run tests to verify they fail**

  Run: `pnpm test -- ColorSwatchPicker`
  Expected: FAIL — `./ColorSwatchPicker` module not found.

- [ ] **Step 3: Implement `ColorSwatchPicker`**

  Create `src/ui/ColorSwatchPicker/ColorSwatchPicker.tsx`:

  ```tsx
  import { useSceneStore } from '../../store/sceneStore';
  import { PIECE_DEFS } from '../../lib/pieces';

  const SWATCHES: { label: string; color: string }[] = [
    { label: 'Terracotta', color: '#c65b4a' },
    { label: 'Sage', color: '#5f9e6f' },
    { label: 'Violet', color: '#8a6bb0' },
    { label: 'Teal', color: '#4a9a95' },
    { label: 'Mustard', color: '#d1a940' },
    { label: 'Rose', color: '#c76b93' },
  ];

  export function ColorSwatchPicker() {
    const selectedIds = useSceneStore((s) => s.selectedIds);
    const pieces = useSceneStore((s) => s.pieces);
    const setPieceColor = useSceneStore((s) => s.setPieceColor);

    if (selectedIds.length !== 1) return null;

    const piece = pieces.find((p) => p.id === selectedIds[0]);
    if (!piece) return null;

    const isDefaultActive = piece.colorOverride == null;
    const defaultColor = PIECE_DEFS[piece.type].color;

    return (
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          aria-label="Default"
          onClick={() => setPieceColor(piece.id, null)}
          className={`h-6 w-6 cursor-pointer rounded-full border-2 ${isDefaultActive ? 'border-accent' : 'border-transparent'}`}
          style={{ backgroundColor: defaultColor }}
        />
        {SWATCHES.map((swatch) => (
          <button
            key={swatch.color}
            type="button"
            aria-label={swatch.label}
            onClick={() => setPieceColor(piece.id, swatch.color)}
            className={`h-6 w-6 cursor-pointer rounded-full border-2 ${piece.colorOverride === swatch.color ? 'border-accent' : 'border-transparent'}`}
            style={{ backgroundColor: swatch.color }}
          />
        ))}
      </div>
    );
  }
  ```

  Create `src/ui/ColorSwatchPicker/index.ts`:

  ```ts
  export * from './ColorSwatchPicker';
  ```

- [ ] **Step 4: Run tests to verify they pass**

  Run: `pnpm test -- ColorSwatchPicker`
  Expected: PASS, all 5 tests.

- [ ] **Step 5: Commit**

  ```bash
  git add src/ui/ColorSwatchPicker
  git commit -m "feat: add ColorSwatchPicker component"
  ```

---

### Task 5: Wire `ColorSwatchPicker` into `App.tsx`, then manual verification

**Files:**
- Modify: `src/App.tsx`

**Interfaces:**
- Consumes: `ColorSwatchPicker` from `src/ui/ColorSwatchPicker` (Task 4).
- Produces: nothing — final integration point.

- [ ] **Step 1: Add the import and render it next to `RotateButton`**

  In `src/App.tsx`, add the import next to the other `ui/` imports (after
  `import { RotateButton } from './ui/RotateButton';`):

  ```tsx
  import { ColorSwatchPicker } from './ui/ColorSwatchPicker';
  ```

  Update the panel JSX so `ColorSwatchPicker` renders right after `RotateButton` (both
  are piece-specific controls, grouped together):

  ```tsx
  panel={
    <div className="flex flex-col gap-3">
      <SaveStatus />
      <ViewToggle />
      <Legend />
      <MeasurementPanel />
      <RotateButton />
      <ColorSwatchPicker />
    </div>
  }
  ```

- [ ] **Step 2: Typecheck, lint, and run the full test suite**

  Run: `pnpm typecheck && pnpm lint && pnpm test`
  Expected: all clean/PASS — no `App.tsx` test file exists (composition-only, covered by
  manual verification below).

- [ ] **Step 3: Commit**

  ```bash
  git add src/App.tsx
  git commit -m "feat: wire ColorSwatchPicker into the app panel"
  ```

- [ ] **Step 4: Start the dev server for manual verification**

  Run: `pnpm dev`

- [ ] **Step 5: Verify selection highlight no longer hides piece color**

  Select any piece. Confirm it shows an outline around it (not a full blue recolor) and
  its real color (default, at this point) stays visible.

- [ ] **Step 6: Verify picking a swatch gives live visual feedback while selected**

  With a piece still selected, click a color swatch (e.g. "Sage"). Confirm the piece's
  actual rendered color changes immediately while it remains selected/outlined — this is
  the core UX problem this plan's Task 3 change was meant to fix.

- [ ] **Step 7: Verify the active swatch is indicated**

  Confirm the swatch matching the piece's current color shows the active-state ring
  (`border-accent`), and no other swatch does.

- [ ] **Step 8: Verify "Default" reverts the color**

  Click "Default". Confirm the piece's color reverts to its type's default color, and the
  "Default" swatch now shows as active.

- [ ] **Step 9: Verify a custom color persists across reload**

  Set a piece to a custom color, reload the page. Confirm the piece still shows the
  custom color (not the type default) after reload.

- [ ] **Step 10: Verify colors are per-instance, not per-type**

  Set one piece's color to a custom swatch. Confirm other pieces of the same type (if
  any share a type in the initial scene) are unaffected, and confirm the `Legend`'s
  swatch for that type still shows the original default color, unchanged.

- [ ] **Step 11: Final full-suite check**

  Run: `pnpm lint && pnpm typecheck && pnpm test && pnpm build`
  Expected: all clean — the same gate the project's CI workflow runs.

- [ ] **Step 12: Report readiness for review**

  Per this project's git workflow, work stays on the `feat/per-piece-color-swap` branch
  after this task — report what was verified and wait for the user's go-ahead before
  `git push` / opening a PR against `dev`.
