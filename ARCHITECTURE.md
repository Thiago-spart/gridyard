# Architecture

Technical companion to `DESIGN.md` (product/UX decisions). This file covers stack,
tooling, and code organization — written to explicitly demonstrate the practices listed
in the job posting (`jb_Innovation_Lab.pdf`), not just to make the challenge's 7
requirements work.

## Job requirements this architecture targets

From `jb_Innovation_Lab.pdf`:
- React + TypeScript
- Full-Stack (database/auth/API integrations)
- Three.js / React Three Fiber / WebGL
- Supabase or equivalent
- "Boas práticas de arquitetura, testes e performance"
- Diferencial: collision and snapping of 3D objects (the challenge's core mechanic)
- Diferencial: AI-assisted workflow (Claude Code, Cursor, Lovable, etc.)

## Stack

- **Vite + React + TypeScript** — app shell
- **React Three Fiber + drei** — 3D rendering
- **Tailwind CSS v4** — styling for `ui/` components (see Styling section below)
- **Zustand** — scene state (piece list, selection, view mode)
- **localStorage → Supabase** — persistence, staged (see `DESIGN.md`)
- **Vercel** — deployment

## Styling

**Tailwind CSS v4**, via `@tailwindcss/vite` (no PostCSS config, no `tailwind.config.js`
— v4 is CSS-first). Considered against shadcn/ui and plain CSS + a tokens file:
shadcn/ui was rejected because the actual `ui/` surface (legend, measurement panel,
rotate button, layout wrapper) has no complex interactive primitives — no dialogs,
dropdowns, or selects — so the Radix-primitive setup cost buys nothing yet; revisit only
if a bonus feature (e.g. a color picker) genuinely needs one.

`STYLE_GUIDE.md`'s palette and type stacks are wired in as real tokens, not just
documented values — defined in `src/index.css`:

```css
@import "tailwindcss";

:root {
  --gy-paper: #f7f6f2;
  /* ...full palette from STYLE_GUIDE.md... */
}

@media (prefers-color-scheme: dark) {
  :root {
    --gy-paper: #1c1c1a;
    /* ...dark equivalents... */
  }
}

@theme {
  --color-paper: var(--gy-paper);
  --color-accent: var(--gy-accent);
  /* ...maps every --gy-* token to a Tailwind utility... */
  --font-mono-brand: ui-monospace, "SF Mono", "Cascadia Mono", "Roboto Mono", monospace;
  --font-sans-brand: -apple-system, BlinkMacSystemFont, "Segoe UI", ui-sans-serif, sans-serif;
}
```

This makes `bg-paper`, `text-ink`, `text-accent`, `bg-pallet`/`bg-shelf`/`bg-crate`/
`bg-workstation`, and `font-mono-brand`/`font-sans-brand` real Tailwind utility classes
— the dark-mode swap happens automatically via the CSS variable indirection, no `dark:`
variant needed on every element.

`ui/` components use Tailwind utility classes directly in JSX — no per-component `.css`
file in the `ComponentName/` folder shape (tsx + test + stories + index only, per the
Folder structure section below). `scene/` (R3F) continues to use inline Three.js
props/materials, not CSS, since it's WebGL — unaffected by this decision.

## Tooling & testing strategy

The challenge's stated budget is ~6-10 hours ("prefira um núcleo bem-feito a tudo pela
metade"). Tooling is prioritized so the 7 required features are never sacrificed for
infrastructure — lower-priority tools are explicitly stretch goals, not commitments.

| Priority | Tool | Role |
|---|---|---|
| Core, built alongside features | **Vitest** | Unit tests for pure logic: AABB collision/overlap, grid snap rounding, real-world measurement formatting |
| Core, ~30-45min one-time setup | **CI/CD** (GitHub Actions) | Lint + typecheck + `vitest run` + build, on every push |
| After core features work | **React Testing Library** | Component tests for non-3D UI: measurement panel, legend, toolbar |
| Stretch, only if time remains | **Storybook** | R3F/Canvas doesn't story well without extra addon config — real setup tax |
| Stretch, only if time remains | **Cypress** | E2E against a WebGL canvas is inherently brittle (no DOM to target for drag-and-drop on pieces) |

If Storybook/Cypress don't make it in, that's documented as a conscious trade-off in the
technical write-up ("what I'd add with more time"), not silently dropped.

## Folder structure

```
src/
├── main.tsx
├── App.tsx
├── scene/                    # R3F / WebGL-rendered — NOT covered by RTL
│   ├── Scene.tsx              # Canvas + orthographic camera + lighting
│   ├── Board.tsx              # grid/base plane
│   ├── Piece.tsx              # piece mesh + drag/select pointer handlers
│   └── SelectionLabel.tsx     # drei <Html> label on the selected piece
├── ui/                        # DOM/HTML HUD — one folder per component
│   ├── MeasurementPanel/
│   │   ├── MeasurementPanel.tsx
│   │   ├── MeasurementPanel.test.tsx
│   │   ├── MeasurementPanel.stories.tsx   # added when Storybook lands
│   │   └── index.ts                        # `export * from './MeasurementPanel'`
│   ├── Legend/            (same shape)
│   ├── RotateButton/      (same shape)
│   └── ResponsiveLayout/  (same shape)
├── lib/                       # pure functions, no React/Three imports — Vitest target
│   ├── collision.ts           # AABB overlap check
│   ├── collision.test.ts
│   ├── grid.ts                # snap-to-grid rounding, cell↔world conversions
│   ├── grid.test.ts
│   ├── measurement.ts         # real-world size/distance formatting
│   ├── measurement.test.ts
│   └── pieces.ts              # piece type defs: footprint, color, label
├── store/
│   └── sceneStore.ts          # Zustand: pieces, selection, view mode
├── persistence/
│   ├── localStorage.ts
│   └── supabase.ts            # added when we get to that step
├── hooks/
│   ├── usePointerDrag.ts      # unifies touch/mouse/trackpad drag
│   └── useKeyboardShortcuts.ts
└── types/
    └── piece.ts

.github/workflows/ci.yml
DESIGN.md · ARCHITECTURE.md · AI_LOG.md
```

**`ui/` component-folder convention:** each component gets its own folder
(`ui/ComponentName/`) containing `ComponentName.tsx` (the implementation), a colocated
`ComponentName.test.tsx`, and `index.ts` as a barrel re-export (`export * from
'./ComponentName'`) — so imports stay clean (`from 'ui/MeasurementPanel'`) while editor
tabs, stack traces, and test output still show the real component name instead of a
generic `index.tsx`. `ComponentName.stories.tsx` slots into the same folder once
Storybook is added (stretch goal, see Tooling & testing strategy).

`lib/` and `scene/` don't use the folder-per-file convention — `lib/` is small,
framework-free modules where a flat file + colocated test is simplest, and `scene/`
isn't unit-tested at all (per the testing strategy) so there's no test file to colocate.

## State management (Zustand)

```ts
interface SceneStore {
  // data
  pieces: PieceInstance[];

  // selection: ordered, max length 2 (2nd enables distance measurement)
  selectedIds: string[];

  // camera (bonus toggle)
  viewMode: 'top' | 'perspective';

  // actions
  selectPiece: (id: string) => void;   // see selection rule below
  clearSelection: () => void;
  movePiece: (id: string, gridX: number, gridY: number) => boolean; // false = rejected (collision)
  rotatePiece: (id: string) => void;
  setViewMode: (mode: 'top' | 'perspective') => void;

  // persistence
  saveScene: () => void;
  loadScene: () => void;
}
```

**Selection rule** (`selectPiece`): 0 selected → click selects it. 1 selected → click on a
different piece adds it (now 2, distance measurement shows). 2 selected → click on any
piece starts fresh with just that one. Click on empty board → `clearSelection()`.

**Drag position is transient, not store state.** While a piece is being dragged, its
position lives in local component state (or a ref) inside `scene/Piece.tsx`, updated on
every pointer-move — not written to the Zustand store on every frame. Only the final,
validated position is committed via `movePiece()` on drop. This avoids triggering global
re-renders (measurement panel, legend, etc.) on every pixel of movement during a drag, and
makes `movePiece` a clean validation boundary: it's only ever called with a candidate
final position, checks collision, and either commits or rejects — matching the
"reject the drop" decision in `DESIGN.md`.

## Supabase (persistence follow-up)

Auth scope: **anonymous auth + Row-Level Security**, not a login form. Supabase's
built-in `signInAnonymously()` gives each browser a session with zero UI, and RLS scopes
each session's saved scene to its own row. This demonstrates real auth + RLS architecture
(the job posting lists authentication as a responsibility) without spending hours on
login/signup forms, which would compete with the 7 core mechanics for a limited time
budget. One scene per user (upsert), since the challenge asks to save/reload *the* scene,
not manage multiple named scenes.

**Schema:**
```sql
create table scenes (
  user_id uuid primary key references auth.users(id) on delete cascade,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

alter table scenes enable row level security;

create policy "Users can manage their own scene"
  on scenes for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
```

**Client flow:**
1. On app load: get existing Supabase session, or call `signInAnonymously()` if none —
   silent, no UI.
2. `saveScene()` → upsert `{ user_id: session.user.id, data: pieces, updated_at: now() }`.
3. `loadScene()` → select row for `session.user.id`; hydrate store if found.

**Backend selection:** `persistence/localStorage.ts` and `persistence/supabase.ts`
implement the same save/load interface, per the abstraction in the Folder structure
section. The active backend is chosen by whether Supabase env vars are configured — no
env vars → localStorage, so the app runs and is demoable with zero setup, and Supabase
is a pure additive swap-in once the env is present.

## MCP servers used for implementation guidance

| Server | Status | Purpose |
|---|---|---|
| **pmndrs docs** (`https://docs.pmnd.rs/api/mcp`) | Added | Official docs for React Three Fiber, drei, and Zustand — covers most of the frontend stack in one server |
| **Context7** | Already available | General up-to-date docs lookup (React, Vitest, RTL, Supabase client, etc.) |
| **Supabase official** (`https://mcp.supabase.com/mcp`) | Add when implementing the Supabase step | Create the `scenes` table + RLS policy directly, generate TS types from the live schema, security recommendations. Dev/demo project only — never point at production data. |
| **Vercel official** (`https://mcp.vercel.com`) | Add at deploy time | Inspect/manage the live deployment, read deploy logs |
| **GitHub official** (`github/github-mcp-server`) | Add once the repo exists | Repo/PR management, monitor GitHub Actions runs (relevant to the CI item below) |

Considered and skipped: Three.js DevTools MCP and GLTF→JSX converter MCPs — built for
inspecting live scenes or converting external 3D models; irrelevant since pieces are
primitive geometries only, no GLTF assets involved.

## Package manager

**pnpm.** Faster installs and stricter dependency resolution than npm; CI uses
`pnpm/action-setup` + `actions/setup-node`'s built-in pnpm cache.

## GitHub Actions (CI)

Single sequential job — lint, typecheck, test, build all gate on each other in order.
No parallel/matrix jobs: the project is small enough that splitting them would add CI
config complexity without meaningfully saving time. Storybook/Cypress steps are
deliberately **not** included yet, since both are stretch goals that may not exist by
submission — they get added to this workflow only if/when they actually land, per the
Tooling & testing strategy priority order.

Deployment itself is handled by Vercel's native GitHub integration (auto-deploy on push),
not scripted in Actions — keeps this workflow scoped to quality gates only.

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  quality:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v4
        with:
          version: 9

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: pnpm

      - run: pnpm install --frozen-lockfile
      - run: pnpm lint
      - run: pnpm typecheck
      - run: pnpm test
      - run: pnpm build
```

Matching `package.json` scripts:
```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "lint": "eslint .",
    "typecheck": "tsc --noEmit",
    "test": "vitest run",
    "preview": "vite preview"
  }
}
```

## Deferred (not blocking)

- Performance approach beyond "keep it simple" — instancing/memoization deliberately
  deferred, only revisited if it becomes an actual problem (per `DESIGN.md` bonus
  priority #3). Not required to start scaffolding.

Architecture is settled — ready to scaffold.
