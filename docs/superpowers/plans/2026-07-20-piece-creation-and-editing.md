# Piece Creation and Editing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let a user create new box-shaped pieces at runtime with custom width/depth/
name/color, and edit those same attributes on any existing piece (including the 4
original fixed types), per
`docs/superpowers/specs/2026-07-20-piece-creation-and-editing-design.md`.

**Architecture:** Generalizes the existing `colorOverride` pattern to width, depth, and
label (`widthOverride`/`depthOverride`/`labelOverride` on `PieceInstance`), uniformly for
every piece. A new pure `lib/placement.ts` finds the first free grid spot for a given
footprint (reused by both creating and repositioning). Two new store actions,
`addPiece`/`updatePiece`, both return a `PlacementResult` status (`'created' | 'updated' |
'conflict' | 'too-large' | 'no-space'`) rather than a boolean, since there's more than one
failure mode the UI needs to react to differently. A new `PieceForm` component (two
modes: `'add'` / `'edit'`) replaces the standalone `ColorSwatchPicker`, and a new
`DeleteButton` rounds out the piece-management controls.

**Tech Stack:** React, TypeScript, Zustand, Vitest, React Testing Library, pnpm.

## Global Constraints

- Scoped to **box-shaped** pieces only — no non-rectangular shapes, no performance work
  for large piece counts (both explicitly out of scope, per the spec).
- Board is `BOARD_WIDTH = 10`, `BOARD_DEPTH = 8` (from `lib/grid.ts`, unchanged).
- The 6 curated swatch colors and their labels are exact and must not change: Terracotta
  `#c65b4a`, Sage `#5f9e6f`, Violet `#8a6bb0`, Teal `#4a9a95`, Mustard `#d1a940`, Rose
  `#c76b93`.
- `updatePiece` must work on **any** existing piece, including the 4 fixed types
  (`pallet`/`shelf`/`crate`/`workstation`), not just `'custom'`-type pieces.
- `getBaseFootprint`/overrides represent **rotation-0** dimensions — `getFootprint`
  applies the existing rotation-90 swap on top of the resolved (override-or-default)
  values, never the other way around.
- Run `pnpm lint && pnpm typecheck && pnpm test` before every commit in this plan; all
  three must pass clean.
- `scene/` (R3F/WebGL components) is not unit tested — verified manually. `lib/`,
  `store/`, and `ui/` are unit/component tested with Vitest / React Testing Library.

---

### Task 1: Generalized overrides in `lib/pieces.ts` + label consumer in `scene/Piece.tsx`

**Files:**
- Modify: `src/lib/pieces.ts`
- Modify: `src/lib/pieces.test.ts`
- Modify: `src/scene/Piece.tsx`

**Interfaces:**
- Consumes: nothing new.
- Produces: `PieceType` including `'custom'`; `PieceInstance.widthOverride?: number`,
  `depthOverride?: number`, `labelOverride?: string`; `getBaseFootprint(instance):
  {width, depth}`; `getPieceLabel(instance): string`. `getFootprint`'s exported signature
  is unchanged but is now implemented in terms of `getBaseFootprint`. Consumed by Task 2
  (`lib/placement.ts`), Tasks 3-4 (store actions), and Task 6 (`PieceForm`).

- [ ] **Step 1: Write the failing tests**

  In `src/lib/pieces.test.ts`, update the import (line 2) to add the two new exports:

  ```ts
  import { PIECE_DEFS, getFootprint, getPieceColor, getBaseFootprint, getPieceLabel } from './pieces';
  ```

  Add these new `describe` blocks after the existing `describe('getPieceColor', ...)`
  block:

  ```ts
  describe('getBaseFootprint', () => {
    it('returns the type default when there is no override', () => {
      expect(getBaseFootprint({ type: 'shelf' })).toEqual({ width: 2, depth: 1 });
    });

    it('returns overridden width/depth independently', () => {
      expect(getBaseFootprint({ type: 'shelf', widthOverride: 5 })).toEqual({ width: 5, depth: 1 });
      expect(getBaseFootprint({ type: 'shelf', depthOverride: 3 })).toEqual({ width: 2, depth: 3 });
      expect(getBaseFootprint({ type: 'shelf', widthOverride: 5, depthOverride: 3 })).toEqual({
        width: 5,
        depth: 3,
      });
    });
  });

  describe('getFootprint (with overrides)', () => {
    it('applies the rotation swap on top of resolved overrides', () => {
      expect(getFootprint({ type: 'shelf', rotation: 90, widthOverride: 5, depthOverride: 3 })).toEqual({
        width: 3,
        depth: 5,
      });
    });
  });

  describe('getPieceLabel', () => {
    it('returns the type default when there is no override', () => {
      expect(getPieceLabel({ type: 'crate' })).toBe(PIECE_DEFS.crate.label);
    });

    it('returns the override when one is set', () => {
      expect(getPieceLabel({ type: 'crate', labelOverride: 'My Crate' })).toBe('My Crate');
    });
  });
  ```

- [ ] **Step 2: Run tests to verify they fail**

  Run: `pnpm test -- pieces.test`
  Expected: FAIL — `getBaseFootprint`/`getPieceLabel` are not exported.

- [ ] **Step 3: Implement the data model changes**

  Full new content for `src/lib/pieces.ts`:

  ```ts
  export type PieceType = 'pallet' | 'shelf' | 'crate' | 'workstation' | 'custom';

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
    custom: { type: 'custom', label: 'Custom', width: 1, depth: 1, color: '#c65b4a' },
  };

  export interface PieceInstance {
    id: string;
    type: PieceType;
    gridX: number;
    gridY: number;
    rotation: 0 | 90;
    colorOverride?: string;
    widthOverride?: number;
    depthOverride?: number;
    labelOverride?: string;
  }

  export function getBaseFootprint(
    instance: Pick<PieceInstance, 'type' | 'widthOverride' | 'depthOverride'>,
  ): { width: number; depth: number } {
    const def = PIECE_DEFS[instance.type];
    return {
      width: instance.widthOverride ?? def.width,
      depth: instance.depthOverride ?? def.depth,
    };
  }

  export function getFootprint(
    instance: Pick<PieceInstance, 'type' | 'rotation' | 'widthOverride' | 'depthOverride'>,
  ): { width: number; depth: number } {
    const { width, depth } = getBaseFootprint(instance);
    return instance.rotation === 90 ? { width: depth, depth: width } : { width, depth };
  }

  export function getPieceColor(instance: Pick<PieceInstance, 'type' | 'colorOverride'>): string {
    return instance.colorOverride ?? PIECE_DEFS[instance.type].color;
  }

  export function getPieceLabel(instance: Pick<PieceInstance, 'type' | 'labelOverride'>): string {
    return instance.labelOverride ?? PIECE_DEFS[instance.type].label;
  }
  ```

