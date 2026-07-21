# Playwright E2E Suite — Design

**Status:** Approved, ready for implementation plan.

## Goal

Replace the ad-hoc, outside-the-repo Playwright verification used manually in AI_LOG
Steps 16 and 18 with a checked-in, repeatable E2E suite covering the one area Vitest
deliberately doesn't reach: `scene/`'s WebGL/canvas interactions (per `ARCHITECTURE.md`'s
testing strategy, `scene/` is "NOT covered by RTL").

## Background

`ARCHITECTURE.md`'s tooling table listed Cypress as a stretch goal, explicitly not
committed to because "E2E against a WebGL canvas is inherently brittle (no DOM to target
for drag-and-drop on pieces)." This design accepts that constraint and works within it
rather than around it: pieces render to `<canvas>` with no queryable DOM, but the pieces
themselves cause DOM side-effects (selection label, measurement panel text) that a real
user also relies on — so tests assert exactly what a user sees, nothing more.

## Scope

Covered:
- Select a piece (click on canvas) → selection label appears.
- Drag a piece to a new grid cell → distance between two selected pieces matches the
  expected value.
- Rotate a selected piece → measurement panel's size text swaps width/depth.
- Toggle top ↔ perspective view → button label flips, canvas keeps rendering (no console
  errors).

Out of scope (deferred, not silently dropped):
- Supabase persistence round-trips. CI has no `VITE_SUPABASE_URL` secret, so
  `persistence/index.ts` already resolves to the `localStorage` backend automatically —
  no test-only config needed, but also no coverage of the Supabase path itself. That
  stays manually verified per Step 16/18's precedent, or becomes a later, separate spec
  if the project wants it in CI.
- Full multi-step user journeys (create → edit → delete → reload). Can layer on top of
  this suite later; not needed to close the current gap.
- Piece creation/deletion/color-swap forms — these are plain DOM forms already reachable
  by React Testing Library and are unit-tested there.

## Coordinate strategy

`scene/Scene.tsx`'s top-down camera is fixed: `OrthographicCamera` at hardcoded
`position={[6, 20, 4.8]}`, `zoom={40}`, `up={[0, 0, -1]}`, never reconfigured at runtime
in top mode. Piece rest positions are deterministic:
`(gridX + width/2) * CELL_SIZE_METERS` on X and the equivalent on Z (`scene/Piece.tsx`,
`lib/grid.ts`). Given a fixed Playwright viewport size, this is a static, one-time-derived
projection — not something that needs to track app internals over time.

`e2e/gridToScreen.ts` (new, pure TS, no app imports beyond `lib/grid.ts` constants)
replicates Three.js's orthographic world→NDC→screen math for this one fixed camera, and
exposes:

```ts
function gridCellToScreen(gridX: number, gridY: number, viewportSize: { width: number; height: number }): { x: number; y: number }
```

This is verified against the known fixture layout itself: `INITIAL_PIECES` in
`store/sceneStore.ts` gives four pieces at known grid coordinates (pallet at (0,0), shelf
at (3,0), crate at (6,0), workstation at (0,3)) that the first spec's setup asserts are
independently selectable and distinguishable at their computed screen coordinates before
any test relies on drag math.

No test-only hooks are added to app code (`window.__sceneStore` etc.) — this was
explicitly decided against in favor of keeping tests observing only real user-visible
behavior.

## Assertions (DOM-only)

- **Select:** click computed screen coords for a piece → drei `<Html>` selection label
  (`scene/Piece.tsx`) with that piece's label text becomes visible.
- **Rotate:** select one piece → click "Rotate 90°" → `MeasurementPanel`'s
  `Size: {w}m × {d}m` text swaps width/depth (e.g. shelf `2.4m × 1.2m` → `1.2m × 2.4m`).
  Pure DOM text assertion, no coordinate math involved.
- **Drag:** click-drag from a piece's computed rest position to a computed target grid
  cell's screen position → select a second, stationary piece → `MeasurementPanel`'s
  `Distance: {d}m` text matches a value independently computed in the test from the two
  known grid coordinates (`lib/measurement.ts`'s `formatDistance` logic, reimplemented
  standalone in the test — not imported, to keep the assertion independent of the
  implementation it's checking).
- **View toggle:** click "Switch to 3D view" → button label becomes "Switch to top view"
  and a "Reset view" button appears; click it again → labels revert. Assert zero
  `page.on('console', ...)` errors across the interaction (guards against silent
  R3F/WebGL warnings breaking the perspective camera swap from
  `docs/superpowers/specs/2026-07-20-perspective-camera-toggle-design.md`).

## Structure

```
e2e/
├── gridToScreen.ts            # pure projection helper (no app imports besides lib/grid constants)
├── fixtures.ts                 # shared viewport size, INITIAL_PIECES-derived expectations
├── select.spec.ts
├── drag-move.spec.ts
├── rotate.spec.ts
└── view-toggle.spec.ts
playwright.config.ts            # webServer: `pnpm preview`, single chromium project, fixed viewport
```

`package.json` gains:
- `"test:e2e": "playwright test"`
- `"test:e2e:install": "playwright install --with-deps chromium"`

Chromium only. Multi-browser WebGL rendering adds flakiness and CI runtime with no
payoff for this suite's scope.

`playwright.config.ts` sets a fixed `viewport` (e.g. `1280x800`) on its single project —
required for `gridToScreen.ts`'s screen-coordinate math to stay valid, and pins the
`webServer` to `pnpm preview` (the production build) rather than `pnpm dev`, so E2E
exercises the same artifact `pnpm build` produces.

## CI (`.github/workflows/ci.yml`)

New `e2e` job, `needs: quality` (the existing lint/typecheck/test/build job), so it only
runs once the fast unit-test signal has already passed:

```
e2e:
  needs: quality
  runs-on: ubuntu-latest
  steps:
    - checkout
    - pnpm/action-setup
    - actions/setup-node (pnpm cache)
    - pnpm install --frozen-lockfile
    - pnpm exec playwright install --with-deps chromium   # cached via actions/cache on browser binary path
    - pnpm build
    - pnpm test:e2e
```

Runs against `vite preview` (started by Playwright's `webServer` config), no Supabase
secrets required — the app's existing `persistence/index.ts` fallback handles this for
free.

## Out of scope (this spec)

- Wiring real Supabase persistence into CI (would need a branched/ephemeral Supabase
  project + secrets; separate cost/benefit decision).
- Visual regression / screenshot-diff testing.
- Cross-browser or mobile-viewport E2E coverage.
