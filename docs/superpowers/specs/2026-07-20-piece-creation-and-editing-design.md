# Piece Creation and Editing — Design

**Status:** Approved, ready for implementation plan.

## Goal

Let a user create new pieces at runtime with custom width/depth/name/color, and edit
those same attributes on **any** existing piece (including the 4 original fixed types).
This goes beyond the original challenge's "fixed pieces, no add/remove UI" decision
(`DESIGN.md`'s "Open items for next session") — a deliberate, explicit extension for this
demo, not an oversight.

Scoped explicitly to **box-shaped** pieces only (width × depth rectangles, grid-snapped,
axis-aligned) — non-rectangular shapes and any performance work for large piece counts
are separate follow-ups, not part of this feature.

## Data model (`lib/pieces.ts`)

Generalizes the override pattern the color-swap feature already established
(`colorOverride`) to width, depth, and label — uniformly, for every piece, not just new
ones:

- `PieceInstance` gains `widthOverride?: number`, `depthOverride?: number`,
  `labelOverride?: string` (alongside the existing `colorOverride?: string`).
- `PieceType` gains `'custom'` — the base type assigned to genuinely new pieces created
  by this feature. `PIECE_DEFS.custom` is a placeholder entry (`width: 1, depth: 1, label:
  'Custom', color: '#c65b4a'`) that exists only to satisfy `Record<PieceType, PieceDef>`;
  a real custom-piece instance always sets all four overrides, so this placeholder is
  never actually read in practice.
- New helper `getBaseFootprint(instance): { width: number; depth: number }` — resolves
  `widthOverride ?? def.width` / `depthOverride ?? def.depth`, **without** the rotation
  swap. This is what the edit form pre-fills (rotation-0 equivalent dimensions) and what
  `addPiece`/`updatePiece` write back as overrides.
- `getFootprint` (existing) is reimplemented in terms of `getBaseFootprint`: computes the
  base footprint, then applies the existing rotation-90 swap on top of it. Its exported
  signature is unchanged.
- New helper `getPieceLabel(instance): string` — `labelOverride ?? def.label`.
- `getPieceColor` (existing) needs **no change** — already generic (`colorOverride ??
  def.color`), and custom pieces always set the override.
- `scene/Piece.tsx`'s selected-piece `Html` label currently reads `def.label` directly
  (`Piece.tsx:45`) — changes to `getPieceLabel(piece)`.

## Store (`store/sceneStore.ts`)

Two new actions, both returning a status so the calling UI can react (not booleans —
there are more than two outcomes):

```ts
type PlacementResult = 'created' | 'updated' | 'conflict' | 'too-large' | 'no-space';

addPiece(input: { width: number; depth: number; label: string; color: string }): PlacementResult;
updatePiece(
  id: string,
  input: { width: number; depth: number; label: string; color: string },
  options?: { reposition?: boolean },
): PlacementResult;
```

**`addPiece`:**
1. If `width > BOARD_WIDTH || depth > BOARD_DEPTH` → return `'too-large'`, no mutation.
2. Otherwise scan the grid row-major (`gridY` 0..`BOARD_DEPTH - depth`, `gridX` 0..
   `BOARD_WIDTH - width`, top-left first) for the first position where a `{width, depth}`
   rect at that position doesn't collide with any existing piece (reusing
   `hasCollision`/`rectsOverlap` from `collision.ts` — no new collision math).
3. Found → append a new `PieceInstance` (`type: 'custom'`, `rotation: 0`, id via
   `crypto.randomUUID()`, the found `gridX`/`gridY`, `widthOverride`/`depthOverride`/
   `labelOverride`/`colorOverride` set from `input`) → return `'created'`.
4. Not found anywhere → return `'no-space'`, no mutation.

**`updatePiece`:**
1. If `width > BOARD_WIDTH || depth > BOARD_DEPTH` → return `'too-large'`, no mutation.
2. If piece `id` doesn't exist → no mutation (shouldn't happen from the UI, but the
   action must not throw).
3. Without `options.reposition`: check only the piece's **current** `gridX`/`gridY` —
   does the new `{width, depth}` there go off-board or collide with another piece
   (`hasCollision`, excluding the piece's own id, same as existing `movePiece`/
   `rotatePiece` do)? Fits → apply the overrides in place, return `'updated'`. Doesn't
   fit → return `'conflict'`, no mutation.
4. With `options.reposition: true`: try the current position first (same check as
   above) — if it still fits, apply in place, return `'updated'` (no need to move it).
   If not, run the same first-free-spot search `addPiece` uses (excluding the piece being
   edited from collision checks), applying the found position along with the new
   overrides → `'updated'`. Nothing fits anywhere → return `'no-space'`, no mutation.

**`deletePiece(id: string): void`** — removes the piece from `pieces`; if it was in
`selectedIds`, clears the selection.

## UI

**`ui/PieceForm/`** (new) — one form, two modes:
- **Add mode**: opened via a new "Add piece" trigger (visible whenever, not
  selection-gated). Starts with empty/default values (width 1, depth 1, name empty,
  color = the first curated swatch). Submits via `addPiece`.
- **Edit mode**: opened via a new "Edit" button shown next to `RotateButton`/
  `DeleteButton` when exactly one piece is selected. Pre-filled from
  `getBaseFootprint(piece)`, `getPieceLabel(piece)`, `getPieceColor(piece)`. Submits via
  `updatePiece`.