- [ ] **Step 4: Update the `Piece.tsx` label consumer**

  `scene/` has no unit tests (per Global Constraints); this is a small, direct edit,
  verified manually in Task 8. In `src/scene/Piece.tsx`:

  Change the import (currently line 3) from:

  ```tsx
  import { PIECE_DEFS, getFootprint, getPieceColor, type PieceInstance } from '../lib/pieces';
  ```

  to:

  ```tsx
  import { getFootprint, getPieceColor, getPieceLabel, type PieceInstance } from '../lib/pieces';
  ```

  Remove the now-unused `const def = PIECE_DEFS[piece.type];` line (currently line 14).

  Change the label render (currently `{def.label}`, inside the `Html` block) to:

  ```tsx
  {getPieceLabel(piece)}
  ```

- [ ] **Step 5: Run tests to verify they pass**

  Run: `pnpm test -- pieces.test`
  Expected: PASS, all tests including the new ones.

- [ ] **Step 6: Typecheck and lint (covers the `Piece.tsx` edit too)**

  Run: `pnpm typecheck && pnpm lint`
  Expected: both clean — confirms `PIECE_DEFS` is no longer an unused import in
  `Piece.tsx` and `getPieceLabel` is used correctly.

- [ ] **Step 7: Commit**

  ```bash
  git add src/lib/pieces.ts src/lib/pieces.test.ts src/scene/Piece.tsx
  git commit -m "feat: generalize width/depth/label overrides on PieceInstance"
  ```

---

### Task 2: `findFreeSpot` in `lib/placement.ts`

**Files:**
- Create: `src/lib/placement.ts`
- Test: `src/lib/placement.test.ts`

**Interfaces:**
- Consumes: `hasCollision` from `src/lib/collision.ts` (existing), `BOARD_WIDTH`/
  `BOARD_DEPTH` from `src/lib/grid.ts` (existing), `PieceInstance` from `src/lib/pieces`
  (Task 1).
- Produces: `findFreeSpot(width: number, depth: number, pieces: PieceInstance[],
  excludeId?: string): { gridX: number; gridY: number } | null` — consumed by Tasks 3-4
  (store actions).

- [ ] **Step 1: Write the failing tests**

  Create `src/lib/placement.test.ts`:

  ```ts
  import { describe, expect, it } from 'vitest';
  import { findFreeSpot } from './placement';
  import type { PieceInstance } from './pieces';

  const EMPTY: PieceInstance[] = [];

  describe('findFreeSpot', () => {
    it('returns the top-left origin when the board is empty', () => {
      expect(findFreeSpot(2, 2, EMPTY)).toEqual({ gridX: 0, gridY: 0 });
    });

    it('returns null when width exceeds the board', () => {
      expect(findFreeSpot(11, 1, EMPTY)).toBeNull();
    });

    it('returns null when depth exceeds the board', () => {
      expect(findFreeSpot(1, 9, EMPTY)).toBeNull();
    });

    it('skips occupied cells and finds the next free spot', () => {
      const occupied: PieceInstance[] = [{ id: 'a', type: 'pallet', gridX: 0, gridY: 0, rotation: 0 }];
      expect(findFreeSpot(1, 1, occupied)).toEqual({ gridX: 1, gridY: 0 });
    });

    it('returns null when the board is completely full for that size', () => {
      const occupied: PieceInstance[] = [
        { id: 'a', type: 'custom', gridX: 0, gridY: 0, rotation: 0, widthOverride: 10, depthOverride: 8 },
      ];
      expect(findFreeSpot(1, 1, occupied)).toBeNull();
    });

    it('excludes the given id from collision, so a piece can find a spot around itself', () => {
      const occupied: PieceInstance[] = [{ id: 'a', type: 'pallet', gridX: 0, gridY: 0, rotation: 0 }];
      expect(findFreeSpot(1, 1, occupied, 'a')).toEqual({ gridX: 0, gridY: 0 });
    });
  });
  ```

- [ ] **Step 2: Run tests to verify they fail**

  Run: `pnpm test -- placement.test`
  Expected: FAIL — `./placement` module not found.

- [ ] **Step 3: Implement `findFreeSpot`**

  Create `src/lib/placement.ts`:

  ```ts
  import { BOARD_WIDTH, BOARD_DEPTH } from './grid';
  import { hasCollision } from './collision';
  import type { PieceInstance } from './pieces';

  export function findFreeSpot(
    width: number,
    depth: number,
    pieces: PieceInstance[],
    excludeId?: string,
  ): { gridX: number; gridY: number } | null {
    if (width > BOARD_WIDTH || depth > BOARD_DEPTH) return null;

    for (let gridY = 0; gridY <= BOARD_DEPTH - depth; gridY++) {
      for (let gridX = 0; gridX <= BOARD_WIDTH - width; gridX++) {
        const candidate: PieceInstance = {
          id: excludeId ?? '__placement-probe__',
          type: 'custom',
          gridX,
          gridY,
          rotation: 0,
          widthOverride: width,
          depthOverride: depth,
        };
        if (!hasCollision(candidate, pieces)) {
          return { gridX, gridY };
        }
      }
    }
    return null;
  }
  ```

  Note: `hasCollision` internally filters out any piece whose `id` matches the
  candidate's `id` (see `collision.ts`) — passing `excludeId` as the probe's own `id`
  is what makes a piece "invisible" to its own collision check when repositioning it.

