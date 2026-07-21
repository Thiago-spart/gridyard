# SEO & Shareability — Design

**Status:** Approved, ready for implementation plan.

## Goal

Make the deployed link (`https://innovationchallenger.vercel.app`, soon
`https://gridyard.vercel.app`) look and behave professionally when shared or crawled —
proper metadata, a branded domain, a real link-preview image, and baseline technical
SEO — without chasing search-engine rankings, which isn't a relevant goal for a
single-page technical-challenge demo tool.

## Background

`STYLE_GUIDE.md` already specifies most of the visual/copy decisions here (favicon set,
OG image composition, exact title copy) under "Asset creation instructions," explicitly
deferred at MVP time: "The PNG favicon fallback, apple-touch-icon, PWA icon, and OG image
from the asset-creation steps above are not in the MVP plan — optional polish for
later." This spec executes that deferred plan and fills the gaps it doesn't cover (meta
description, robots.txt, sitemap.xml, canonical URL, structured data, domain rename).

Currently `index.html` has only a bare `<title>Gridyard</title>` and an SVG-only favicon
link — no description, no Open Graph/Twitter tags, no canonical URL, no structured data,
no `robots.txt`/`sitemap.xml`.

## Scope

Covered:
- Vercel project rename (branded domain)
- `index.html` metadata: title, description, Open Graph, Twitter Card, canonical URL,
  JSON-LD `SoftwareApplication` block
- Favicon/app-icon raster set + `site.webmanifest`, generated from the existing brand
  SVGs in `assets/brand/`
- OG/share image (1200×630), composed to match `STYLE_GUIDE.md`'s tokens
- `robots.txt` (allow all, reference sitemap) and a single-URL `sitemap.xml`

Out of scope (not relevant to the stated goal):
- Server-side rendering / prerendering for crawlers — the app is a client-rendered
  Vite/React SPA; static `index.html` meta tags already cover link-preview crawlers
  (which don't execute JS), and there's no search-ranking goal driving a need for
  crawler-rendered content.
- A custom apex domain (e.g. buying `gridyard.dev`) — `gridyard.vercel.app` satisfies the
  "looks branded when shared" goal without an ongoing cost/registration.
- Multi-language (`hreflang`) tags — the app UI and all public-facing copy are English
  only (per an earlier decision in this same work), so there's nothing to alternate
  between.
- Web Analytics / Speed Insights instrumentation — a separate, unrelated concern
  (observability, not SEO/shareability).

## 1. Domain rename

Rename the linked Vercel project from `innovation_challenger` to `gridyard` via
`vercel project rename innovation_challenger gridyard` (or `vercel project update` if
the CLI's rename subcommand requires it — confirmed available: `gridyard.vercel.app`
currently returns Vercel's `DEPLOYMENT_NOT_FOUND`, meaning the subdomain is unclaimed).
The project's GitHub link, production-branch setting (`master`), and environment
variables all carry over automatically on a rename — this is a metadata change on the
existing project, not a new project creation. `.vercel/project.json`'s cached
`projectName` will need a fresh `vercel link` (or manual edit) to stay in sync locally,
though `projectId` (the real identifier the CLI uses) doesn't change.

The old `innovationchallenger.vercel.app` URL will stop resolving after the rename. This
is acceptable: the link has only been shared within this working session so far, not
published anywhere durable yet.

## 2. `index.html` metadata

Replace the current bare `<head>` with:

```html
<title>Gridyard — 3D Warehouse Layout Editor</title>
<meta name="description" content="Place, rotate, and measure warehouse pallets, shelving, crates, and workstations on a 3D floor-plan grid — snap-to-grid layout with real-world measurements." />
<link rel="canonical" href="https://gridyard.vercel.app/" />

<meta property="og:type" content="website" />
<meta property="og:url" content="https://gridyard.vercel.app/" />
<meta property="og:title" content="Gridyard — 3D Warehouse Layout Editor" />
<meta property="og:description" content="Place, rotate, and measure warehouse pallets, shelving, crates, and workstations on a 3D floor-plan grid — snap-to-grid layout with real-world measurements." />
<meta property="og:image" content="https://gridyard.vercel.app/og-image.png" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />

<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="Gridyard — 3D Warehouse Layout Editor" />
<meta name="twitter:description" content="Place, rotate, and measure warehouse pallets, shelving, crates, and workstations on a 3D floor-plan grid — snap-to-grid layout with real-world measurements." />
<meta name="twitter:image" content="https://gridyard.vercel.app/og-image.png" />
```

Description text is reused verbatim across `meta description`, `og:description`, and
`twitter:description` — one source of truth, no drift between them.

Plus a minimal JSON-LD block (a `<script type="application/ld+json">` in `<head>`):

```json
{
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "Gridyard",
  "description": "A 3D warehouse floor-plan layout editor — place, rotate, and measure pallets, shelving, crates, and workstations on a snap-to-grid board.",
  "applicationCategory": "DesignApplication",
  "operatingSystem": "Any (web browser)",
  "url": "https://gridyard.vercel.app/"
}
```

`applicationCategory: DesignApplication` fits better than `BusinessApplication` or
`Game` — it's a layout/planning tool, not literal business software or a game (per
`DESIGN.md`'s explicit "not a board game" framing).

## 3. Icon & OG image assets

All generated from the two existing source SVGs in `assets/brand/` (`logo.svg` — the
primary lockup, `logo-mark.svg` — the small/favicon variant), per `STYLE_GUIDE.md`'s
asset table. Straight rasterizations use `sharp-cli` (already documented there); the OG
image needs real text layout, which `sharp-cli`'s resize-only operations can't do, so
it's composed as an HTML template and captured via a one-off Playwright screenshot (the
project already has `@playwright/test` as a devDependency from the E2E suite work).

Generated files, all in `public/`:

| File | Size | Source | Tool |
|---|---|---|---|
| `favicon-32.png` | 32×32 | `logo-mark.svg` | `sharp-cli` resize |
| `apple-touch-icon.png` | 180×180 | `logo-mark.svg` | `sharp-cli` resize |
| `icon-512.png` | 512×512 | `logo-mark.svg` | `sharp-cli` resize |
| `og-image.png` | 1200×630 | HTML template using `logo.svg` + tokens | Playwright screenshot |

`index.html`'s favicon link is extended (existing SVG link stays first — the
non-blurry choice for capable browsers, per standard favicon fallback ordering):

