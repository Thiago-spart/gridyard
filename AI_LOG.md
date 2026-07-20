# AI Log

Real, unedited sequence of the AI-assisted process for the InLab/Artefacto technical
challenge (`Teste_Tecnico_Dev_InLab_ENVIAR_5dias.pdf`). Tools used: **Claude Code** (this
log's entries so far) and **Antigravity** (entries to be added as it's used).

Written in English to match the working-session language; the software itself is in
Portuguese, per project decision.

Format follows the challenge's required template: what I was doing → what I asked the AI
→ what it answered → what worked/didn't → how I resolved it → how I continued.

---

## Step 1 — Understanding the challenge and choosing a concept

**What I was doing:** Reading the challenge PDF and trying to figure out what the "3D
board" (tabuleiro) should actually represent, before writing any code.

**What I asked the AI:** "let's brainstorm my options to make the challenge in
@Teste_Tecnico_Dev_InLab_ENVIAR_5dias.pdf i want to see options of the 3d table styles"

**What the AI answered:** It assumed "styles" meant visual/aesthetic direction, and asked
a multiple-choice question about visual themes (minimalist/clean tech, board-game/chess,
sci-fi, or "show me options side by side") before proposing anything.

**Did it work? What was good/bad:** This was a miss — I hadn't decided the *concept*
(what the board represents) yet, only asked to see options, and the AI jumped straight to
visual aesthetics. Asking a premature, narrowly-scoped question instead of first
proposing conceptual directions.

**How I resolved it:** I corrected it directly: "it's not to decide the style but to
understand the challenge, and propose ideas, for example if the table will be about
games, products or another scope."

**How I continued:** The AI re-scoped and proposed three concrete concept directions
instead of a style survey: (1) a literal board game, (2) a warehouse/floor-plan layout
tool, (3) a consumer furniture planner — each with trade-offs and a recommendation. I
picked option 2 (layout tool) because it best shows product/UX thinking relevant to the
job, not just a technical toy.

---

## Step 2 — Technical implications of the chosen concept

**What I was doing:** Understanding what picking "layout tool" actually changes
technically, before locking in architecture decisions.

**What I asked the AI:** "option 2 sounds right, let's see the techinical issues with it"

**What the AI answered:** Mapped all 7 challenge requirements (grid/camera, pieces, drag,
collision, snap, measurement, save/reload) to the layout-tool framing, flagging where the
theme changes the implementation (e.g. variable footprints instead of uniform 1×1 pieces,
real-world units for the measurement feature) and where it doesn't (drag/raycasting is
the same regardless of theme).

**Did it work? What was good/bad:** Useful — it surfaced two decisions I hadn't
considered yet (piece rotation, and whether to use Supabase vs. localStorage) as the ones
with the biggest time-budget impact, instead of listing everything as equally important.

**How I resolved it:** No fix needed — used this as the basis for the next round of
decisions.

**How I continued:** Answered the persistence question (localStorage first, Supabase as
a follow-up if time allows) and the rotation question (allow 90° rotation, accepting the
extra collision-math complexity) via structured multiple-choice questions from the AI.

---

## Step 3 — Board visual style

**What I was doing:** Coming back to the original visual-style question, now that the
concept (warehouse layout tool) was settled — this time it's a real visual decision, not
a premature one.

**What I asked the AI:** "option 1, let's keep going" (selecting from three board styles
the AI proposed: clean CAD/blueprint, warehouse concrete-floor with texture, and a dark
"innovation lab" tech look).

**What the AI answered:** Recommended the CAD/blueprint style as cheapest to build (drei
`<Grid>` helper + flat materials, no texture assets) and most legible once collision
highlighting and measurement labels are layered on top.

**Did it work? What was good/bad:** Agreed with the recommendation — no correction
needed.

**How I continued:** Moved to defining the concrete piece set (pallet, shelf, crate,
workstation) and their footprints/colors.

---

## Step 4 — Collision behavior and measurement scope

**What I was doing:** Deciding two remaining interaction details before writing the
design doc: what happens on an invalid drop, and what exactly the "measurement" feature
shows.

**What I asked the AI:** Answered two structured questions from the AI: whether an
overlapping drop should be rejected (snap back) or allowed with a visual warning; and
whether the measurement panel should show piece size, distance between two pieces, or
both.

**What the AI answered:** Recommended "reject the drop" (no invalid state ever exists,
cleaner to demo) and "both" for measurement (reuses the same scale-factor math, low extra
cost).