- [ ] **Step 4: Run tests to verify they pass**

  Run: `pnpm test -- placement.test`
  Expected: PASS, all 5 tests.

- [ ] **Step 5: Commit**

  ```bash
  git add src/lib/placement.ts src/lib/placement.test.ts
  git commit -m "feat: add findFreeSpot grid placement helper"
  ```

---

### Task 3: `addPiece` store action

**Files:**
- Modify: `src/store/sceneStore.ts`
- Modify: `src/store/sceneStore.test.ts`

**Interfaces:**
- Consumes: `findFreeSpot` (Task 2), `PIECE_DEFS`/`PieceInstance` (Task 1),
  `BOARD_WIDTH`/`BOARD_DEPTH` from `lib/grid`.
- Produces: `export type PlacementResult = 'created' | 'updated' | 'conflict' |
  'too-large' | 'no-space';` and `addPiece(input: {width, depth, label, color}):
  PlacementResult` on the store — consumed by Task 4 (shares the type) and Task 6
  (`PieceForm`).

- [ ] **Step 1: Write the failing tests**

  In `src/store/sceneStore.test.ts`, add this `describe` block after the existing
  `describe('saveStatus', ...)` block (end of file):

  ```ts
  describe('addPiece', () => {
    it('creates a new custom piece in the first free spot and returns "created"', () => {
      const result = useSceneStore.getState().addPiece({ width: 1, depth: 1, label: 'Widget', color: '#c65b4a' });
      expect(result).toBe('created');
      const pieces = useSceneStore.getState().pieces;
      expect(pieces).toHaveLength(INITIAL_PIECES.length + 1);
      const created = pieces[pieces.length - 1];
      expect(created.type).toBe('custom');
      expect(created.widthOverride).toBe(1);
      expect(created.depthOverride).toBe(1);
      expect(created.labelOverride).toBe('Widget');
      expect(created.colorOverride).toBe('#c65b4a');
    });

    it('returns "too-large" without mutating pieces when width exceeds the board', () => {
      const before = useSceneStore.getState().pieces;
      const result = useSceneStore.getState().addPiece({ width: 11, depth: 1, label: 'Too Big', color: '#c65b4a' });
      expect(result).toBe('too-large');
      expect(useSceneStore.getState().pieces).toBe(before);
    });

    it('returns "no-space" without mutating pieces when the board has no free area of that size', () => {
      useSceneStore.setState({
        pieces: [
          { id: 'filler', type: 'custom', gridX: 0, gridY: 0, rotation: 0, widthOverride: 10, depthOverride: 8 },
        ],
      });
      const before = useSceneStore.getState().pieces;
      const result = useSceneStore.getState().addPiece({ width: 1, depth: 1, label: 'No Room', color: '#c65b4a' });
      expect(result).toBe('no-space');
      expect(useSceneStore.getState().pieces).toBe(before);
    });
  });
  ```

- [ ] **Step 2: Run tests to verify they fail**

  Run: `pnpm test -- sceneStore`
  Expected: FAIL — `addPiece` is not a function.

- [ ] **Step 3: Implement `addPiece`**

  In `src/store/sceneStore.ts`, update the import on line 2 to add `getFootprint` stays,
  and add a new import line right after it for the placement helper and grid constants:

  ```ts
  import { getFootprint, type PieceInstance } from '../lib/pieces';
  import { hasCollision } from '../lib/collision';
  import { worldToGrid, BOARD_WIDTH, BOARD_DEPTH } from '../lib/grid';
  import { findFreeSpot } from '../lib/placement';
  import { ensureSession, saveScene as persistSave, loadScene as persistLoad } from '../persistence';
  ```

  Add the exported type right after `export type SaveStatus = ...;`:

  ```ts
  export type PlacementResult = 'created' | 'updated' | 'conflict' | 'too-large' | 'no-space';
  ```

  Add to the `SceneState` interface, right after `setPieceColor: (id: string, color:
  string | null) => void;`:

  ```ts
  addPiece: (input: { width: number; depth: number; label: string; color: string }) => PlacementResult;
  ```

  Add the action in the store body, right after `setPieceColor` (before `setViewMode`):

  ```ts
  addPiece: (input) => {
    const { width, depth, label, color } = input;
    if (width > BOARD_WIDTH || depth > BOARD_DEPTH) return 'too-large';
    const { pieces } = get();
    const spot = findFreeSpot(width, depth, pieces);
    if (!spot) return 'no-space';
    const newPiece: PieceInstance = {
      id: crypto.randomUUID(),
      type: 'custom',
      gridX: spot.gridX,
      gridY: spot.gridY,
      rotation: 0,
      widthOverride: width,
      depthOverride: depth,
      labelOverride: label,
      colorOverride: color,
    };
    set({ pieces: [...pieces, newPiece] });
    return 'created';
  },
  ```

- [ ] **Step 4: Run tests to verify they pass**

  Run: `pnpm test -- sceneStore`
  Expected: PASS, all tests including the three new ones.

- [ ] **Step 5: Commit**

  ```bash
  git add src/store/sceneStore.ts src/store/sceneStore.test.ts
  git commit -m "feat: add addPiece store action"
  ```

---

### Task 4: `updatePiece` and `deletePiece` store actions

**Files:**
- Modify: `src/store/sceneStore.ts`
- Modify: `src/store/sceneStore.test.ts`

**Interfaces:**
- Consumes: `findFreeSpot` (Task 2), `getFootprint` (Task 1), `PlacementResult` (Task 3,
  same file).
- Produces: `updatePiece(id, input, options?: {reposition?: boolean}):
  PlacementResult` and `deletePiece(id: string): void` — consumed by Task 6
  (`PieceForm`) and Task 7 (`DeleteButton`).