```html
<link rel="icon" type="image/svg+xml" href="/logo-mark.svg" />
<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32.png" />
<link rel="apple-touch-icon" href="/apple-touch-icon.png" />
<link rel="manifest" href="/site.webmanifest" />
```

`public/site.webmanifest` (new, minimal — just enough for the 512px icon to register as
a PWA-installable icon, not a full PWA/offline-support commitment, which is out of
scope):

```json
{
  "name": "Gridyard",
  "short_name": "Gridyard",
  "icons": [{ "src": "/icon-512.png", "sizes": "512x512", "type": "image/png" }],
  "theme_color": "#2f6fed",
  "background_color": "#f7f6f2"
}
```

The OG image HTML template (not committed as a page route — a throwaway file used only
to generate the PNG, per `STYLE_GUIDE.md`'s "compose from the same tokens" instruction):
paper background (`#f7f6f2`), the `logo.svg` lockup + "Gridyard" wordmark in mono 700 at
large size, left-aligned, with the tagline ("3D Warehouse Layout Editor") below it in the
sans body font — reusing the exact hex values and font stacks from `STYLE_GUIDE.md`'s
Color and Typography sections, so this doesn't become a second, drifting source of the
brand's visual identity.

## 4. Crawler basics

`public/robots.txt`:

```
User-agent: *
Allow: /

Sitemap: https://gridyard.vercel.app/sitemap.xml
```

`public/sitemap.xml` (single URL — the app is one page, but a sitemap is still standard
practice and costs nothing to include):

```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://gridyard.vercel.app/</loc>
  </url>
</urlset>
```

## Testing

- `pnpm build` must still succeed (new static files in `public/` are copied as-is by
  Vite; no build-time change beyond the existing pipeline).
- A quick Playwright check (ad hoc, not part of the committed E2E suite — this is
  metadata/markup, not app interaction behavior) confirming: `document.title`, the
  `description`/`og:*`/`twitter:*` meta tag values, the JSON-LD block parses as valid
  JSON and matches the expected shape, and `favicon-32.png` / `og-image.png` /
  `robots.txt` / `sitemap.xml` all return HTTP 200 once deployed.
- Manual visual check of `og-image.png` (view the generated file) before wiring it into
  `index.html`, to confirm the composition actually reads well at a glance — this is a
  one-time visual judgment call a test assertion can't make.

## Out of scope (this spec)

- A custom apex domain.
- SSR/prerendering.
- Any change to `robots.txt`/sitemap if the project ever grows beyond one page (revisit
  then, not speculatively now).
