# Style Guide — Gridyard

Visual identity for the InLab/Artefacto technical-challenge submission. Companion to
`DESIGN.md` and `ARCHITECTURE.md`. Full visual reference (logo gallery, swatches, type
specimen) was designed as an artifact before being written here — this file is the
source of truth going forward.

## Name

**Gridyard** — a shorter, brandable name for the app (`DESIGN.md`/`ARCHITECTURE.md`
still describe the underlying concept as a "warehouse/floor-plan layout tool"; Gridyard
is what it's called). Update `index.html`'s `<title>` to "Gridyard" during scaffolding
(Task 14 of the implementation plan currently sets it to "Warehouse Layout Editor" —
change it to match).

## Mark

Symbol + wordmark. The symbol is a literal reading of the product: a blueprint grid
with one cell snapped full — the exact interaction the app is built around, not an
abstract/generic icon.

Two variants, source files in `assets/brand/`:

- **`logo.svg`** (Variant A — "shelf cell"): 2×1 fill, echoing the shelf piece's
  footprint. Primary lockup — app header, README, submission doc cover.
- **`logo-mark.svg`** (Variant B — "center cell"): 1×1 fill, most balanced at very
  small sizes. Use below ~20px (favicon, browser tab) where Variant A's offset fill
  loses legibility.

```svg
<!-- logo.svg (Variant A, primary) -->
<svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
  <g fill="none" stroke="#9a988e" stroke-width="1.4" stroke-linecap="round">
    <path d="M1 1H31V31H1V1Z" />
    <path d="M1 11H31" />
    <path d="M1 21H31" />
    <path d="M11 1V31" />
    <path d="M21 1V31" />
  </g>
  <rect x="11.7" y="1.7" width="18.6" height="8.6" rx="1.2" fill="#2f6fed" />
</svg>
```

**Do:**
- Keep clear space around the mark equal to one grid cell (≈1/3 of the icon width)
- Use Variant B below 20px
- Recolor the accent cell to match context (e.g. white on a dark accent surface)

**Don't:**
- Stretch or skew off the square aspect ratio
- Recolor the grid lines — they stay neutral in every context
- Add a drop shadow or bevel — flatness is deliberate (orthographic camera, no
  perspective, per `DESIGN.md`)

## Color

Two families: brand neutrals/accent, and the four piece colors already fixed in
`DESIGN.md` — reused here rather than invented separately, so brand and product read as
one thing.

| Name | Hex | Role |
|---|---|---|
| Accent | `#2f6fed` | Brand primary — same blue as the selected-piece highlight in-app (`ARCHITECTURE.md` Piece component) |
| Ink | `#2a2a28` | Text on light ground |
| Paper | `#f7f6f2` | Page / board background |
| Grid line | `#9a988e` | Section dividers, board grid lines |
| Pallet | `#c8a165` | Piece color — 1×1 pallet |
| Shelf | `#6b8ca6` | Piece color — 2×1 shelf |
| Crate | `#e08a3c` | Piece color — 1×1 crate |
| Workstation | `#4a4a52` | Piece color — 2×2 workstation |

Dark-mode equivalents (for any doc/marketing surface that needs a dark ground): paper
`#1c1c1a`, ink `#f0efe9`, grid line `#5a584f`, accent `#5b8bff`. Piece colors are
in-app/product colors only — not used as UI chrome, so they don't need dark variants.

## Typography

Monospace for the wordmark and headings — the fixed character grid reads like
coordinates on a blueprint, which is what the product actually is. A plain system sans
carries body copy so long-form text (this doc, `DESIGN.md`) stays easy to read. Both are
OS-native stacks — no webfont to fail to load.

- **Wordmark / headings:** `ui-monospace, "SF Mono", "Cascadia Mono", "Roboto Mono", "JetBrains Mono", monospace` — weight 700 for the wordmark, 600 for section headings, tight (−0.02em) tracking
- **Body / UI copy:** `-apple-system, BlinkMacSystemFont, "Segoe UI", ui-sans-serif, sans-serif`
- **Eyebrows / labels:** mono, 12px, uppercase, 0.08em tracking

## Asset creation instructions

The two SVGs in `assets/brand/` are the only source files — every other asset (favicon,
app icons, OG image) is generated from them, so a palette or shape change only happens
once.

1. **Copy the SVGs into the scaffolded app.** Once the project is scaffolded (Task 1 of
   the implementation plan), copy `assets/brand/logo.svg` and
   `assets/brand/logo-mark.svg` into `public/`.

2. **Generate the raster set** with `sharp-cli` (one-off dev dependency, no need to add
   it to `package.json`):
   ```bash
   pnpm dlx sharp-cli -i public/logo-mark.svg -o public/favicon-16.png resize 16 16
   pnpm dlx sharp-cli -i public/logo-mark.svg -o public/favicon-32.png resize 32 32
   pnpm dlx sharp-cli -i public/logo-mark.svg -o public/apple-touch-icon.png resize 180 180
   pnpm dlx sharp-cli -i public/logo-mark.svg -o public/icon-512.png resize 512 512
   ```

3. **Wire up favicon/app-icon links** in `index.html`'s `<head>`, replacing the Vite
   default favicon link:
   ```html
   <link rel="icon" type="image/svg+xml" href="/logo-mark.svg" />
   <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32.png" />
   <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
   ```

4. **Build the OG/share image** (1200×630, for link previews when the deployed URL or
   submission doc is shared). Compose from the same tokens rather than a new design
   pass: paper background (`#f7f6f2`), full lockup (icon + "Gridyard" in mono 700)
   left-aligned, tagline below in sans. Save as `public/og-image.png`, reference it:
   ```html
   <meta property="og:image" content="/og-image.png" />
   <meta property="og:title" content="Gridyard — 3D Warehouse Layout Editor" />
   ```

| File | Size | Source variant | Used for |
|---|---|---|---|
| `logo.svg` | 32×32 | A | App header, README, docs |
| `logo-mark.svg` | 32×32 | B | Favicon source, small contexts |
| `favicon-32.png` | 32×32 | B | Browser tab |
| `apple-touch-icon.png` | 180×180 | B | iOS home-screen add |
| `icon-512.png` | 512×512 | B | PWA manifest icon |
| `og-image.png` | 1200×630 | A (lockup) | Link preview / share card |

## Status

Task 14 of the implementation plan (`docs/superpowers/plans/2026-07-17-mini-3d-scene-editor-mvp.md`)
copied `assets/brand/logo.svg` and `logo-mark.svg` into `public/`, set the page title
to "Gridyard," and wired the SVG favicon. The PNG favicon fallback, apple-touch-icon,
PWA icon, and OG image deferred at that point were completed per
`docs/superpowers/specs/2026-07-21-seo-shareability-design.md`: the full raster set,
`site.webmanifest`, and `og-image.png` now exist in `public/`, and `index.html` carries
the full metadata (description, Open Graph, Twitter Card, canonical URL, JSON-LD).