- [ ] **Step 1: Write the failing tests**

  Add these `describe` blocks after the `describe('addPiece', ...)` block added in
  Task 3:

  ```ts
  describe('updatePiece', () => {
    it('updates a fixed-type piece in place when the new size still fits, returning "updated"', () => {
      const result = useSceneStore
        .getState()
        .updatePiece('pallet-1', { width: 1, depth: 1, label: 'My Pallet', color: '#5f9e6f' });
      expect(result).toBe('updated');
      const pallet = useSceneStore.getState().pieces.find((p) => p.id === 'pallet-1');
      expect(pallet?.widthOverride).toBe(1);
      expect(pallet?.labelOverride).toBe('My Pallet');
      expect(pallet?.colorOverride).toBe('#5f9e6f');
      expect(pallet?.gridX).toBe(0);
      expect(pallet?.gridY).toBe(0);
    });

    it('returns "conflict" without mutating when the new size would collide with another piece at the current position', () => {
      const before = useSceneStore.getState().pieces;
      const result = useSceneStore
        .getState()
        .updatePiece('pallet-1', { width: 4, depth: 1, label: 'Pallet', color: '#c8a165' });
      expect(result).toBe('conflict');
      expect(useSceneStore.getState().pieces).toBe(before);
    });

    it('relocates to the first free spot and returns "updated" when reposition is requested and the current position no longer fits', () => {
      const result = useSceneStore
        .getState()
        .updatePiece('pallet-1', { width: 4, depth: 1, label: 'Pallet', color: '#c8a165' }, { reposition: true });
      expect(result).toBe('updated');
      const pallet = useSceneStore.getState().pieces.find((p) => p.id === 'pallet-1');
      expect(pallet?.gridX).toBe(0);
      expect(pallet?.gridY).toBe(1);
      expect(pallet?.widthOverride).toBe(4);
    });

    it('returns "no-space" without mutating when reposition is requested but nothing fits anywhere', () => {
      useSceneStore.setState({
        pieces: [
          { id: 'a', type: 'pallet', gridX: 0, gridY: 0, rotation: 0 },
          { id: 'filler', type: 'custom', gridX: 1, gridY: 0, rotation: 0, widthOverride: 9, depthOverride: 8 },
        ],
      });
      const before = useSceneStore.getState().pieces;
      const result = useSceneStore
        .getState()
        .updatePiece('a', { width: 2, depth: 1, label: 'A', color: '#c65b4a' }, { reposition: true });
      expect(result).toBe('no-space');
      expect(useSceneStore.getState().pieces).toBe(before);
    });

    it('returns "too-large" without mutating regardless of reposition, when width/depth exceeds the board outright', () => {
      const before = useSceneStore.getState().pieces;
      const result = useSceneStore
        .getState()
        .updatePiece('pallet-1', { width: 11, depth: 1, label: 'Pallet', color: '#c8a165' }, { reposition: true });
      expect(result).toBe('too-large');
      expect(useSceneStore.getState().pieces).toBe(before);
    });
  });

  describe('deletePiece', () => {
    it('removes the target piece only', () => {
      useSceneStore.getState().deletePiece('shelf-1');
      const pieces = useSceneStore.getState().pieces;
      expect(pieces.find((p) => p.id === 'shelf-1')).toBeUndefined();
      expect(pieces).toHaveLength(INITIAL_PIECES.length - 1);
    });

    it('clears selectedIds when the deleted piece was selected', () => {
      useSceneStore.setState({ selectedIds: ['shelf-1'] });
      useSceneStore.getState().deletePiece('shelf-1');
      expect(useSceneStore.getState().selectedIds).toEqual([]);
    });

    it('leaves selection untouched when the deleted piece was not selected', () => {
      useSceneStore.setState({ selectedIds: ['crate-1'] });
      useSceneStore.getState().deletePiece('shelf-1');
      expect(useSceneStore.getState().selectedIds).toEqual(['crate-1']);
    });
  });
  ```

  Note: the "relocates" test relies on the exact `INITIAL_PIECES` layout (pallet-1 at
  (0,0) 1×1, shelf-1 at (3,0) 2×1, crate-1 at (6,0) 1×1, workstation-1 at (0,3) 2×2) —
  growing pallet-1 to width 4 at row `gridY=0` collides with shelf-1/crate-1 everywhere
  across that row, so the first free spot for a 4×1 footprint is `(0, 1)`, the first
  empty row.

- [ ] **Step 2: Run tests to verify they fail**

  Run: `pnpm test -- sceneStore`
  Expected: FAIL — `updatePiece`/`deletePiece` are not functions.

- [ ] **Step 3: Implement `updatePiece` and `deletePiece`**

  Add to the `SceneState` interface, right after the `addPiece` line added in Task 3:

  ```ts
  updatePiece: (
    id: string,
    input: { width: number; depth: number; label: string; color: string },
    options?: { reposition?: boolean },
  ) => PlacementResult;
  deletePiece: (id: string) => void;
  ```

  Add the actions in the store body, right after the `addPiece` action added in Task 3
  (before `setViewMode`):

  ```ts
  updatePiece: (id, input, options) => {
    const { width, depth, label, color } = input;
    if (width > BOARD_WIDTH || depth > BOARD_DEPTH) return 'too-large';
    const { pieces } = get();
    const piece = pieces.find((p) => p.id === id);
    if (!piece) return 'conflict';

    const candidateAtCurrent: PieceInstance = {
      ...piece,
      widthOverride: width,
      depthOverride: depth,
      labelOverride: label,
      colorOverride: color,
    };
    const effective = getFootprint(candidateAtCurrent);
    const fitsAtCurrent =
      candidateAtCurrent.gridX + effective.width <= BOARD_WIDTH &&
      candidateAtCurrent.gridY + effective.depth <= BOARD_DEPTH &&
      !hasCollision(candidateAtCurrent, pieces);

    if (fitsAtCurrent) {
      set({ pieces: pieces.map((p) => (p.id === id ? candidateAtCurrent : p)) });
      return 'updated';
    }
    if (!options?.reposition) return 'conflict';

    const spot = findFreeSpot(effective.width, effective.depth, pieces, id);
    if (!spot) return 'no-space';
    const relocated: PieceInstance = { ...candidateAtCurrent, gridX: spot.gridX, gridY: spot.gridY };
    set({ pieces: pieces.map((p) => (p.id === id ? relocated : p)) });
    return 'updated';
  },

  deletePiece: (id) => {
    const { pieces, selectedIds } = get();
    set({
      pieces: pieces.filter((p) => p.id !== id),
      selectedIds: selectedIds.filter((sid) => sid !== id),
    });
  },
  ```