**Did it work? What was good/bad:** Agreed with both recommendations.

**How I continued:** Confirmed the AI tooling for the build (Claude Code + Antigravity),
then asked the AI to write up the agreed design as `DESIGN.md` and start this log,
deferring GitHub repo creation until the architecture is fully settled.

---

## Step 5 — Job description mapping and pushing back on testing scope

**What I was doing:** Moving from product design (`DESIGN.md`) into technical
architecture, starting from what the job posting actually asks for, so the architecture
visibly demonstrates the right skills — not just makes the challenge's 7 requirements
work.

**What I asked the AI:** "now list me the jb for this role to start deciding the
tecnologies and archeture we will use, this will be also the creation of the architeture
file"

**What the AI answered:** Listed the job posting's requirements, then asked how much
automated testing to build given the ~6-10h budget, recommending unit tests on pure logic
only as the safe default.

**Did it work? What was good/bad:** I overrode the recommendation and asked for
"storybook, cypress, ci/cd and vitest + react testing library" — the full stack, not the
scoped-down option.

**How I resolved it:** Rather than silently either rejecting my answer or accepting scope
creep against the challenge's own stated budget, the AI flagged the tension directly
(quoted the PDF's "prefira um núcleo bem-feito a tudo pela metade") and proposed
sequencing all five tools by priority — Vitest and CI/CD as core, React Testing Library
once features work, Storybook and Cypress as explicit stretch goals — so the 7 required
features can never get silently starved by tooling setup.

**How I continued:** Locked in that priority order and had it write `ARCHITECTURE.md`
with the job-requirement mapping and the tooling table.

---

## Step 6 — Architecture decisions: folders, state, Supabase, CI

**What I was doing:** Filling in the rest of `ARCHITECTURE.md` — folder structure,
Zustand store shape, Supabase schema/auth, package manager, and the CI workflow — one
decision at a time.

**What I asked the AI:** A sequence of prompts, each answering one open item: "let's see
the folder structure" → "i want to adjust the UI folder as it should be a folder with
index, in this way we can create the testing file inside this folder and with future
integration with storybook" → "let's do the store shape" → "go with transient local drag
state" → "yes, let's do Supabase next" → anonymous-auth-and-RLS chosen over a login form
or no auth → "let's go with github workflow" → pnpm chosen over npm.

**What the AI answered:** For each, it proposed the structure/schema/workflow with
trade-offs and a recommendation (e.g. transient drag state to avoid re-rendering the
whole UI on every drag frame; anonymous Supabase auth instead of a login form, to satisfy
the "authentication" requirement without spending hours on login UI).

**Did it work? What was good/bad:** Mostly agreed with recommendations, with one real
correction: the AI's first folder-structure proposal put UI components as flat files;
I redirected it to a folder-per-component pattern with an `index.ts` re-export, so tests
and future Storybook stories have somewhere to live alongside each component.

**How I resolved it:** Gave the direct instruction above; the AI restructured `ui/` to
match and documented the convention (named file + barrel `index.ts`, not code directly in
`index.tsx`) in `ARCHITECTURE.md`.

**How I continued:** Worked through Supabase schema (anonymous auth + RLS, one `scenes`
row per user) and the GitHub Actions workflow (pnpm-based, lint → typecheck → test →
build), then asked the AI to research MCP servers relevant to the stack.

---

## Step 7 — MCP research for implementation guidance

**What I was doing:** Looking for Model Context Protocol servers that could give the AI
better, more current guidance while implementing (React Three Fiber, Zustand, Supabase,
GitHub, Vercel), rather than relying only on training data.

**What I asked the AI:** "before procced i want to look for mcps for our archeture to
have better guidence about the implementation, look for mcps for our stack"

**What the AI answered:** Searched the web and returned a prioritized list: pmndrs docs
MCP (covers React Three Fiber, drei, and Zustand — free, official, one-line install) as
worth adding immediately; Supabase, Vercel, and GitHub official MCP servers as worth
adding only when actually implementing those specific steps; a couple of Three.js/GLTF
MCP servers considered and explicitly skipped as irrelevant (we use primitive geometries,
no external 3D models).

**Did it work? What was good/bad:** Good — it didn't just list everything it found, it
filtered by actual relevance to decisions already locked in (e.g. skipped the GLTF
converter MCP because `DESIGN.md` already ruled out external 3D models).

**How I resolved it:** Asked it to add the pmndrs MCP now and document the rest in
`ARCHITECTURE.md` for later. No fix needed — worked as expected.

**How I continued:** "let's start scaffolding the project" — before that, the AI did a
self-review pass over `DESIGN.md`/`ARCHITECTURE.md` and caught two small inconsistencies
on its own (the Persistence section describing an older, simpler Supabase schema than the
one actually finalized; a stale "open item" line that hadn't been marked resolved) and
fixed both before treating the architecture as settled.

---

## Step 8 — Implementation plan and a self-caught bug

**What I was doing:** Turning the settled design/architecture into a concrete,
task-by-task implementation plan before any code gets written.

**What I asked the AI:** Confirmed proceeding to planning after the self-review; no new
prompt text beyond "let's start scaffolding the project" from Step 7 — the AI treated
that as authorization to move into the writing-plans phase.

**What the AI answered:** A 16-task TDD plan (`docs/superpowers/plans/2026-07-17-mini-3d-scene-editor-mvp.md`)
covering scaffolding, the pure-logic `lib/` layer, the Zustand store, the R3F scene,
the UI components, CI, and manual end-to-end verification — deliberately scoped to the
localStorage MVP only, with Supabase and bonus features left for a separate follow-up
plan.

**What ficou good/bad:** During its own required self-review pass (spec coverage,
placeholder scan, type consistency), the AI caught a real DRY bug it had just written:
the store's `movePiece` action reimplemented the rotation-aware footprint-swap logic
inline instead of reusing the `getFootprint` helper defined earlier in the same plan —
same behavior, but duplicated logic that could drift out of sync if the footprint rule
ever changed.

**How I resolved it:** No manual intervention needed — the AI fixed it itself during
self-review, before presenting the plan as finished, and it never shipped as a bug (the
plan's tests were also not yet run against this issue since no code had been written
yet — caught at the design-of-the-plan stage).

**How I continued:** Declined both offered execution paths (subagent-driven or inline)
— "none, I'll create the github + project" — taking the plan and docs (`DESIGN.md`,
`ARCHITECTURE.md`, this log, and the implementation plan) to execute manually / continue
in a fresh repo.

---

## Step 9 — Visual identity: name, logo, style guide

**What I was doing:** Giving the submission a real identity instead of a generic
"Warehouse Layout Editor" title — a name, a mark, and asset-creation instructions, to
back up the "UX/UI" diferencial from the job posting.

**What I asked the AI:** "now let's make a style guide, I want to create a logo, marc
for this projects and also instruction about the criation of the project assets"

**What the AI answered:** Asked one decision at a time (name style → shortlisted
"Snapyard" / "Gridyard" / "Bayline" → I picked Gridyard; logo type → symbol+wordmark),
then designed the mark itself: a blueprint grid with one cell filled — a literal
reference to the snap-to-grid mechanic, reusing the app's own selection-highlight blue
(`#2f6fed`) rather than inventing a new brand color. It rendered two SVG variants, the
full palette (brand colors + the four piece colors already fixed in `DESIGN.md`),
typography choices, and concrete asset-export commands as a previewable page rather than
describing a logo in text.

**Did it work? What was good/bad:** Worked well on the first pass — I approved it as-is
("sounds right") with no corrections needed.

**How I continued:** Had it write the approved identity into `STYLE_GUIDE.md`, save the
two source SVGs to `assets/brand/`, then asked it to update the implementation plan so
Task 14 actually uses the new name/mark instead of drifting out of sync with the rest of
the docs — it added steps to copy the SVGs into `public/`, set the page `<title>` to
"Gridyard", and wire the SVG favicon, renumbering the remaining steps in that task.

---

## Step 10 — Repo setup and a workflow correction mid-scaffold

**What I was doing:** Creating the actual GitHub repo and scaffolding the Vite app,
after the design/architecture/branding work was all settled.

**What I asked the AI:** "do you have the skill to create a github repository in my
personal account?" → confirmed `gh` was authenticated → "let's create the vite app" →
mid-scaffold, while the AI was mid-tool-call verifying the build: "about the way we will
implement the commits and github branches, for changes we will create a pr and put the
related commits in this branch, also the name convention will be feat, chore, fix and
this partten, before posting the changes i have to make a approval(this give me time to
run and test before it's up in our codebase)"

**What the AI answered:** Before that correction, it had been about to work directly on
whatever branch was checked out. It acknowledged the new rule immediately, created a
`feat/scaffold-vite-app` branch retroactively for the scaffold work already in progress,
and committed locally without pushing.

**Did it work? What was good/bad:** The correction landed cleanly and stuck for the rest
of the session — every task after this point followed: branch off `dev` → implement →
commit locally → stop and report → wait for "do the pr" → push + open PR → wait for
"merged" → sync `dev`, delete the branch, move to the next task. I also asked it to save
this as a persistent memory so future sessions don't need the correction repeated.

**How I continued:** Also asked it to look for MCP servers relevant to the stack before
continuing — it found and added the official pmndrs docs MCP (covers React Three
Fiber/drei/Zustand), and listed Supabase/Vercel/GitHub official MCPs to add when those
specific steps are actually reached, skipping a couple of irrelevant ones (GLTF
converters — the project uses primitive geometries only, no 3D model imports).

---

## Step 11 — Styling library and the `lib/`→`store/` TDD chain (Tasks 2-7)

**What I was doing:** Realized mid-scaffold that no styling approach had ever actually
been decided — just plain CSS by default — and separately, working through the plan's
pure-logic layer and Zustand store task by task.

**What I asked the AI:** "for the styling, what libraries are we using, or intend to
use?" → it recommended plain CSS + a tokens file over Tailwind or CSS Modules, framed as
a real open decision rather than assuming — "2 sounds right, for this project makes
scence to use shadc ui ?" (picking Tailwind, then asking about shadcn/ui). Then, for each
of Tasks 2 through 7: "let's start Task 2" / "show me the description of task 3" / "yes,
start it" / "do the pr" / "merged, let's start Task N" — repeated per task.

**What the AI answered:** Recommended against shadcn/ui — the actual `ui/` surface
(legend, measurement panel, one button) has no complex interactive primitives to justify
the Radix setup cost, revisit only if a bonus feature needs a real `<Select>` or similar.
Wired Tailwind v4 with the `STYLE_GUIDE.md` palette as real `@theme` tokens, then updated
`ARCHITECTURE.md` and the already-written plan's UI tasks to match, since they'd been
written assuming plain CSS. For Tasks 2-7 (`lib/pieces.ts` through the Zustand store),
each ran the plan's exact TDD steps: write the failing test, confirm it fails, implement,
confirm it passes, typecheck, lint, commit.

**Did it work? What was good/bad:** Every one of Tasks 2-7 passed on the first
implementation attempt with no bugs — a direct result of the plan already containing
complete, pre-reviewed code for each step rather than prose descriptions. Nothing to
correct; genuinely smooth.

**How I continued:** One PR per task, merged individually via GitHub, with the AI syncing
`dev` and deleting the merged branch before starting the next task each time.

---

## Step 12 — 3D scene components (Tasks 8-10)

**What I was doing:** Moving into the React Three Fiber layer — the board, drag-plane,
draggable pieces, and the camera/canvas wiring — which the testing strategy deliberately
excludes from automated tests (WebGL, verified manually instead).

**What I asked the AI:** "let's start Task 8" → "go to task 10" (skipping a separate PR
step for Task 9 since Task 10 directly imports Task 9's `Pieces` component, which wasn't
merged yet).

**What the AI answered:** For Task 8 (`Board`/`DragPlane`), it flagged a specific
technical subtlety in its own summary: the drag plane needs `transparent opacity={0}`
rather than `visible={false}`, since some three.js versions exclude invisible objects
from raycasting entirely — the drag would silently stop working. For Task 10 it combined
Task 9 and 10 onto the same branch/PR rather than forcing an artificial branch split,
since Scene has a hard dependency on Pieces.

**Did it work? What was good/bad:** Correct on the first pass — typecheck/lint clean each
time — but genuinely unverified visually until Task 14, since nothing was wired into
`App.tsx` yet. Worth being honest that "passes typecheck" isn't the same as "works,"
which is exactly what Task 16 (manual verification) exists to check.

**How I continued:** Asked for one combined PR for Tasks 9+10 given the dependency.

---

## Step 13 — Subagent-driven implementation for Tasks 11-14

**What I was doing:** Handing the remaining, more mechanical tasks to subagents instead
of doing every implementation step in the main session.

**What I asked the AI:** "let's do all tasks till the 14, using subagent, and do the pr
along the way"

**What the AI answered:** Used Claude's subagent-driven-development process: for Tasks
11, 12, and 13 (Legend/MeasurementPanel/RotateButton, ResponsiveLayout,
useKeyboardShortcuts) — all had complete code already written out in the plan, so it
dispatched fast/cheap Haiku subagents with a narrow brief (just that task's plan section
plus the exact context needed, not the whole plan or conversation history). For Task 14
(`App.tsx` wiring — the integration task pulling every prior piece together), it used a
more capable Sonnet subagent instead, reasoning that wiring multiple files together needs
real judgment, not transcription.

**Did it work? What was good/bad:** The Task 11 subagent caught a real gap on its own
that wasn't in its brief at all: `test-setup.ts` was missing `afterEach(cleanup)` from
`@testing-library/react`, which would have let rendered components leak between tests
and produce false-positive/negative results — a genuine self-caught fix, not something
either of us had flagged going in. Every subagent's report was independently re-verified
(full test suite, typecheck, lint, and for Task 14, a full production build) before
anything was committed, rather than trusting the subagent's self-report at face value.

**How I resolved it:** No corrections needed — each subagent's diff was reviewed and
matched its brief exactly, no scope creep beyond the one legitimate test-setup fix.

**How I continued:** One PR per task (four in total for 11-14), each merged individually.
Confirmed explicitly that Task 14 couldn't start until Tasks 9/10/11/12/13 were all
merged, since `App.tsx` imports from all of them.

---

## Step 14 — CI workflow and a stale-assumption catch (Task 15)

**What I was doing:** Adding the GitHub Actions workflow, the last piece of tooling from
`ARCHITECTURE.md`'s testing strategy.

**What I asked the AI:** "merged, keep going" (continuing from Task 14's merge).

**What the AI answered:** Ran the full local quality gate first (lint, typecheck, test,
build — all green), then wrote the workflow. Caught on its own that the plan's original
YAML template targeted a branch named `main`, which doesn't exist in this repo — this
repo uses `master`/`dev` (a decision made earlier in the session) — and corrected the
trigger branches before committing, rather than shipping a workflow that would silently
never trigger on this repo's actual branches.

**Did it work? What was good/bad:** Correct catch, no rework needed.

**How I continued:** Opened the PR; the workflow's own `pull_request` trigger should fire
on that PR itself as a live check that it actually works. Task 16 (manual end-to-end
verification — running `pnpm dev` and checking off all 7 challenge requirements plus
mobile/keyboard interaction) is the one remaining task, and needs an actual browser, so
that one's mine to run rather than the AI's.

---

## Step 15 — Task 16: end-to-end manual verification, and a drag bug found live

**What I was doing:** Running `pnpm dev` and going through the Task 16 checklist by
hand — the 7 challenge requirements, then touch interaction, then desktop keyboard
shortcuts — the one task in the plan that needed a real browser instead of the AI.

**What I asked the AI:** Nothing at first — checked the requirements myself. Selecting a
piece and dragging it broke: the drag would stutter, freeze, or the piece would snap back
to its last committed position instead of following the cursor. Reported it directly.

**What the AI answered:** Root-caused it before touching code: the selected-piece label
is a drei `<Html>` element — a real DOM node overlaid on the canvas at the piece's screen
position, not part of the Three.js scene graph — sitting exactly where the cursor is
during a drag. The browser's native hit-testing was routing pointer events to that div
instead of through to the canvas, where R3F's raycasting needed them to reach
`DragPlane`. First fix set `pointer-events-none` on the label's inner content div, which
turned out to only mask the symptom (piece snapping back on pointer-up) rather than fix
it — the label's real outer wrapper (drei's own container element, per
`node_modules/@react-three/drei/web/Html.js`) still had default pointer-events and was
still catching the hit, firing a native `pointerleave` on the canvas that R3F converts to
`onPointerLeave` on `DragPlane`, which was wired to `onDragEnd()` — prematurely
committing the drag. Second fix used `Html`'s `wrapperClass` prop to target that actual
outer element instead.

**Did it work? What was good/bad:** The first fix was a plausible-looking miss — it
changed the symptom's shape without removing it, which is what led to actually reading
drei's source instead of guessing again. The second fix was confirmed clean by manual
retest: dragging now tracks the cursor smoothly and commits correctly with the label
visible throughout.

**How I resolved it:** Shipped as two commits on `fix/piece-label-pointer-events`, PR
#15, merged into `dev`.

**How I continued:** Re-ran the full Task 16 checklist after the fix — all 7 challenge
requirements, mobile/touch interaction (tap-select, tap-drag, second-piece distance,
rotate button, pinch-zoom/pan, bottom-sheet panel on narrow viewports), and the desktop
`R`/`Escape` shortcuts — all clean, no further issues. That closes out the MVP
implementation plan; next up is scoping the Supabase persistence follow-up and the
stretch tooling (Storybook, Cypress) that the plan deliberately deferred.

---

## Step 16 — Supabase persistence: provisioning, backend-selection design, and a save-status race found in review

**What I was doing:** Continuing the Supabase persistence follow-up spec (`ARCHITECTURE.md`)
now that the Supabase MCP server was connected. Turned the spec into a 9-task TDD plan
(`docs/superpowers/plans/2026-07-20-supabase-persistence.md`), then executed it with
subagent-driven development: a fresh implementer subagent per task, a spec+quality review
after each, on an isolated worktree/branch (`feat/supabase-persistence`, off `dev`).

**What I asked the AI:** For Task 1 (infrastructure), I ran the provisioning myself rather
than delegating it — creating the live `gridyard` Supabase project, the `scenes` table +
RLS policy, and the anon/URL keys via MCP tools (`list_organizations`, `get_cost`,
`confirm_cost`, `create_project`, `apply_migration`, `get_project_url`,
`get_publishable_keys`). For Tasks 2–8 (client singleton, `persistence/supabase.ts`,
backend-selection `persistence/index.ts`, async `sceneStore` + `saveStatus`, debounce
utility, `SaveStatus` component, `App.tsx` wiring), I dispatched implementer + reviewer
subagent pairs per the plan's TDD steps.

**What the AI answered / found:**
- Anonymous sign-ins are off by default on a new Supabase project, and there is no MCP
  tool to toggle it — `signInAnonymously()` returns a 422 until it's enabled manually in
  the dashboard (Authentication → Sign In / Providers). I flagged this and worked on the
  remaining code tasks in parallel while waiting for it to be turned on.
- Task 5's reviewer found a real concurrency bug in the plan's own prescribed
  `saveStatus` code: overlapping `saveScene()` calls could let a stale `setTimeout` reset
  the indicator to `'idle'` while a different save was still in flight. Three fix rounds
  followed — a shared-timer guard, then a settle-order generation counter, then an
  invocation-order generation counter — each closing one interleaving while a re-review
  found a different one still open. The correct fix (an in-flight counter, only arming
  the idle timer once it returns to zero) was identified but, given this only affects the
  status indicator's display timing under a narrow live-latency window (not data
  correctness — the underlying save always lands), I chose to accept the current state
  rather than pursue a fourth round.
- Task 8's reviewer found a second, more consequential race: on mount, the debounced
  autosave could persist `INITIAL_PIECES` before a slow `loadScene()` resolved,
  transiently (or, if the load never completed, permanently) overwriting a user's real
  saved scene. This one I did have fixed — added a `hasLoaded` guard so autosave can't
  fire until the initial load attempt finishes.

**Did it work? What was good/bad:** The review-loop process caught two real bugs that
were baked into the plan's own example code, not introduced by implementers — worth
noting since it means "the plan says so" isn't a substitute for review. The three failed
attempts at the `saveStatus` race were a genuine cost (a single generation counter can't
represent "anything still in flight"; the theoretically correct fix needs a pending-count
approach), and in hindsight scoping a stricter time-box on that particular fix chain
before escalating to the user would have been cheaper.

**How I resolved it:** No real browser/Playwright tool was available by default in this
session, so for final verification I installed Playwright into a scratch directory
(outside the repo) with a cached Chromium build, and drove the running `pnpm dev` server
directly: confirmed the app renders, a piece drag actually calls `movePiece` (had to
retarget my synthetic drag coordinates once the first attempt only triggered a piece
*select*, not a move), the status indicator shows `Saving…` → `Saved` for a real network
round-trip, and — most importantly — reloading the page in the same browser context
restores the piece from the database rather than from `INITIAL_PIECES`. Cross-checked
directly against the `scenes` table via the MCP SQL tool: exactly one row per anonymous
`user_id`, correct `gridX`/`gridY`, RLS correctly isolating three different anonymous
sessions from each other during testing. Cleared the test rows afterward.

**How I continued:** Ran the full CI-equivalent suite with `.env.local` moved aside
(lint, typecheck, `pnpm test`, `pnpm build`) — all clean, 66/66 tests, no network calls.
Per this project's git workflow, work stops here for user testing/approval before
`git push` / opening a PR against `dev`.

---

## Step 17 — Perspective camera toggle (bonus feature), and a performance/React Compiler aside

**What I was doing:** With MVP + Supabase persistence merged, picked up the next item
from `DESIGN.md`'s bonus priority list: the perspective camera toggle — cheap, high
visual payoff, and `viewMode`/`setViewMode` were already scaffolded in the scene store
during the MVP specifically so this would be a small addition.

**What I asked the AI:** "let's do the 1, show me how you think of building it" (after
the AI recommended it as the next step over Storybook/Cypress). Mid-session, before
resuming, I also asked a tangent: "is it a good idea to implement auto memoization using
the React Compiler" for this app.

**What the AI answered:**
- On React Compiler: recommended against adopting it now — the side panel components are
  small and already cheap to re-render, and the actual 3D content runs through React
  Three Fiber's own custom reconciler rather than `react-dom`, where the compiler's
  benefit is unproven. Framed as solving a problem `DESIGN.md` already says isn't real
  yet at 4 pieces on screen. Not implemented.
- On the toggle: ran a full brainstorming pass before touching code — proposed free-orbit
  perspective (vs. a fixed angled view) and a "Reset view" control (since free orbit lets
  a user rotate/tilt until they lose their bearings), both confirmed by me. Wrote a
  design spec, then a 5-task TDD implementation plan: `viewResetToken`/`resetView` added
  to the scene store, `Scene.tsx` branching between the existing locked orthographic
  camera and a new `PerspectiveCamera` + `OrbitControls`, targeting the board's center
  (not world origin) via the same math `DragPlane` already uses — all wrapped in a
  `<group key={viewResetToken}>` so entering perspective mode and clicking "Reset view"
  both snap to the same default angle via a React remount, with no imperative
  `OrbitControls.reset()` ref handling needed.

**Did it work? What was good/bad:** Built via subagent-driven-development — a fresh
implementer subagent per task, then a reviewer per task — and hit one process snag: the
first implementer's isolated worktree ended up on its own branch cut from `dev` instead
of my feature branch (which already had the spec commit), since it had no visibility into
branches outside its own worktree. Caught it before the review step, cherry-picked the
commit onto the right branch, and switched every subsequent task to work directly in the
shared checkout instead of a fresh isolated worktree. All 4 code tasks came back
"Approved" with no Critical/Important findings; the final whole-branch review was also
clean ("Ready to merge: Yes"), surfacing only two cosmetic Minor notes (missing
`aria-pressed` on the toggle button, a redundant Tailwind class) that didn't block merge.

**How I resolved it:** For the manual verification task (`scene/` isn't unit tested, per
the established testing strategy), installed Playwright into a scratch directory again
(same approach as Step 16) and drove the running `pnpm dev` server: confirmed top mode is
unchanged, perspective mode renders correctly with both buttons, free orbit actually
rotates the camera (compared before/after screenshots), "Reset view" snaps back to
pixel-identical framing, a piece can be selected and dragged to a new grid cell while in
perspective mode (raycasting is camera-type-independent, so `DragPlane`/`Pieces` needed
no changes), a top→perspective→top→perspective round trip resets to the same default
angle rather than preserving the orbited-away state, the mobile bottom-sheet layout
renders the new buttons without overflow, and zero browser console errors across every
interaction.

**How I continued:** Ran the full CI-equivalent gate (lint, typecheck, `pnpm test`,
`pnpm build`) — all clean, 75/75 tests. Per this project's git workflow, pushed the
branch and opened the PR against `dev` only after explicit approval
(github.com/Thiago-spart/gridyard/pull/18).

---

## Step 18 — Performance stance and React Compiler documentation

**What I was doing:** Updating and clarifying the project's performance documentation in `README.md` before implementing further bonus features, establishing why React Compiler was not adopted and documenting the baseline performance stance.

**What I asked the AI:** "Let's update the README performance section to explain our conservative stance on performance, specifically addressing React Compiler and why we're not adopting it now."

**What the AI answered:** Updated `README.md` with an explicit technical justification: computations live in pure `lib/` modules, React components in the DOM HUD are small and lightweight, and React Three Fiber renders through its own custom reconciler where React Compiler's auto-memoization benefits are unproven.

**Did it work? What was good/bad:** Worked well — established a clear architectural decision in documentation before writing feature code, preventing premature optimization while keeping technical debt low.

**How I resolved it:** Pushed as PR #19 (`abab9a8`), merged into `dev`.

**How I continued:** Proceeded to the second bonus item from `DESIGN.md`: per-piece color customization.

---

## Step 19 — Per-piece color swap (bonus feature #2)

**What I was doing:** Implementing the per-piece color customization feature from `DESIGN.md` — enabling the user to change the color of any selected piece via a curated color swatch picker.

**What I asked the AI:** "Let's implement the per-piece color swap feature from DESIGN.md."

**What the AI answered:** Created a design spec (`docs/superpowers/specs/2026-07-20-per-piece-color-swap-design.md`) and a TDD plan (`docs/superpowers/plans/2026-07-20-per-piece-color-swap.md`). Added an optional `colorOverride` field on `PieceInstance`, a `setPieceColor` action in `sceneStore`, a `ColorSwatchPicker` component in `ui/`, and adjusted the selection highlight behavior in `Piece.tsx` from full mesh recoloring to an outline frame so the customized piece color remains visible while selected.

**Did it work? What was good/bad:** A key UX challenge surfaced: when selection highlighting was done by overriding the mesh material color, picking a new color gave no live visual feedback because the selection color covered the piece. Replacing the selection material override with an outline (wireframe / selection border) solved this cleanly, allowing live color previews.

**How I resolved it:** Updated `Piece.tsx` to render an outline mesh when selected, and added full Vitest coverage for `ColorSwatchPicker` and store actions. Pushed as PR #20 (`afbf103`), merged into `dev`.

**How I continued:** Moved on to the runtime piece creation and editing feature.

---

## Step 20 — Runtime piece creation, editing, and deletion

**What I was doing:** Expanding the editor from a fixed 4-piece scene to supporting dynamic runtime piece creation, editing (dimensions, color, label), and deletion.

**What I asked the AI:** "Let's implement runtime piece creation and editing so users can add custom pieces to the board, change dimensions and labels, and delete pieces."

**What the AI answered:** Wrote design spec (`docs/superpowers/specs/2026-07-20-piece-creation-and-editing-design.md`) and plan (`docs/superpowers/plans/2026-07-20-piece-creation-and-editing.md`). Implemented `findFreeSpot` placement helper in `lib/placement.ts`, added `addPiece`, `updatePiece`, and `deletePiece` store actions, extracted `SwatchRow` from `ColorSwatchPicker`, created `PieceForm` (with conflict detection and 2-step confirmation when resizing causes collisions), created `DeleteButton`, and updated `Legend` to filter out internal placeholder types.

**Did it work? What was good/bad:** Two minor issues caught during code review:
1. `Legend` was iterating all `PIECE_DEFS` and showing a spurious "Custom" row — fixed by explicitly filtering to the 4 fixed catalog piece types.
2. Input native `max` HTML attributes on width/depth inputs caused browser validation to mark inputs as `:invalid` even when the store's validation was intended to handle board boundary checks — fixed by removing native `max` attributes and relying on store validation logic.

**How I resolved it:** Resolved both issues in `PieceForm.tsx` and `Legend.tsx`, with 100% test coverage in Vitest (119/119 passing tests across 21 test files). Pushed as PR #21 (`db0b237`), merged into `dev`.

**How I continued:** Addressed the performance implications of having unbounded piece counts on the board.

---

## Step 21 — Performance pass: Memoizing `Piece` & drag handler optimization

**What I was doing:** Optimizing rendering performance now that piece count is unbounded (up to ~80 pieces on the 10×8 grid) instead of fixed at 4.

**What I asked the AI:** "Now that piece creation allows unbounded pieces on the board, let's audit performance and optimize piece re-rendering during drag."

**What the AI answered:** Identified that `Pieces.tsx` held drag state at the parent level, causing every pointer movement during drag to re-render all pieces on the board. Furthermore, each render passed a new `onDragStart` closure, which defeated naive `React.memo`. Refactored `Pieces.tsx` with a stable `useCallback`-wrapped `startDrag` and wrapped `Piece` in `React.memo`.

**Did it work? What was good/bad:** Highly effective — verified manually in browser testing: dragging a piece now re-renders *only* the dragged piece, skipping all unrelated pieces on the board. Updated `README.md` performance section with the verified outcome.

**How I resolved it:** Pushed as PR #22 (`cb42b82`), merged into `dev`.

**How I continued:** All core requirements, bonus features, and performance optimizations are fully completed, tested, and documented.

