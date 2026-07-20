# Perspective Camera Toggle Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a toggle between the existing locked top-down orthographic camera and a
free-orbit perspective view, with a "Reset view" control, per
`docs/superpowers/specs/2026-07-20-perspective-camera-toggle-design.md`.

**Architecture:** `store/sceneStore.ts` already has `viewMode: 'top' | 'perspective'` and
`setViewMode`, unused. Add `viewResetToken` + `resetView()` to the store. Branch
`scene/Scene.tsx` on `viewMode` to swap between the existing `OrthographicCamera` +
`MapControls` (top) and a `PerspectiveCamera` + `OrbitControls` (perspective), the latter
wrapped in a `<group key={viewResetToken}>` so both "enter perspective" and "click reset"
force the same clean remount. A new `ViewToggle` UI component (mirroring the existing
`RotateButton` component) exposes both controls, wired into `App.tsx`'s panel.

**Tech Stack:** React, TypeScript, React Three Fiber, @react-three/drei (`PerspectiveCamera`,
`OrbitControls`), Zustand, Vitest, React Testing Library, pnpm.

## Global Constraints

- `scene/` (R3F/WebGL components) is not unit tested — verified manually in the running
  app, per this project's established testing strategy (`ARCHITECTURE.md`). `store/` and
  `ui/` are unit/component tested with Vitest / React Testing Library.
- Piece dragging (`DragPlane`, `Pieces`) must keep working unchanged in perspective mode
  — do not modify those files.
- Do not touch the existing top-down camera's behavior, position, or props.
- Board center is `x = (BOARD_WIDTH * CELL_SIZE_METERS) / 2 = 6`,
  `z = (BOARD_DEPTH * CELL_SIZE_METERS) / 2 = 4.8` (from `lib/grid.ts`'s
  `BOARD_WIDTH=10`, `BOARD_DEPTH=8`, `CELL_SIZE_METERS=1.2`) — this is the existing
  `OrthographicCamera`'s look-at point too (`position={[6, 20, 4.8]}`), so the perspective
  camera's `OrbitControls` target must match it.
- Run `pnpm lint && pnpm typecheck && pnpm test` before every commit in this plan; all
  three must pass clean.

---

### Task 1: `viewResetToken` / `resetView` in the scene store

**Files:**
- Modify: `src/store/sceneStore.ts`
- Test: `src/store/sceneStore.test.ts`

**Interfaces:**
- Consumes: nothing new.
- Produces: `viewResetToken: number` (starts `0`) and `resetView: () => void` (increments
  it) on `SceneState` — consumed by Task 2 (`Scene.tsx`, as a React `key`) and Task 3
  (`ViewToggle`, calling `resetView()`).

- [ ] **Step 1: Write the failing tests**

  In `src/store/sceneStore.test.ts`, update `resetStore()` (around line 17-25) to also
  reset the new field, and add two new `describe` blocks. Full updated function and new
  blocks:

  ```ts
  function resetStore() {
    useSceneStore.setState({
      pieces: INITIAL_PIECES,
      selectedIds: [],
      viewMode: 'top',
      viewResetToken: 0,
      saveStatus: 'idle',
      hasLoaded: false,
    });
  }
  ```

  Add after the existing `describe('rotatePiece', ...)` block (after line 80):

  ```ts
  describe('setViewMode', () => {
    it('updates the view mode', () => {
      useSceneStore.getState().setViewMode('perspective');
      expect(useSceneStore.getState().viewMode).toBe('perspective');
      useSceneStore.getState().setViewMode('top');
      expect(useSceneStore.getState().viewMode).toBe('top');
    });
  });

  describe('resetView', () => {
    it('increments viewResetToken on each call', () => {
      expect(useSceneStore.getState().viewResetToken).toBe(0);
      useSceneStore.getState().resetView();
      expect(useSceneStore.getState().viewResetToken).toBe(1);
      useSceneStore.getState().resetView();
      expect(useSceneStore.getState().viewResetToken).toBe(2);
    });
  });
  ```

- [ ] **Step 2: Run tests to verify they fail**

  Run: `pnpm test -- sceneStore`
  Expected: FAIL — `viewResetToken` is `undefined` / `resetView` is not a function.