- [ ] **Step 4: Run tests to verify they pass**

  Run: `pnpm test -- sceneStore`
  Expected: PASS, all tests including the new `updatePiece`/`deletePiece` blocks.

- [ ] **Step 5: Commit**

  ```bash
  git add src/store/sceneStore.ts src/store/sceneStore.test.ts
  git commit -m "feat: add updatePiece and deletePiece store actions"
  ```

---

### Task 5: `SwatchRow` presentational component

**Files:**
- Create: `src/ui/SwatchRow/SwatchRow.tsx`
- Create: `src/ui/SwatchRow/index.ts`
- Test: `src/ui/SwatchRow/SwatchRow.test.tsx`

**Interfaces:**
- Consumes: nothing (fully generic, no store access).
- Produces: `SwatchRow({ swatches: {label: string; color: string}[]; value: string;
  onChange: (color: string) => void })` — consumed by Task 6 (`PieceForm`).

- [ ] **Step 1: Write the failing tests**

  Create `src/ui/SwatchRow/SwatchRow.test.tsx`:

  ```tsx
  import { describe, expect, it, vi } from 'vitest';
  import { render, screen, fireEvent } from '@testing-library/react';
  import { SwatchRow } from './SwatchRow';

  const SWATCHES = [
    { label: 'Terracotta', color: '#c65b4a' },
    { label: 'Sage', color: '#5f9e6f' },
  ];

  describe('SwatchRow', () => {
    it('renders one button per swatch', () => {
      render(<SwatchRow swatches={SWATCHES} value="#c65b4a" onChange={() => {}} />);
      expect(screen.getAllByRole('button')).toHaveLength(2);
    });

    it('highlights the swatch matching value', () => {
      render(<SwatchRow swatches={SWATCHES} value="#5f9e6f" onChange={() => {}} />);
      expect(screen.getByRole('button', { name: 'Sage' })).toHaveClass('border-accent');
      expect(screen.getByRole('button', { name: 'Terracotta' })).not.toHaveClass('border-accent');
    });

    it('calls onChange with the clicked swatch color', () => {
      const onChange = vi.fn();
      render(<SwatchRow swatches={SWATCHES} value="#c65b4a" onChange={onChange} />);
      fireEvent.click(screen.getByRole('button', { name: 'Sage' }));
      expect(onChange).toHaveBeenCalledWith('#5f9e6f');
    });
  });
  ```

- [ ] **Step 2: Run tests to verify they fail**

  Run: `pnpm test -- SwatchRow`
  Expected: FAIL — `./SwatchRow` module not found.

- [ ] **Step 3: Implement `SwatchRow`**

  Create `src/ui/SwatchRow/SwatchRow.tsx`:

  ```tsx
  interface Swatch {
    label: string;
    color: string;
  }

  interface SwatchRowProps {
    swatches: Swatch[];
    value: string;
    onChange: (color: string) => void;
  }

  export function SwatchRow({ swatches, value, onChange }: SwatchRowProps) {
    return (
      <div className="flex flex-wrap gap-2">
        {swatches.map((swatch) => (
          <button
            key={swatch.color}
            type="button"
            aria-label={swatch.label}
            onClick={() => onChange(swatch.color)}
            className={`h-6 w-6 cursor-pointer rounded-full border-2 ${value === swatch.color ? 'border-accent' : 'border-transparent'}`}
            style={{ backgroundColor: swatch.color }}
          />
        ))}
      </div>
    );
  }
  ```

  Create `src/ui/SwatchRow/index.ts`:

  ```ts
  export * from './SwatchRow';
  ```

- [ ] **Step 4: Run tests to verify they pass**

  Run: `pnpm test -- SwatchRow`
  Expected: PASS, all 3 tests.

- [ ] **Step 5: Commit**

  ```bash
  git add src/ui/SwatchRow
  git commit -m "feat: extract SwatchRow presentational component"
  ```

---

### Task 6: `PieceForm` component (add + edit modes, conflict confirmation)

**Files:**
- Create: `src/ui/PieceForm/PieceForm.tsx`
- Create: `src/ui/PieceForm/index.ts`
- Test: `src/ui/PieceForm/PieceForm.test.tsx`

**Interfaces:**
- Consumes: `useSceneStore` (`selectedIds`, `pieces`, `addPiece`, `updatePiece` — Tasks
  1, 3, 4), `PIECE_DEFS`, `getBaseFootprint`, `getPieceColor`, `getPieceLabel` (Task 1),
  `SwatchRow` (Task 5), `BOARD_WIDTH`/`BOARD_DEPTH` from `lib/grid`, `PlacementResult`
  type (Task 3, from `store/sceneStore`).
- Produces: `PieceForm({ mode: 'add' | 'edit' })` — consumed by Task 8 (`App.tsx`).

