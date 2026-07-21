# SEO & Shareability Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the deployed Gridyard link look and behave professionally when shared or
crawled — branded domain, full `index.html` metadata, real link-preview image, favicon
set, and baseline crawler files — per
`docs/superpowers/specs/2026-07-21-seo-shareability-design.md`.

**Architecture:** Static-only changes — new files in `public/` (favicons, OG image,
`robots.txt`, `sitemap.xml`, `site.webmanifest`) plus a rewritten `index.html` `<head>`.
No app code changes. One Vercel project rename (`innovation_challenger` → `gridyard`)
gives the branded `.vercel.app` domain the metadata references.

**Tech Stack:** `sharp-cli` (one-off, via `pnpm dlx`, not added to `package.json`) for
favicon rasterization; a throwaway Playwright spec (the project already has
`@playwright/test`) to screenshot an HTML template into the OG image, since it needs real
text layout that `sharp-cli`'s resize-only operations can't produce.

## Global Constraints

- No app code changes — every file touched is either a new static asset in `public/` or
  `index.html`'s `<head>`.
- Reuse the exact tokens from `STYLE_GUIDE.md`: paper `#f7f6f2`, ink `#2a2a28`, grid line
  `#9a988e`, accent `#2f6fed`; mono stack
  `ui-monospace, "SF Mono", "Cascadia Mono", "Roboto Mono", "JetBrains Mono", monospace`
  weight 700 for the wordmark; sans stack
  `-apple-system, BlinkMacSystemFont, "Segoe UI", ui-sans-serif, sans-serif` for the
  tagline. Do not invent new colors/fonts for these assets.
- The description text is reused verbatim across `<meta name="description">`,
  `og:description`, and `twitter:description` — exactly:
  `"Place, rotate, and measure warehouse pallets, shelving, crates, and workstations on a 3D floor-plan grid — snap-to-grid layout with real-world measurements."`
- The canonical production URL for every absolute link in this plan is
  `https://gridyard.vercel.app/` (Task 1 makes this real — do Task 1 first).
- Run `pnpm build` after every task in this plan; it must keep succeeding (Vite copies
  `public/` files as-is, so this mostly confirms nothing else broke).
- This plan adds static assets/markup, not application behavior — there's no unit-test
  cycle. Each task's "test" is a concrete verification command (build succeeds, files
  exist with correct size/type, or a throwaway Playwright check of the rendered
  `<head>`), not TDD red-green.

---

### Task 1: Rename the Vercel project to `gridyard`

**Files:** none in the repo — this is a Vercel project setting change. `.vercel/project.json`
gets refreshed as a side effect of Step 3.

**Interfaces:**
- Consumes: nothing.
- Produces: the live domain `https://gridyard.vercel.app/`, which every other task's
  absolute URLs (canonical, `og:url`, `og:image`, JSON-LD `url`, `sitemap.xml`) depend on.

- [ ] **Step 1: Confirm the target subdomain is actually unclaimed**

  ```bash
  curl -s https://gridyard.vercel.app | head -5
  ```

  Expected: `DEPLOYMENT_NOT_FOUND` (this was already confirmed once during the design
  discussion, in case time has passed — someone else could have claimed it since).

- [ ] **Step 2: Rename the project**

  ```bash
  cd /home/loki/www/challengers/innovation_challenger
  npx vercel@latest project rename innovation_challenger gridyard
  ```

  Expected: a confirmation message that the project was renamed.

- [ ] **Step 3: Refresh the local project link**

  **Gotcha (found during execution): always pass `--project` explicitly.**
  `vercel link --yes` alone is non-interactive and, once the cached
  `.vercel/project.json`'s project name (`innovation_challenger`) no longer matches any
  real project (it was just renamed), silently *creates a brand-new empty project* named
  after the current directory instead of relinking to the renamed one. Use:

  ```bash
  npx vercel@latest link --yes --project gridyard
  cat .vercel/project.json
  ```

  Expected: `"projectName":"gridyard"` in the output, and `projectId` unchanged from
  before the rename (renaming doesn't create a new project — only linking incorrectly
  can). If a stray `innovation_challenger` project was accidentally created by a bare
  `vercel link --yes`, remove it: `echo "y" | npx vercel@latest project rm innovation_challenger`.

- [ ] **Step 4: Confirm the domain will update on the next deploy (not immediately)**

  ```bash
  curl -s -o /dev/null -w "HTTP %{http_code}\n" https://gridyard.vercel.app
  curl -s -o /dev/null -w "HTTP %{http_code}\n" https://innovationchallenger.vercel.app
  npx vercel@latest alias ls
  ```

  Expected: `gridyard.vercel.app` still returns `404` and `innovationchallenger.vercel.app`
  still returns `200` right after the rename — **a project rename does not repoint
  existing deployment aliases**; `vercel alias ls` will show the old
  `innovationchallenger*.vercel.app` aliases still attached to the current production
  deployment. The `gridyard.vercel.app` alias is only generated on the **next** production
  deployment (Vercel derives the default `.vercel.app` alias from the project's current
  name at deploy time, not retroactively). Task 6's merge-to-`master` triggers that next
  deployment — verify the domain there, not here.

