# Perspective Camera Toggle — Design

**Status:** Approved, ready for implementation plan.

## Goal

Add the first bonus feature from `DESIGN.md`'s "Bonus priority" list: a toggle between
the existing locked top-down orthographic camera (the core-requirement view) and a
free-orbit perspective view, so the user can look at the layout in 3D.

## Background

`store/sceneStore.ts` already carries `viewMode: 'top' | 'perspective'` and a
`setViewMode` action — scaffolded during the MVP specifically so this toggle would be a
small addition, not a rework (per `DESIGN.md`). Neither is read anywhere yet;
`scene/Scene.tsx` hardcodes a single locked `OrthographicCamera` + `MapControls` with
`enableRotate={false}`.

## Behavior

- **Top mode** (default, unchanged): locked orthographic top-down camera, pan-only, no
  rotation — the existing core-requirement view.
- **Perspective mode**: `PerspectiveCamera` + full-orbit controls (rotate/tilt/zoom/pan),
  targeting the board's center rather than world origin.
- **Reset view** control, visible only in perspective mode: snaps the camera back to its
  default angle/zoom. Needed because free orbit lets the user rotate/tilt until they lose
  their bearings (e.g. end up looking at the underside of the board).
- Switching **into** perspective mode always starts from the same default angle — camera
  state is not preserved across a top → perspective → top → perspective round trip.
- Piece dragging (`DragPlane`, `Pieces`) is unaffected: R3F raycasting resolves the same
  way regardless of camera type, so drag-to-place keeps working unchanged in perspective
  mode.

## State (`store/sceneStore.ts`)

- `viewMode` / `setViewMode` — already exist, used as-is.
- New: `viewResetToken: number` (starts at `0`) and `resetView: () => void`, which
  increments it.

This token is the single mechanism behind both "perspective always starts clean" and the
Reset view button: the perspective camera + controls are wrapped in a React node keyed on
`viewResetToken`, so switching `viewMode` to `'perspective'` (a fresh mount) and clicking
Reset (a token bump forcing a remount) both produce the same result — no imperative
OrbitControls ref/`.reset()` handling needed.

## Scene (`scene/Scene.tsx`)

Branch on `viewMode`:

```
'top'         → OrthographicCamera (unchanged) + MapControls enableRotate={false}
'perspective' → <group key={viewResetToken}>
                  <PerspectiveCamera makeDefault ... />
                  <OrbitControls target={boardCenter} />
                </group>
```

`boardCenter` is derived from `BOARD_WIDTH` / `BOARD_DEPTH` / `CELL_SIZE_METERS` in
`lib/grid.ts` — the same math `DragPlane` already uses to center itself on the board —
so orbiting pivots around the layout, not the world-origin corner.

## UI (`ui/ViewToggle/ViewToggle.tsx`, new)

Follows the existing `RotateButton` pattern (component + `index.ts` barrel, same
`bg-accent` button styling):

- One button that flips `viewMode` between `'top'` and `'perspective'`.
- A second "Reset view" button, rendered only when `viewMode === 'perspective'`, calling
  `resetView()`.

Wired into `App.tsx`'s panel stack, placed right after `SaveStatus` — it's a scene-wide
camera control (unlike `RotateButton`, which is piece-specific and depends on
selection), so it belongs near the top of the panel rather than next to the
piece-editing controls.

## Testing

Consistent with the existing testing strategy (`ARCHITECTURE.md`): `scene/` stays
manually verified, not unit tested (WebGL/canvas). Covered by Vitest / React Testing
Library:

- `store/sceneStore.test.ts`: `setViewMode` updates `viewMode`; `resetView` increments
  `viewResetToken`.
- `ui/ViewToggle/ViewToggle.test.tsx`: toggle button label swaps with `viewMode`; Reset
  view button only renders in perspective mode and calls `resetView` on click.

## Out of scope

- Persisting `viewMode` to Supabase/localStorage — it's session-only UI state, not scene
  data.
- The other two bonus items (per-piece color swap, performance pass) — separate,
  lower-priority follow-ups per `DESIGN.md`.