- [ ] **Step 1: Write the failing tests**

  Create `src/ui/PieceForm/PieceForm.test.tsx`:

  ```tsx
  import { beforeEach, describe, expect, it } from 'vitest';
  import { render, screen, fireEvent } from '@testing-library/react';
  import { PieceForm } from './PieceForm';
  import { useSceneStore, INITIAL_PIECES } from '../../store/sceneStore';

  beforeEach(() => {
    useSceneStore.setState({ pieces: INITIAL_PIECES, selectedIds: [] });
  });

  describe('PieceForm add mode', () => {
    it('renders an "Add piece" trigger button, closed by default', () => {
      render(<PieceForm mode="add" />);
      expect(screen.getByRole('button', { name: 'Add piece' })).toBeInTheDocument();
      expect(screen.queryByText('Width')).not.toBeInTheDocument();
    });

    it('opens the form with default values when the trigger is clicked', () => {
      render(<PieceForm mode="add" />);
      fireEvent.click(screen.getByRole('button', { name: 'Add piece' }));
      expect(screen.getByText('Width')).toBeInTheDocument();
      expect(screen.getByRole('spinbutton', { name: 'Width' })).toHaveValue(1);
    });

    it('calls addPiece and closes the form on successful submit', () => {
      render(<PieceForm mode="add" />);
      fireEvent.click(screen.getByRole('button', { name: 'Add piece' }));
      fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Widget' } });
      fireEvent.click(screen.getByRole('button', { name: 'Add' }));
      expect(screen.queryByText('Width')).not.toBeInTheDocument();
      const pieces = useSceneStore.getState().pieces;
      expect(pieces[pieces.length - 1].labelOverride).toBe('Widget');
    });

    it('shows an inline error and keeps the form open when the piece is too large', () => {
      render(<PieceForm mode="add" />);
      fireEvent.click(screen.getByRole('button', { name: 'Add piece' }));
      fireEvent.change(screen.getByRole('spinbutton', { name: 'Width' }), { target: { value: 11 } });
      fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Widget' } });
      fireEvent.click(screen.getByRole('button', { name: 'Add' }));
      expect(screen.getByText(/larger than the board/i)).toBeInTheDocument();
      expect(screen.getByText('Width')).toBeInTheDocument();
    });
  });

  describe('PieceForm edit mode', () => {
    it('renders nothing when no piece is selected', () => {
      render(<PieceForm mode="edit" />);
      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });

    it('renders nothing when two pieces are selected', () => {
      useSceneStore.setState({ selectedIds: ['pallet-1', 'shelf-1'] });
      render(<PieceForm mode="edit" />);
      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });

    it('pre-fills the form from the selected piece', () => {
      useSceneStore.setState({ selectedIds: ['shelf-1'] });
      render(<PieceForm mode="edit" />);
      fireEvent.click(screen.getByRole('button', { name: 'Edit piece' }));
      expect(screen.getByRole('spinbutton', { name: 'Width' })).toHaveValue(2);
      expect(screen.getByLabelText('Name')).toHaveValue('Shelf');
    });

    it('calls updatePiece and closes the form on a successful save', () => {
      useSceneStore.setState({ selectedIds: ['crate-1'] });
      render(<PieceForm mode="edit" />);
      fireEvent.click(screen.getByRole('button', { name: 'Edit piece' }));
      fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'My Crate' } });
      fireEvent.click(screen.getByRole('button', { name: 'Save' }));
      expect(screen.queryByText('Width')).not.toBeInTheDocument();
      const crate = useSceneStore.getState().pieces.find((p) => p.id === 'crate-1');
      expect(crate?.labelOverride).toBe('My Crate');
    });

    it("shows a confirmation instead of closing when the new size conflicts, and repositions on Yes", () => {
      useSceneStore.setState({ selectedIds: ['pallet-1'] });
      render(<PieceForm mode="edit" />);
      fireEvent.click(screen.getByRole('button', { name: 'Edit piece' }));
      fireEvent.change(screen.getByRole('spinbutton', { name: 'Width' }), { target: { value: 4 } });
      fireEvent.click(screen.getByRole('button', { name: 'Save' }));
      expect(screen.getByText(/won't fit here/i)).toBeInTheDocument();
      fireEvent.click(screen.getByRole('button', { name: 'Yes' }));
      expect(screen.queryByText('Width')).not.toBeInTheDocument();
      const pallet = useSceneStore.getState().pieces.find((p) => p.id === 'pallet-1');
      expect(pallet?.widthOverride).toBe(4);
      expect(pallet?.gridY).toBe(1);
    });

    it('dismisses the confirmation without calling updatePiece again when No is clicked', () => {
      useSceneStore.setState({ selectedIds: ['pallet-1'] });
      render(<PieceForm mode="edit" />);
      fireEvent.click(screen.getByRole('button', { name: 'Edit piece' }));
      fireEvent.change(screen.getByRole('spinbutton', { name: 'Width' }), { target: { value: 4 } });
      fireEvent.click(screen.getByRole('button', { name: 'Save' }));
      expect(screen.getByText(/won't fit here/i)).toBeInTheDocument();
      fireEvent.click(screen.getByRole('button', { name: /let me adjust/i }));
      expect(screen.queryByText(/won't fit here/i)).not.toBeInTheDocument();
      expect(screen.getByText('Width')).toBeInTheDocument();
      const pallet = useSceneStore.getState().pieces.find((p) => p.id === 'pallet-1');
      expect(pallet?.widthOverride).toBeUndefined();
    });
  });
  ```

  Note: the "repositions on Yes" test relies on the same `INITIAL_PIECES` collision math
  as Task 4's `updatePiece` "relocates" test — growing pallet-1 to width 4 collides
  across row `gridY=0`, so it relocates to `(0, 1)`.

- [ ] **Step 2: Run tests to verify they fail**

  Run: `pnpm test -- PieceForm`
  Expected: FAIL — `./PieceForm` module not found.