- [ ] **Step 3: Implement `viewResetToken` and `resetView`**

  In `src/store/sceneStore.ts`, update the `SceneState` interface (lines 9-22) to add two
  fields — full updated interface:

  ```ts
  interface SceneState {
    pieces: PieceInstance[];
    selectedIds: string[];
    viewMode: 'top' | 'perspective';
    viewResetToken: number;
    saveStatus: SaveStatus;
    hasLoaded: boolean;
    selectPiece: (id: string) => void;
    clearSelection: () => void;
    movePiece: (id: string, worldX: number, worldZ: number) => boolean;
    rotatePiece: (id: string) => void;
    setViewMode: (mode: 'top' | 'perspective') => void;
    resetView: () => void;
    saveScene: () => Promise<void>;
    loadScene: () => Promise<void>;
  }
  ```

  Update the store body: add `viewResetToken: 0,` to initial state (next to
  `viewMode: 'top',` on line 47), and add the `resetView` action right after
  `setViewMode` (line 85):

  ```ts
  setViewMode: (viewMode) => set({ viewMode }),

  resetView: () => set((s) => ({ viewResetToken: s.viewResetToken + 1 })),
  ```

- [ ] **Step 4: Run tests to verify they pass**

  Run: `pnpm test -- sceneStore`
  Expected: PASS, all tests including the two new blocks.

- [ ] **Step 5: Commit**

  ```bash
  git add src/store/sceneStore.ts src/store/sceneStore.test.ts
  git commit -m "feat: add viewResetToken and resetView to scene store"
  ```

---

### Task 2: Perspective camera + orbit controls in `Scene.tsx`

**Files:**
- Modify: `src/scene/Scene.tsx`

**Interfaces:**
- Consumes: `viewMode`, `viewResetToken` from `useSceneStore` (Task 1). `BOARD_WIDTH`,
  `BOARD_DEPTH`, `CELL_SIZE_METERS` from `src/lib/grid.ts` (existing).
- Produces: nothing new consumed by later tasks — this is the leaf that renders the
  camera.

- [ ] **Step 1: Replace `Scene.tsx` with the camera-branching version**

  This file is in `scene/`, which per the Global Constraints is not unit tested — write
  the implementation directly (no failing-test step), then verify manually in Task 5.

  Full new content for `src/scene/Scene.tsx`:

  ```tsx
  import { useState } from 'react';
  import { Canvas } from '@react-three/fiber';
  import {
    OrthographicCamera,
    PerspectiveCamera,
    MapControls,
    OrbitControls,
  } from '@react-three/drei';
  import { Board } from './Board';
  import { Pieces } from './Pieces';
  import { useSceneStore } from '../store/sceneStore';
  import { BOARD_WIDTH, BOARD_DEPTH, CELL_SIZE_METERS } from '../lib/grid';

  const widthMeters = BOARD_WIDTH * CELL_SIZE_METERS;
  const depthMeters = BOARD_DEPTH * CELL_SIZE_METERS;
  const boardCenter: [number, number, number] = [widthMeters / 2, 0, depthMeters / 2];
  const perspectivePosition: [number, number, number] = [
    boardCenter[0] + 10,
    12,
    boardCenter[2] + 10,
  ];

  export function Scene() {
    const [isDragging, setIsDragging] = useState(false);
    const clearSelection = useSceneStore((s) => s.clearSelection);
    const viewMode = useSceneStore((s) => s.viewMode);
    const viewResetToken = useSceneStore((s) => s.viewResetToken);

    return (
      <Canvas onPointerMissed={clearSelection}>
        {viewMode === 'top' ? (
          <>
            <OrthographicCamera makeDefault position={[6, 20, 4.8]} zoom={40} up={[0, 0, -1]} />
            <MapControls enabled={!isDragging} enableRotate={false} screenSpacePanning />
          </>
        ) : (
          <group key={viewResetToken}>
            <PerspectiveCamera makeDefault position={perspectivePosition} fov={45} />
            <OrbitControls enabled={!isDragging} target={boardCenter} />
          </group>
        )}
        <ambientLight intensity={0.9} />
        <directionalLight position={[5, 10, 5]} intensity={0.5} />
        <Board />
        <Pieces onDragStateChange={setIsDragging} />
      </Canvas>
    );
  }
  ```

  Note: the `<group key={viewResetToken}>` wrapper is what makes "Reset view" work —
  bumping `viewResetToken` (Task 3) changes the `key`, so React unmounts and remounts the
  `PerspectiveCamera` + `OrbitControls` pair at their default props, snapping the camera
  back. The same remount happens naturally the first time `viewMode` becomes
  `'perspective'`, satisfying "perspective always starts from the same default angle."

