# Design Summary — Mini 3D Scene Editor

Source challenge: `Teste_Tecnico_Dev_InLab_ENVIAR_5dias.pdf` (InLab · Artefacto)

## Concept

A mini 3D **warehouse / floor-plan layout tool**, not a board game. A fixed 10×8 grid
"floor," viewed straight down through an orthographic camera, where the user places and
arranges warehouse objects (pallets, shelving, crates, workstations) — snapping to grid,
avoiding overlap, with real-world measurements and rotation.

This direction was chosen over a literal chess/board-game reading and a consumer
furniture-planner reading because it best demonstrates product/UX thinking applied to a
real use case, which lines up with what the job posting (`jb_Innovation_Lab.pdf`)
emphasizes: turning prototypes into products, Supabase/full-stack integration, UX/UI.

## Visual style

Clean CAD/blueprint look:
- Light gray-white base plane
- Thin dark grid lines (drei's `<Grid>` helper)
- Flat-shaded solid-color pieces, no textures or external models

Chosen over a warehouse-concrete-texture style (more immersive but more time spent on
texturing) and a dark "tech/SaaS" style (strong portfolio look but less literal as a
floor-plan tool). This option is cheapest to build and stays legible once collision
highlighting and measurement overlays are layered on top.

## Piece set

Primitive geometries only (no external 3D models — keeps load time and complexity down).
Footprint given in grid cells before rotation:

| Type | Footprint | Color |
|---|---|---|
| Pallet | 1×1 | tan/brown |
| Shelf / rack | 2×1 | blue-gray |
| Crate | 1×1 | orange |
| Workstation | 2×2 | dark gray |

## Core mechanics

- **Drag:** raycast pointer → invisible ground plane → grid coordinates
- **Rotation:** 90° increments; swaps effective width/depth used for footprint math
- **Collision:** AABB rectangle overlap check, accounting for per-piece footprint and
  current rotation. **Invalid drop = snap back** to the last valid position — no invalid
  (overlapping) state is ever persisted or saved.
- **Snap:** round position to nearest grid cell on release
- **Measurement panel:** one piece selected → real-world size (e.g. a 2×1 shelf shows
  "2.4m × 1.2m", scale factor: 1 grid cell = 1.2m — matches a real pallet's footprint);
  two pieces selected → distance between them. Same panel, same scale-factor math for
  both.

## Labeling

Pieces are color-coded only by default (see Piece set table). A `<Html>` (drei) text
label — piece type name, e.g. "Shelf" — appears only on the currently-selected piece,
positioned above it. Chosen over always-on labels (clutter risk on small mobile screens)
and drei `<Text>` (avoids bundling an SDF font, reuses existing CSS). A small
always-visible corner legend maps color → piece type, so identification doesn't depend on
having something selected.

## Data model

```ts
type PieceType = 'pallet' | 'shelf' | 'crate' | 'workstation';

interface PieceInstance {
  id: string;
  type: PieceType;
  gridX: number;
  gridY: number;
  rotation: 0 | 90;
}
```

## Persistence

Two-step, intentionally iterative (good material for the AI process log):
1. **localStorage** first — ships the "save & reload" requirement immediately, JSON blob
   of `PieceInstance[]`.
2. **Supabase** as a documented follow-up — anonymous auth (no login UI) + a `scenes`
   table keyed by `user_id`, scoped with Row-Level Security (full schema in
   `ARCHITECTURE.md`). Chosen because the job posting lists Supabase and authentication
   explicitly as responsibilities; a pure localStorage solution wouldn't demonstrate
   either.

## Stack

- Vite + React + TypeScript
- React Three Fiber + drei
- Zustand for scene state (piece list, selection)
- Deploy target: Vercel

## Input & interaction (mobile-first)

The app targets mobile as the primary device, with notebook/desktop (mouse + trackpad)
also supported — so the baseline interaction model has to work identically on touch,
trackpad, and mouse, with keyboard shortcuts layered on top as a non-exclusive desktop
enhancement (never the only way to do something).

**Universal (touch / trackpad / mouse) — same code path everywhere:**
- Tap/click a piece → select it
- Tap/click a second piece → add it to selection (enables the two-piece distance
  measurement); tap/click empty board space → clear selection
- On-screen rotate button appears attached to the selected piece (or in a fixed toolbar
  on narrow screens) when exactly one piece is selected → rotates it 90°
- Drag a piece → move it (raycast-based, works the same for touch-drag and mouse-drag);
  drag starting on empty board space → pan the camera, so piece-drag and camera-pan never
  compete for the same gesture
- Pinch (touch) / scroll-wheel (mouse/trackpad) → zoom

**Desktop/notebook enhancement, additive only:**
- `R` → rotate the selected piece 90° (same effect as the on-screen button)
- `Shift`+click → add a second piece to selection (same effect as a second tap/click)
- `Escape` → clear selection

**Layout:** responsive — sidebar for the measurement panel on wide screens, bottom sheet
on narrow/mobile screens.

## Camera

Orthographic, locked top-down (no orbit/rotation) for the core requirement. Camera mode
kept as state (`viewMode: 'top' | 'perspective'`) rather than hardcoded, so the bonus
perspective toggle is a small addition rather than a rework.

## AI process

Built using Claude Code and Antigravity. Every step logged in `AI_LOG.md` as it happens,
tagged by tool, per the format the challenge requires.

## Bonus priority (only if time remains)

1. Perspective camera toggle — cheap, high visual payoff, camera state already supports it
2. Per-piece color/material swap
3. Performance pass (instancing/memoization) — low urgency at ~4 piece types on screen

## Open items for next session

- ~~Confirm exact grid cell size / scale factor~~ — decided: 1 cell = 1.2m (matches a
  real pallet's footprint)
- ~~Decide whether pieces can be added/removed at runtime~~ — decided: fixed pieces, the
  4 pieces spawn at scene start, no add/remove palette UI
- ~~Rotation trigger~~ / ~~Multi-select interaction~~ — decided together, see "Input &
  interaction" section below
- ~~Whether pieces show a text label~~ — decided: drei `<Html>` label shown only on the
  currently-selected piece (crisp DOM text, no font dependency, no clutter), plus a small
  always-visible corner legend mapping color → piece type
- GitHub repo creation deferred until architecture is fully settled (per user)

All open items are now resolved — architecture is settled, ready to scaffold.