- [ ] **Step 3: Implement `PieceForm`**

  Create `src/ui/PieceForm/PieceForm.tsx`:

  ```tsx
  import { useState } from 'react';
  import { useSceneStore, type PlacementResult } from '../../store/sceneStore';
  import { PIECE_DEFS, getBaseFootprint, getPieceColor, getPieceLabel } from '../../lib/pieces';
  import { BOARD_WIDTH, BOARD_DEPTH } from '../../lib/grid';
  import { SwatchRow } from '../SwatchRow';

  const CURATED_SWATCHES = [
    { label: 'Terracotta', color: '#c65b4a' },
    { label: 'Sage', color: '#5f9e6f' },
    { label: 'Violet', color: '#8a6bb0' },
    { label: 'Teal', color: '#4a9a95' },
    { label: 'Mustard', color: '#d1a940' },
    { label: 'Rose', color: '#c76b93' },
  ];

  interface PieceFormProps {
    mode: 'add' | 'edit';
  }

  export function PieceForm({ mode }: PieceFormProps) {
    const selectedIds = useSceneStore((s) => s.selectedIds);
    const pieces = useSceneStore((s) => s.pieces);
    const addPiece = useSceneStore((s) => s.addPiece);
    const updatePiece = useSceneStore((s) => s.updatePiece);

    const [isOpen, setIsOpen] = useState(false);
    const [width, setWidth] = useState(1);
    const [depth, setDepth] = useState(1);
    const [label, setLabel] = useState('');
    const [color, setColor] = useState(CURATED_SWATCHES[0].color);
    const [error, setError] = useState<string | null>(null);
    const [conflict, setConflict] = useState(false);

    const piece = mode === 'edit' ? pieces.find((p) => p.id === selectedIds[0]) : undefined;

    if (mode === 'edit' && (selectedIds.length !== 1 || !piece)) return null;

    function openForm() {
      if (mode === 'edit' && piece) {
        const base = getBaseFootprint(piece);
        setWidth(base.width);
        setDepth(base.depth);
        setLabel(getPieceLabel(piece));
        setColor(getPieceColor(piece));
      } else {
        setWidth(1);
        setDepth(1);
        setLabel('');
        setColor(CURATED_SWATCHES[0].color);
      }
      setError(null);
      setConflict(false);
      setIsOpen(true);
    }

    function closeForm() {
      setIsOpen(false);
      setError(null);
      setConflict(false);
    }

    function handleSubmit(reposition = false) {
      const input = { width, depth, label, color };
      const result: PlacementResult = mode === 'add' ? addPiece(input) : updatePiece(piece!.id, input, { reposition });

      if (result === 'created' || result === 'updated') {
        closeForm();
        return;
      }
      if (result === 'too-large') {
        setError('Piece is larger than the board.');
        setConflict(false);
        return;
      }
      if (result === 'no-space') {
        setError('No space available for this size anywhere on the board.');
        setConflict(false);
        return;
      }
      setError(null);
      setConflict(true);
    }

    const swatches =
      mode === 'edit' && piece
        ? [{ label: 'Default', color: PIECE_DEFS[piece.type].color }, ...CURATED_SWATCHES]
        : CURATED_SWATCHES;

    if (!isOpen) {
      return (
        <button
          type="button"
          onClick={openForm}
          className="cursor-pointer self-start rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-ink"
        >
          {mode === 'add' ? 'Add piece' : 'Edit piece'}
        </button>
      );
    }

    return (
      <div className="flex flex-col gap-2 rounded-md border border-ink/10 p-3">
        <label className="flex items-center justify-between gap-2 text-sm">
          Width
          <input
            type="number"
            min={1}
            max={BOARD_WIDTH}
            value={width}
            onChange={(e) => setWidth(Math.min(BOARD_WIDTH, Math.max(1, Number(e.target.value) || 1)))}
            className="w-16 rounded border border-ink/20 px-2 py-1"
          />
        </label>
        <label className="flex items-center justify-between gap-2 text-sm">
          Depth
          <input
            type="number"
            min={1}
            max={BOARD_DEPTH}
            value={depth}
            onChange={(e) => setDepth(Math.min(BOARD_DEPTH, Math.max(1, Number(e.target.value) || 1)))}
            className="w-16 rounded border border-ink/20 px-2 py-1"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Name
          <input
            type="text"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            className="rounded border border-ink/20 px-2 py-1"
          />
        </label>
        <SwatchRow swatches={swatches} value={color} onChange={setColor} />

        {error && <p className="text-sm text-red-600">{error}</p>}

        {conflict ? (
          <div className="flex flex-col gap-2 text-sm">
            <p>This size won&apos;t fit here. Move it to the nearest free spot?</p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => handleSubmit(true)}
                className="cursor-pointer rounded-md bg-accent px-3 py-1.5 text-sm font-medium text-accent-ink"
              >
                Yes
              </button>
              <button
                type="button"
                onClick={() => setConflict(false)}
                className="cursor-pointer rounded-md border border-ink/20 px-3 py-1.5 text-sm"
              >
                No, let me adjust
              </button>
            </div>
          </div>
        ) : (
          <div className="flex gap-2">
            <button
              type="button"
              disabled={label.trim() === ''}
              onClick={() => handleSubmit(false)}
              className="cursor-pointer rounded-md bg-accent px-3 py-1.5 text-sm font-medium text-accent-ink disabled:cursor-not-allowed disabled:opacity-50"
            >
              {mode === 'add' ? 'Add' : 'Save'}
            </button>
            <button
              type="button"
              onClick={closeForm}
              className="cursor-pointer rounded-md border border-ink/20 px-3 py-1.5 text-sm"
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    );
  }
  ```

  Create `src/ui/PieceForm/index.ts`:

  ```ts
  export * from './PieceForm';
  ```

- [ ] **Step 4: Run tests to verify they pass**

  Run: `pnpm test -- PieceForm`
  Expected: PASS, all 9 tests.

- [ ] **Step 5: Commit**

  ```bash
  git add src/ui/PieceForm
  git commit -m "feat: add PieceForm component with add/edit modes and conflict confirmation"
  ```

---

### Task 7: `DeleteButton` component

**Files:**
- Create: `src/ui/DeleteButton/DeleteButton.tsx`
- Create: `src/ui/DeleteButton/index.ts`
- Test: `src/ui/DeleteButton/DeleteButton.test.tsx`

**Interfaces:**
- Consumes: `selectedIds`, `deletePiece` from `useSceneStore` (Task 4).
- Produces: `DeleteButton` component, exported from `src/ui/DeleteButton` (barrel) —
  consumed by Task 8 (`App.tsx`).

- [ ] **Step 1: Write the failing tests**

  Create `src/ui/DeleteButton/DeleteButton.test.tsx`:

  ```tsx
  import { beforeEach, describe, expect, it } from 'vitest';
  import { render, screen, fireEvent } from '@testing-library/react';
  import { DeleteButton } from './DeleteButton';
  import { useSceneStore, INITIAL_PIECES } from '../../store/sceneStore';

  beforeEach(() => {
    useSceneStore.setState({ pieces: INITIAL_PIECES, selectedIds: [] });
  });

  describe('DeleteButton', () => {
    it('renders nothing when no piece is selected', () => {
      render(<DeleteButton />);
      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });

    it('renders nothing when two pieces are selected', () => {
      useSceneStore.setState({ selectedIds: ['pallet-1', 'shelf-1'] });
      render(<DeleteButton />);
      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });

    it('deletes the selected piece when clicked', () => {
      useSceneStore.setState({ selectedIds: ['crate-1'] });
      render(<DeleteButton />);
      fireEvent.click(screen.getByRole('button', { name: /delete/i }));
      expect(useSceneStore.getState().pieces.find((p) => p.id === 'crate-1')).toBeUndefined();
    });
  });
  ```