- [ ] **Step 5: Commit**

  Nothing to commit for this task (no repo files changed) — proceed directly to Task 2.

---

### Task 2: Favicon / app-icon set + web manifest

**Files:**
- Create: `public/favicon-32.png`
- Create: `public/apple-touch-icon.png`
- Create: `public/icon-512.png`
- Create: `public/site.webmanifest`
- Modify: `index.html`

**Interfaces:**
- Consumes: `public/logo-mark.svg` (existing source asset).
- Produces: the four new `public/` files above, referenced by Task 4's `index.html`
  rewrite (Task 4 must not remove these links).

- [ ] **Step 1: Generate the three PNG icons from the existing SVG mark**

  ```bash
  cd /home/loki/www/challengers/innovation_challenger
  pnpm dlx sharp-cli -i public/logo-mark.svg -o public/favicon-32.png resize 32 32
  pnpm dlx sharp-cli -i public/logo-mark.svg -o public/apple-touch-icon.png resize 180 180
  pnpm dlx sharp-cli -i public/logo-mark.svg -o public/icon-512.png resize 512 512
  ```

- [ ] **Step 2: Verify the generated files**

  ```bash
  file public/favicon-32.png public/apple-touch-icon.png public/icon-512.png
  ```

  Expected:
  ```
  public/favicon-32.png:      PNG image data, 32 x 32, ...
  public/apple-touch-icon.png: PNG image data, 180 x 180, ...
  public/icon-512.png:         PNG image data, 512 x 512, ...
  ```

- [ ] **Step 3: Create `public/site.webmanifest`**

  ```json
  {
    "name": "Gridyard",
    "short_name": "Gridyard",
    "icons": [{ "src": "/icon-512.png", "sizes": "512x512", "type": "image/png" }],
    "theme_color": "#2f6fed",
    "background_color": "#f7f6f2"
  }
  ```

- [ ] **Step 4: Add the icon/manifest links to `index.html`**

  Current `index.html` `<head>`:

  ```html
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/logo-mark.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Gridyard</title>
  </head>
  ```

  Replace the single favicon line with (keep everything else as-is for this task — the
  title/meta rewrite is Task 4):

  ```html
    <link rel="icon" type="image/svg+xml" href="/logo-mark.svg" />
    <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32.png" />
    <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
    <link rel="manifest" href="/site.webmanifest" />
  ```

- [ ] **Step 5: Verify the build still passes**

  ```bash
  pnpm build
  ls dist/favicon-32.png dist/apple-touch-icon.png dist/icon-512.png dist/site.webmanifest
  ```

  Expected: build succeeds; all four files exist in `dist/` (Vite copies `public/` as-is).

- [ ] **Step 6: Commit**

  ```bash
  git add public/favicon-32.png public/apple-touch-icon.png public/icon-512.png public/site.webmanifest index.html
  git commit -m "feat: add favicon set and web manifest from existing brand mark"
  ```

---

### Task 3: OG/share image

**Files:**
- Create: `public/og-image.png` (binary asset, committed)

**Interfaces:**
- Consumes: `assets/brand/logo.svg` (existing source asset, inlined into the template
  below — not imported at runtime).
- Produces: `public/og-image.png` (1200×630), referenced by Task 4's `og:image` /
  `twitter:image` meta tags.

**Note on approach:** `sharp-cli` (used in Task 2) only resizes existing images — it
can't lay out text. The OG image needs a real wordmark + tagline composition, so it's
generated by rendering an HTML file and screenshotting it with Playwright. The project's
`node_modules` layout (pnpm, non-hoisted) only exposes `@playwright/test`, not a
standalone `playwright`/`chromium` import usable from a plain Node script — so the
screenshot is taken via a **throwaway spec file** run through the project's own
`pnpm exec playwright test`, then deleted. This is a one-off asset-generation step, not
part of the committed E2E suite.

