# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## Performance

Performance work here is deliberately conservative: `DESIGN.md` lists a performance pass
(instancing/memoization) as the lowest-priority bonus item, and `ARCHITECTURE.md`
explicitly defers it — "only revisited if it becomes an actual problem," not something
to build in speculatively. The reasoning:

- **Scene scale is small and fixed.** The challenge spec fixes the scene at 4 piece
  types, spawned once, with no add/remove UI — draw calls and re-render cost are already
  trivial at that scale. Instancing (drei's `<Instances>`) would only start paying for
  itself at dozens of pieces with shared geometry, which isn't this app.
- **The actual computation lives in `lib/`, not the render loop.** Collision detection,
  grid snapping, and measurement formatting are pure, framework-free functions (covered
  by Vitest), not per-frame Three.js work — so render-loop optimization wouldn't target
  where the logic actually runs.
- **React Compiler is not enabled.** Its benefit is auto-memoizing complex `react-dom`
  render trees; the panel components here (`Legend`, `MeasurementPanel`, `SaveStatus`,
  `RotateButton`, `ViewToggle`) are small and already cheap to re-render, and the 3D
  content renders through React Three Fiber's own custom reconciler rather than
  `react-dom`, where the compiler's benefit with this stack is unproven. Adopting it now
  would add a Babel-plugin + ESLint-plugin dependency to solve a problem that isn't
  measured. See `AI_LOG.md` Step 17 for the fuller discussion.

If profiling ever surfaces an actual frame-rate or re-render problem, that's the trigger
to revisit this — not before.

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])

```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])

```

## Supabase Setup

Persistence uses Supabase (anonymous auth + RLS) when configured, and falls back to
`localStorage` with zero setup otherwise — see `ARCHITECTURE.md`'s "Supabase
(persistence follow-up)" section for the full design.

To run against a real Supabase project locally:

1. Create a project at [supabase.com](https://supabase.com) (or use the one already
   provisioned for this repo).
2. In the dashboard, go to Project Settings → API and copy the **Project URL** and
   **anon public** key.
3. Copy `.env.example` to `.env.local` and paste those two values in.
4. Restart `pnpm dev` if it was already running (Vite only reads `.env.local` at
   startup).

Without `.env.local`, the app runs entirely on `localStorage` — this is the default
for CI and for anyone cloning the repo without Supabase credentials.