- [ ] **Step 2: Typecheck and lint**

  Run: `pnpm typecheck && pnpm lint`
  Expected: both clean, no errors.

- [ ] **Step 3: Run the full test suite to confirm nothing else broke**

  Run: `pnpm test`
  Expected: PASS, same count as before plus Task 1's new tests.

- [ ] **Step 4: Commit**

  ```bash
  git add src/scene/Scene.tsx
  git commit -m "feat: branch Scene camera on viewMode for perspective toggle"
  ```

---

### Task 3: `ViewToggle` UI component

**Files:**
- Create: `src/ui/ViewToggle/ViewToggle.tsx`
- Create: `src/ui/ViewToggle/index.ts`
- Test: `src/ui/ViewToggle/ViewToggle.test.tsx`

**Interfaces:**
- Consumes: `viewMode`, `setViewMode`, `resetView` from `useSceneStore` (Task 1).
- Produces: `ViewToggle` component, exported from `src/ui/ViewToggle` (barrel) —
  consumed by Task 4 (`App.tsx`).

- [ ] **Step 1: Write the failing component tests**

  Create `src/ui/ViewToggle/ViewToggle.test.tsx`:

  ```tsx
  import { beforeEach, describe, expect, it } from 'vitest';
  import { render, screen, fireEvent } from '@testing-library/react';
  import { ViewToggle } from './ViewToggle';
  import { useSceneStore } from '../../store/sceneStore';

  beforeEach(() => {
    useSceneStore.setState({ viewMode: 'top', viewResetToken: 0 });
  });

  describe('ViewToggle', () => {
    it('shows a button to switch to 3D view in top mode, with no reset button', () => {
      render(<ViewToggle />);
      expect(screen.getByRole('button', { name: /switch to 3d view/i })).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /reset view/i })).not.toBeInTheDocument();
    });

    it('switches to perspective mode when clicked', () => {
      render(<ViewToggle />);
      fireEvent.click(screen.getByRole('button', { name: /switch to 3d view/i }));
      expect(useSceneStore.getState().viewMode).toBe('perspective');
    });

    it('shows a switch-to-top button plus a reset view button in perspective mode', () => {
      useSceneStore.setState({ viewMode: 'perspective' });
      render(<ViewToggle />);
      expect(screen.getByRole('button', { name: /switch to top view/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /reset view/i })).toBeInTheDocument();
    });

    it('switches back to top mode when clicked', () => {
      useSceneStore.setState({ viewMode: 'perspective' });
      render(<ViewToggle />);
      fireEvent.click(screen.getByRole('button', { name: /switch to top view/i }));
      expect(useSceneStore.getState().viewMode).toBe('top');
    });

    it('increments viewResetToken when reset view is clicked', () => {
      useSceneStore.setState({ viewMode: 'perspective' });
      render(<ViewToggle />);
      fireEvent.click(screen.getByRole('button', { name: /reset view/i }));
      expect(useSceneStore.getState().viewResetToken).toBe(1);
    });
  });
  ```

- [ ] **Step 2: Run tests to verify they fail**

  Run: `pnpm test -- ViewToggle`
  Expected: FAIL — `./ViewToggle` module not found.

- [ ] **Step 3: Implement `ViewToggle`**

  Create `src/ui/ViewToggle/ViewToggle.tsx`:

  ```tsx
  import { useSceneStore } from '../../store/sceneStore';

  export function ViewToggle() {
    const viewMode = useSceneStore((s) => s.viewMode);
    const setViewMode = useSceneStore((s) => s.setViewMode);
    const resetView = useSceneStore((s) => s.resetView);

    return (
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setViewMode(viewMode === 'top' ? 'perspective' : 'top')}
          className="cursor-pointer self-start rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-ink"
        >
          {viewMode === 'top' ? 'Switch to 3D view' : 'Switch to top view'}
        </button>
        {viewMode === 'perspective' && (
          <button
            type="button"
            onClick={resetView}
            className="cursor-pointer self-start rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-ink"
          >
            Reset view
          </button>
        )}
      </div>
    );
  }
  ```

  Create `src/ui/ViewToggle/index.ts`:

  ```ts
  export * from './ViewToggle';
  ```