- [ ] **Step 1: Create the OG image HTML template** at
  `/tmp/gridyard-og-image.html` (outside the repo — this is a generation input, not a
  committed file):

  ```html
  <!doctype html>
  <html>
  <head>
  <meta charset="UTF-8" />
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body {
      width: 1200px;
      height: 630px;
      background: #f7f6f2;
      overflow: hidden;
    }
    .wrap {
      width: 1200px;
      height: 630px;
      display: flex;
      flex-direction: column;
      justify-content: center;
      padding: 0 100px;
    }
    .lockup {
      display: flex;
      align-items: center;
      gap: 28px;
    }
    .lockup svg {
      width: 96px;
      height: 96px;
      flex-shrink: 0;
    }
    .wordmark {
      font-family: ui-monospace, "SF Mono", "Cascadia Mono", "Roboto Mono", "JetBrains Mono", monospace;
      font-weight: 700;
      font-size: 96px;
      letter-spacing: -0.02em;
      color: #2a2a28;
      line-height: 1;
    }
    .tagline {
      margin-top: 32px;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", ui-sans-serif, sans-serif;
      font-size: 34px;
      color: #6b6a63;
      letter-spacing: 0;
    }
  </style>
  </head>
  <body>
    <div class="wrap">
      <div class="lockup">
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
        <div class="wordmark">Gridyard</div>
      </div>
      <div class="tagline">3D Warehouse Layout Editor</div>
    </div>
  </body>
  </html>
  ```

  (This is `assets/brand/logo.svg`'s exact markup inlined, plus the wordmark/tagline —
  already verified to render correctly during design.)

- [ ] **Step 2: Create the throwaway screenshot spec** at
  `e2e/_og-preview.spec.ts` (note the leading underscore — not part of the real E2E
  suite, deleted in Step 4):

  ```ts
  import { test } from '@playwright/test';

  test('render og image', async ({ page }) => {
    await page.setViewportSize({ width: 1200, height: 630 });
    await page.goto('file:///tmp/gridyard-og-image.html');
    await page.waitForTimeout(200);
    await page.screenshot({ path: '/home/loki/www/challengers/innovation_challenger/public/og-image.png' });
  });
  ```

- [ ] **Step 3: Run it**

  ```bash
  cd /home/loki/www/challengers/innovation_challenger
  npx playwright test e2e/_og-preview.spec.ts --reporter=list
  file public/og-image.png
  ```

  Expected: `1 passed`; `public/og-image.png: PNG image data, 1200 x 630, ...`.

- [ ] **Step 4: View the result and delete the throwaway spec**

  View `public/og-image.png` to confirm the composition reads well (wordmark legible,
  tagline readable, no clipping) — this is the one visual judgment call in this plan a
  command can't make for you. Then:

  ```bash
  rm e2e/_og-preview.spec.ts
  ```

- [ ] **Step 5: Commit**

  ```bash
  git add public/og-image.png
  git commit -m "feat: add OG/share image generated from brand tokens"
  ```

---

### Task 4: `index.html` metadata (title, description, Open Graph, Twitter, canonical, JSON-LD)

**Files:**
- Modify: `index.html`

**Interfaces:**
- Consumes: `public/og-image.png` (Task 3), `public/site.webmanifest` (Task 2), the
  `https://gridyard.vercel.app/` domain (Task 1).
- Produces: the final `index.html` `<head>`, consumed by Task 6's verification.

- [ ] **Step 1: Replace `index.html` in full**

  ```html
  <!doctype html>
  <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <link rel="icon" type="image/svg+xml" href="/logo-mark.svg" />
      <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32.png" />
      <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
      <link rel="manifest" href="/site.webmanifest" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />

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

      <script type="application/ld+json">
        {
          "@context": "https://schema.org",
          "@type": "SoftwareApplication",
          "name": "Gridyard",
          "description": "A 3D warehouse floor-plan layout editor — place, rotate, and measure pallets, shelving, crates, and workstations on a snap-to-grid board.",
          "applicationCategory": "DesignApplication",
          "operatingSystem": "Any (web browser)",
          "url": "https://gridyard.vercel.app/"
        }
      </script>
    </head>
    <body>
      <div id="root"></div>
      <script type="module" src="/src/main.tsx"></script>
    </body>
  </html>
  ```

- [ ] **Step 2: Verify the build**

  ```bash
  pnpm build
  ```

  Expected: succeeds (identical to the existing build — `index.html` is just copied/
  processed by Vite as before, no new build inputs).

- [ ] **Step 3: Verify the rendered `<head>` with a throwaway Playwright check**

  Create `e2e/_meta-check.spec.ts`:

  ```ts
  import { test, expect } from '@playwright/test';

  test('head metadata is correct', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle('Gridyard — 3D Warehouse Layout Editor');

    const getMeta = (selector: string) => page.locator(selector).getAttribute('content');
    expect(await getMeta('meta[name="description"]')).toBe(
      'Place, rotate, and measure warehouse pallets, shelving, crates, and workstations on a 3D floor-plan grid — snap-to-grid layout with real-world measurements.',
    );
    expect(await getMeta('meta[property="og:image"]')).toBe('https://gridyard.vercel.app/og-image.png');
    expect(await getMeta('meta[name="twitter:card"]')).toBe('summary_large_image');
    expect(await page.locator('link[rel="canonical"]').getAttribute('href')).toBe('https://gridyard.vercel.app/');

    const jsonLd = await page.locator('script[type="application/ld+json"]').textContent();
    const parsed = JSON.parse(jsonLd!);
    expect(parsed['@type']).toBe('SoftwareApplication');
    expect(parsed.name).toBe('Gridyard');
  });
  ```

  Run it against the production build (matches how the real site is actually served):

  ```bash
  pnpm build
  npx playwright test e2e/_meta-check.spec.ts --reporter=list
  ```

  Expected: `1 passed`. Delete the throwaway spec afterward: `rm e2e/_meta-check.spec.ts`.

