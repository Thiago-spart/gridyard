# Per-Piece Color Swap — Design

**Status:** Approved, ready for implementation plan.

## Goal

Add the second bonus feature from `DESIGN.md`'s "Bonus priority" list: letting a user
change an individual piece's color, independent of its type's default color.

## Background / tension with existing behavior

`DESIGN.md` states pieces are "color-coded only by default," with an "always-visible
corner legend [that] maps color → piece type." `STYLE_GUIDE.md` lists the four piece
colors as "already fixed." Per-instance color customization means a customized piece's
color no longer matches its `Legend` swatch — an accepted trade-off for this bonus
feature (decided explicitly, not an oversight): the `Legend` continues to document each
type's *default* color, and a user who customizes a piece has knowingly diverged from it.

Separately, the currently-selected piece's mesh color is fully replaced with the accent
blue (`scene/Piece.tsx`, `meshStandardMaterial color={isSelected ? '#2f6fed' : def.color}`)
as its selection highlight. That conflicts with a color picker: a user could never see
their chosen color while the piece is selected (i.e. while the picker is even visible).
This is resolved by changing the selection highlight mechanism (see below).

## Behavior

- Color customization is **per piece instance**, not per type — recoloring one crate
  does not affect other crates, and does not change the `Legend`.
- Customization is via a **small preset swatch row** (not a free-form color picker),
  visible only when exactly one piece is selected (same visibility rule as
  `RotateButton`). One swatch is "Default" (clears the override, reverting to the type's
  default color); the other ~6 are curated colors chosen to stay visually distinct from
  the 4 existing type colors and the accent blue.
- The currently-active swatch (matching the piece's resolved color) is visually
  highlighted, so the picker reflects current state, not just a set of actions.
- A custom color **persists** — it's saved the same way position/rotation already are
  (part of the same `pieces` array that flows through the existing debounced autosave),
  survives reload, and needs no schema/migration change (scenes are stored as a single
  JSONB blob).
- Selection highlight changes from "replace the mesh color with blue" to an **outline**
  (drei's `<Outlines>`) around the piece, so the piece's real color — default or
  custom — stays visible at all times, including while selected and while picking a
  color. This is a behavior change to existing selection rendering, not just new code.

## Data model (`lib/pieces.ts`)

- `PieceInstance` gains `colorOverride?: string` (hex string; `undefined`/absent means
  "use the type default").
- New pure helper: `getPieceColor(instance: Pick<PieceInstance, 'type' | 'colorOverride'>): string`
  — returns `instance.colorOverride ?? PIECE_DEFS[instance.type].color`. Single source of
  truth for color resolution, used by both `scene/Piece.tsx` (rendering) and
  `ColorSwatchPicker` (to determine which swatch is "active").
- `PIECE_DEFS` (the 4 type defaults) is unchanged.

## Store (`store/sceneStore.ts`)

New action: `setPieceColor: (id: string, color: string | null) => void`. `color: null`
clears `colorOverride` (reverts to default); a hex string sets it. No new state field
needed beyond what's already on `pieces` — persistence is automatic via the existing
`pieces`-driven debounced autosave in `App.tsx`.

## Rendering (`scene/Piece.tsx`)

- `meshStandardMaterial` always renders `getPieceColor(piece)` — no more
  selection-based color replacement.
- When `isSelected`, render `<Outlines thickness={0.05} color="#2f6fed" />` as an
  additional child of the mesh (drei's outline-shell component) — the accent blue
  already used elsewhere for the selection color, per `STYLE_GUIDE.md`.

## UI (`ui/ColorSwatchPicker/`, new)

Follows the existing `RotateButton`/`ViewToggle` component pattern (component +
`index.ts` barrel + co-located test):

- Visible only when `selectedIds.length === 1` (identical condition to `RotateButton`).
- Renders a row of buttons: one "Default" swatch + 6 curated color swatches. Suggested
  palette (muted, distinct from the 4 existing type colors `#c8a165`/`#6b8ca6`/`#e08a3c`/
  `#4a4a52` and the accent `#2f6fed`):
  - Terracotta `#c65b4a`
  - Sage `#5f9e6f`
  - Violet `#8a6bb0`
  - Teal `#4a9a95`
  - Mustard `#d1a940`
  - Rose `#c76b93`
- Clicking a color swatch calls `setPieceColor(selectedId, hex)`; clicking "Default"
  calls `setPieceColor(selectedId, null)`.
- The swatch matching the selected piece's current `getPieceColor(...)` result gets a
  visual "active" indicator (e.g. a ring/border).

Wired into `App.tsx`'s panel right next to `RotateButton` — both are piece-specific
controls gated on a single selection, grouped together (unlike `ViewToggle`, which is
scene-wide and lives up near `SaveStatus`).

## Testing

Consistent with this project's established strategy: `scene/` (R3F/WebGL) stays manually
verified, not unit tested.

- `lib/pieces.test.ts`: `getPieceColor` returns the type default when no override is set,
  and the override when one is set.
- `store/sceneStore.test.ts`: `setPieceColor` sets `colorOverride` on the target piece
  (leaving others untouched); passing `null` clears it back to `undefined`.
- `ui/ColorSwatchPicker/ColorSwatchPicker.test.tsx`: renders nothing when 0 or 2 pieces
  are selected; renders the swatch row (including "Default") when exactly 1 is selected;
  clicking a swatch calls `setPieceColor` with the right arguments.
- Manual verification (Playwright, matching the process used for the perspective camera
  toggle): selecting a piece shows an outline (not a full recolor); picking a swatch
  changes the piece's actual color live while still selected; the active swatch is
  visually indicated; a custom color survives a page reload; clicking "Default" reverts
  a customized piece back to its type color.

## Out of scope

- Free-form color picker (`<input type="color">`) — explicitly rejected in favor of a
  curated swatch set, to stay within the "flat-shaded solid-color, no textures" style
  constraint and avoid colors that collide with another type's default.
- Per-type recoloring / updating the `Legend`'s swatches — this feature is per-instance
  only; the `Legend` continues to show each type's default color.
- The third bonus item (performance pass) — already addressed separately (deferred, per
  `README.md`'s "Performance" section and `AI_LOG.md` Step 17).