- [ ] **Step 4: Run tests to verify they pass**

  Run: `pnpm test -- ViewToggle`
  Expected: PASS, all 5 tests.

- [ ] **Step 5: Commit**

  ```bash
  git add src/ui/ViewToggle
  git commit -m "feat: add ViewToggle component for camera mode switching"
  ```

---

### Task 4: Wire `ViewToggle` into `App.tsx`

**Files:**
- Modify: `src/App.tsx`

**Interfaces:**
- Consumes: `ViewToggle` from `src/ui/ViewToggle` (Task 3).
- Produces: nothing consumed by later tasks — this is the final integration point.

- [ ] **Step 1: Add the import and render it in the panel**

  In `src/App.tsx`, add the import next to the other `ui/` imports (after line 6,
  `import { RotateButton } from './ui/RotateButton';`):

  ```tsx
  import { ViewToggle } from './ui/ViewToggle';
  ```

  Update the panel JSX (lines 36-43) to render it right after `<SaveStatus />`:

  ```tsx
  panel={
    <div className="flex flex-col gap-3">
      <SaveStatus />
      <ViewToggle />
      <Legend />
      <MeasurementPanel />
      <RotateButton />
    </div>
  }
  ```

- [ ] **Step 2: Typecheck, lint, and run the full test suite**

  Run: `pnpm typecheck && pnpm lint && pnpm test`
  Expected: all clean/PASS — no `App.tsx` test file exists (App is composition-only,
  covered by the manual verification in Task 5), so this step only needs to confirm
  nothing else regressed.

- [ ] **Step 3: Commit**

  ```bash
  git add src/App.tsx
  git commit -m "feat: wire ViewToggle into the app panel"
  ```

---

### Task 5: Manual verification in the running app

**Files:** none (verification only).

**Interfaces:** none — this task exercises the fully wired feature from Tasks 1-4.

- [ ] **Step 1: Start the dev server**

  Run: `pnpm dev`

- [ ] **Step 2: Verify top mode is unchanged**

  Load the app. Confirm: locked top-down view, no rotate/orbit possible, pan still works,
  dragging a piece still snaps to grid and rejects overlaps — identical to before this
  plan.

- [ ] **Step 3: Verify entering perspective mode**

  Click "Switch to 3D view". Confirm: camera switches to a 3/4 angled perspective view of
  the board, "Switch to top view" and "Reset view" buttons both appear.

- [ ] **Step 4: Verify free orbit**

  Drag on empty canvas (not on a piece) in perspective mode. Confirm the camera
  orbits/tilts/zooms freely around the board center (not the world origin corner).

- [ ] **Step 5: Verify reset view**

  Orbit/tilt the camera away from its default angle, then click "Reset view". Confirm the
  camera snaps back to the same default angled position as when perspective mode was
  first entered.

- [ ] **Step 6: Verify piece dragging still works in perspective mode**

  Drag a piece to a new empty cell while in perspective mode. Confirm it snaps to the
  grid and updates position, the same as in top mode. Then try dragging a piece onto an
  already-occupied cell and confirm it's rejected (snaps back).

- [ ] **Step 7: Verify round-trip reset behavior**

  Orbit away from default, switch to top view, switch back to perspective. Confirm the
  camera is back at the default angle (not the orbited-away position) — per the spec,
  camera state is not preserved across a top → perspective round trip.

- [ ] **Step 8: Verify mobile/narrow-viewport layout**

  Resize the browser to a narrow viewport (or use dev tools device emulation). Confirm
  `ViewToggle`'s buttons render sensibly in the bottom-sheet panel (`ResponsiveLayout`)
  alongside `SaveStatus`/`Legend`/`MeasurementPanel`/`RotateButton` — no overflow or
  clipped buttons.

- [ ] **Step 9: Final full-suite check**

  Run: `pnpm lint && pnpm typecheck && pnpm test && pnpm build`
  Expected: all clean — this is the same gate the project's CI workflow runs.

- [ ] **Step 10: Report readiness for review**

  Per this project's git workflow, work stays on the `feat/perspective-camera-toggle`
  branch after this task — report what was verified and wait for the user's go-ahead
  before `git push` / opening a PR against `dev`.