- [ ] **Step 4: Commit**

  ```bash
  git add index.html
  git commit -m "feat: add full SEO/Open Graph/Twitter/JSON-LD metadata to index.html"
  ```

---

### Task 5: Crawler basics — `robots.txt` and `sitemap.xml`

**Files:**
- Create: `public/robots.txt`
- Create: `public/sitemap.xml`

**Interfaces:**
- Consumes: `https://gridyard.vercel.app/` (Task 1).
- Produces: nothing consumed by later tasks — this is the last content task.

- [ ] **Step 1: Create `public/robots.txt`**

  ```
  User-agent: *
  Allow: /

  Sitemap: https://gridyard.vercel.app/sitemap.xml
  ```

- [ ] **Step 2: Create `public/sitemap.xml`**

  ```xml
  <?xml version="1.0" encoding="UTF-8"?>
  <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    <url>
      <loc>https://gridyard.vercel.app/</loc>
    </url>
  </urlset>
  ```

- [ ] **Step 3: Verify**

  ```bash
  pnpm build
  cat dist/robots.txt
  cat dist/sitemap.xml
  ```

  Expected: both files present in `dist/` with the exact content above.

- [ ] **Step 4: Commit**

  ```bash
  git add public/robots.txt public/sitemap.xml
  git commit -m "feat: add robots.txt and sitemap.xml"
  ```

---

### Task 6: Deploy, live verification, and close out `STYLE_GUIDE.md`'s deferred item

**Files:**
- Modify: `STYLE_GUIDE.md`

**Interfaces:**
- Consumes: everything from Tasks 1–5.
- Produces: nothing — final task.

- [ ] **Step 1: Update `STYLE_GUIDE.md`'s "Status" section**

  Current text (end of file):

  ```markdown
  ## Status

  Task 14 of the implementation plan (`docs/superpowers/plans/2026-07-17-mini-3d-scene-editor-mvp.md`)
  now copies `assets/brand/logo.svg` and `logo-mark.svg` into `public/`, sets the page
  title to "Gridyard," and wires the SVG favicon. The PNG favicon fallback,
  apple-touch-icon, PWA icon, and OG image from the asset-creation steps above are not in
  the MVP plan — optional polish for later.
  ```

  Replace with:

  ```markdown
  ## Status

  Task 14 of the implementation plan (`docs/superpowers/plans/2026-07-17-mini-3d-scene-editor-mvp.md`)
  copied `assets/brand/logo.svg` and `logo-mark.svg` into `public/`, set the page title
  to "Gridyard," and wired the SVG favicon. The PNG favicon fallback, apple-touch-icon,
  PWA icon, and OG image deferred at that point were completed per
  `docs/superpowers/specs/2026-07-21-seo-shareability-design.md`: the full raster set,
  `site.webmanifest`, and `og-image.png` now exist in `public/`, and `index.html` carries
  the full metadata (description, Open Graph, Twitter Card, canonical URL, JSON-LD).
  ```

- [ ] **Step 2: Merge to `dev`, then `master`, and confirm the live site**

  Follow this project's normal git workflow: push the feature branch, open a PR into
  `dev`, and — once merged — fast-forward `master` to `dev` the same way the previous
  merge was done, so Vercel's production deploy (from `master`) picks up these changes.

  ```bash
  curl -s -o /dev/null -w "HTTP %{http_code}\n" https://gridyard.vercel.app/
  curl -s -o /dev/null -w "HTTP %{http_code}\n" https://gridyard.vercel.app/og-image.png
  curl -s -o /dev/null -w "HTTP %{http_code}\n" https://gridyard.vercel.app/robots.txt
  curl -s -o /dev/null -w "HTTP %{http_code}\n" https://gridyard.vercel.app/sitemap.xml
  curl -s -o /dev/null -w "HTTP %{http_code}\n" https://gridyard.vercel.app/favicon-32.png
  ```

  Expected: all five return `HTTP 200`.

- [ ] **Step 3: Commit**

  ```bash
  git add STYLE_GUIDE.md
  git commit -m "docs: close out STYLE_GUIDE.md's deferred favicon/OG-image status"
  ```