- [ ] **Step 2: Run tests to verify they fail**

  Run: `pnpm test -- DeleteButton`
  Expected: FAIL — `./DeleteButton` module not found.

- [ ] **Step 3: Implement `DeleteButton`**

  Create `src/ui/DeleteButton/DeleteButton.tsx`:

  ```tsx
  import { useSceneStore } from '../../store/sceneStore';

  export function DeleteButton() {
    const selectedIds = useSceneStore((s) => s.selectedIds);
    const deletePiece = useSceneStore((s) => s.deletePiece);

    if (selectedIds.length !== 1) return null;

    return (
      <button
        type="button"
        onClick={() => deletePiece(selectedIds[0])}
        className="cursor-pointer self-start rounded-md border border-ink/20 px-4 py-2 text-sm font-medium text-ink"
      >
        Delete piece
      </button>
    );
  }
  ```

  Create `src/ui/DeleteButton/index.ts`:

  ```ts
  export * from './DeleteButton';
  ```

- [ ] **Step 4: Run tests to verify they pass**

  Run: `pnpm test -- DeleteButton`
  Expected: PASS, all 3 tests.

- [ ] **Step 5: Commit**

  ```bash
  git add src/ui/DeleteButton
  git commit -m "feat: add DeleteButton component"
  ```

---

### Task 8: Remove `ColorSwatchPicker`, wire `PieceForm`/`DeleteButton` into `App.tsx`, manual verification

**Files:**
- Delete: `src/ui/ColorSwatchPicker/` (entire directory — `ColorSwatchPicker.tsx`,
  `index.ts`, `ColorSwatchPicker.test.tsx`)
- Modify: `src/App.tsx`

**Interfaces:**
- Consumes: `PieceForm` (Task 6), `DeleteButton` (Task 7).
- Produces: nothing — final integration point.

- [ ] **Step 1: Delete the superseded `ColorSwatchPicker`**

  ```bash
  git rm -r src/ui/ColorSwatchPicker
  ```

- [ ] **Step 2: Update `App.tsx`**

  Replace the `ColorSwatchPicker` import (currently
  `import { ColorSwatchPicker } from './ui/ColorSwatchPicker';`) with:

  ```tsx
  import { PieceForm } from './ui/PieceForm';
  import { DeleteButton } from './ui/DeleteButton';
  ```

  Update the panel JSX to:

  ```tsx
  panel={
    <div className="flex flex-col gap-3">
      <SaveStatus />
      <ViewToggle />
      <PieceForm mode="add" />
      <Legend />
      <MeasurementPanel />
      <RotateButton />
      <DeleteButton />
      <PieceForm mode="edit" />
    </div>
  }
  ```

- [ ] **Step 3: Typecheck, lint, and run the full test suite**

  Run: `pnpm typecheck && pnpm lint && pnpm test`
  Expected: all clean/PASS — no `App.tsx` test file exists (composition-only, covered by
  manual verification below); the `ColorSwatchPicker` deletion must not leave any
  dangling imports/references.

- [ ] **Step 4: Commit**

  ```bash
  git add src/App.tsx
  git commit -m "feat: wire PieceForm and DeleteButton into the app panel, remove ColorSwatchPicker"
  ```

- [ ] **Step 5: Start the dev server for manual verification**

  Run: `pnpm dev`

- [ ] **Step 6: Verify creating a new piece**

  Click "Add piece", fill in width/depth/name, pick a swatch, submit. Confirm a new box
  appears on the board with the chosen size/color, and it's immediately selectable/
  draggable/rotatable like any other piece.

- [ ] **Step 7: Verify editing a fixed-type piece**

  Select one of the 4 original pieces (e.g. the Shelf), click "Edit piece". Confirm the
  form pre-fills with its current width/depth/name/color (including a "Default" swatch
  option). Change its color and name, save. Confirm the change applies and the piece's
  label (when selected) now shows the new name.

- [ ] **Step 8: Verify the edit-conflict confirmation flow**

  Select a piece, open Edit, increase its width enough to collide with a neighbor at its
  current position, submit. Confirm the "won't fit here" prompt appears (not an
  immediate close or silent failure). Click "Yes" and confirm the piece relocates to a
  free spot with the new size. Repeat and click "No, let me adjust" instead — confirm the
  form stays open with the piece unchanged.

- [ ] **Step 9: Verify "too large" and "no space" inline errors**

  Try creating/editing a piece with width or depth larger than the board — confirm an
  inline error appears without closing the form. Fill the board with large pieces and
  try adding another that can't fit anywhere — confirm the "no space" error appears.

- [ ] **Step 10: Verify deletion**

  Select a piece, click "Delete piece". Confirm it's removed from the board and the
  piece-specific controls (Rotate/Edit/Delete) disappear since nothing is selected
  anymore.

- [ ] **Step 11: Verify persistence across reload**

  Create a custom piece and edit a fixed-type piece's dimensions/label/color. Reload the
  page. Confirm both changes survive (custom piece still present with its size/color/
  name; edited fixed piece still shows its overridden values).

- [ ] **Step 12: Verify the Legend is unaffected**

  Confirm the `Legend` still shows the 4 fixed types' original default colors, even
  though one of those types now has an edited instance on the board with a different
  color — consistent with the color-swap feature's precedent.

- [ ] **Step 13: Final full-suite check**

  Run: `pnpm lint && pnpm typecheck && pnpm test && pnpm build`
  Expected: all clean — the same gate the project's CI workflow runs.

- [ ] **Step 14: Report readiness for review**

  Per this project's git workflow, work stays on the `feat/piece-creation-and-editing`
  branch after this task — report what was verified and wait for the user's go-ahead
  before `git push` / opening a PR against `dev`.