Fields: width, depth (number inputs, clamped to `[1, BOARD_WIDTH]` / `[1, BOARD_DEPTH]`),
name (required text input), and a color swatch row.

**`ui/SwatchRow/`** (new) — presentational, fully controlled, no store access:
`{ swatches: {label: string; color: string}[]; value: string; onChange: (color: string)
=> void }`. Renders one button per swatch, highlighting whichever matches `value`. This
is the swatch-button markup extracted out of the old `ColorSwatchPicker`.

- In **Edit mode**, `PieceForm` passes 7 swatches: `[{label: 'Default', color:
  PIECE_DEFS[piece.type].color}, ...the 6 existing curated colors]` — same 7 options and
  same curated hex values as the old `ColorSwatchPicker` (Terracotta `#c65b4a`, Sage
  `#5f9e6f`, Violet `#8a6bb0`, Teal `#4a9a95`, Mustard `#d1a940`, Rose `#c76b93`).
- In **Add mode**, `PieceForm` passes just the 6 curated swatches (no "Default" entry —
  there's no existing piece to revert to).

**`ui/ColorSwatchPicker/` is removed** — its always-visible inline color swatches are
superseded by the color field inside `PieceForm`'s Edit mode. `App.tsx` no longer renders
it.

**`ui/DeleteButton/`** (new) — shown next to `RotateButton` when exactly one piece is
selected; calls `deletePiece(selectedIds[0])`, no confirmation (mirrors how `RotateButton`
already needs none — reversible via undo-by-re-creating, and low risk for a demo app).

## Edit-time collision flow

This is the one genuinely new interaction pattern in this feature — a two-step confirm,
not a single reject-or-allow:

1. Submit → `updatePiece(id, input)` (no `reposition`).
2. `'updated'` → form closes, done.
3. `'too-large'` → inline error in the form ("Piece is larger than the board"), form
   stays open for the user to adjust.
4. `'conflict'` → the form shows a confirmation prompt instead of closing: *"This size
   won't fit here. Move it to the nearest free spot?"* with **Yes** / **No, let me
   adjust** buttons.
   - **Yes** → call `updatePiece(id, input, { reposition: true })`. `'updated'` → form
     closes. `'no-space'` → inline error ("No space available for this size anywhere on
     the board"), form stays open.
   - **No** → dismiss the confirmation, return to the form unchanged, no store call.

Creation (`addPiece`) has no existing position to try to preserve, so it never shows this
confirmation — only the `'too-large'`/`'no-space'` inline errors apply there.

## Testing

Consistent with the established strategy: `scene/` (R3F/WebGL) stays manually verified.

- `lib/pieces.test.ts`: `getBaseFootprint` (override vs default, both dimensions
  independently), `getFootprint` still correctly rotation-swaps on top of resolved
  overrides, `getPieceLabel` (override vs default).
- `store/sceneStore.test.ts`:
  - `addPiece`: places into open space and returns `'created'`; returns `'too-large'`
    without mutating when width/depth exceeds the board; returns `'no-space'` without
    mutating when the board has no free area of that size; new piece has `type:
    'custom'` and the given overrides.
  - `updatePiece`: applies in place and returns `'updated'` when the new size still fits
    at the current position; returns `'conflict'` without mutating when it would collide
    or go off-board at the current position and `reposition` isn't set; with
    `reposition: true`, relocates to the first free spot and returns `'updated'` when the
    current position doesn't fit; returns `'no-space'` without mutating when nothing
    fits anywhere even with `reposition: true`; returns `'too-large'` without mutating
    regardless of `reposition` when width/depth exceeds the board outright; works on any
    existing piece, including the 4 fixed types (not just `'custom'`).
  - `deletePiece`: removes the target piece only; clears `selectedIds` when the deleted
    piece was selected; leaves selection untouched when it wasn't.
- `ui/SwatchRow/SwatchRow.test.tsx`: renders one button per swatch; highlights the one
  matching `value`; clicking a swatch calls `onChange` with that swatch's color.
- `ui/PieceForm/PieceForm.test.tsx`: Add mode starts empty/default and calls `addPiece`
  on submit; Edit mode pre-fills from the given piece and calls `updatePiece` on submit;
  the `'conflict'` confirmation prompt appears with Yes/No, Yes calls `updatePiece` again
  with `reposition: true`, No dismisses without a second store call; `'too-large'`/
  `'no-space'` render as inline errors without closing the form.
- `ui/DeleteButton/DeleteButton.test.tsx`: mirrors `RotateButton`'s visibility test
  (nothing rendered at 0 or 2 selected pieces); clicking it calls `deletePiece` with the
  selected id.

## Out of scope

- Non-rectangular / non-box piece shapes — separate follow-up (would require
  generalizing the grid/collision model beyond single-rect footprints).
- Performance work for large piece counts — separate follow-up, only relevant once
  piece count is actually unbounded in practice.
- Adding custom pieces to the `Legend` — the `Legend` continues to document only the 4
  fixed types' default colors, consistent with the color-swap feature's precedent.
- Changing a piece's underlying `type` via editing — `PieceForm` edits overrides
  (width/depth/label/color) only; `type` stays fixed once a piece exists.
