# Proposal

## Why

Zen already holds most of a toolkit for building your own DAW: sixteen live panes that only ask
and read back, a Workspace that lays out tabs of regions and edits them, and the live views
(ONE, Follow, Track, Hands) composed from both. But the surface they share is described three
times: zen's `WorkspaceSpec`, zen's `LiveDocument`, and mix's `SurfaceDocument`, which only mix
can edit (its `SurfaceEditor` and `RegionEditor` repeat what the Workspace already draws). Pane
kinds are closed lists (`PANE_KINDS`, mix's `REGION_KINDS`), and the rule that a pane only draws
what the host tells it is a habit each pane keeps, not a written contract. The aim is a
framework an app composes a complete, customisable DAW from: zen supplies the UI contract, the
components and the hooks, and the app supplies everything else. Mix's rig is the first app that
has to fit, unchanged in what it owns.

## What Changes

- **One surface document, owned by the app.** Zen exports the document shape mix already uses
  (version 1: tabs of rows of region instance ids, each instance naming its `kind`, `title` and
  `binding`) as `SurfaceDocument`, with `kind` an open string. Zen never stores it, saves it,
  or keeps its undo history; it draws the document it is given.
- **Pane definitions from the app.** An app hands the surface its pane kinds as plain data
  (label, description, forms, priority, plate, what it can be bound to). The surface draws each
  instance in a slot the app fills. The sixteen Music live panes become one ready-made set of
  definitions an app may use, extend or ignore.
- **Edits are intents.** Every change a person makes in the surface (choose, add, rename,
  duplicate or remove a tab; add, remove, move, retitle or rebind a region; undo; redo) leaves
  the surface as one typed `SurfaceIntent`, named like mix's `SurfaceStore` methods. The app
  applies it. A pure `applySurfaceIntent(document, intent)` is exported for apps and stories that
  have no store of their own; it holds no state.
- **Zen keeps only visual state.** Edit mode, the region being edited, a drag in progress and
  the palette's open state are kept by the surface unless the app passes them, and each can be
  passed (controlled) when an app tracks it. Nothing zen keeps reaches the document.
- **The host contract, written down.** A pane takes readings (plain data the host sends when
  they change) and a frame reader (values the host samples every frame, such as meters and
  playheads, read only by the leaf parts that draw them), and sends `on<Verb>` intents with one
  argument. A reading the host doesn't give is drawn as missing, never invented.
- **BREAKING (zen only):** `layout/Workspace` takes a `SurfaceDocument` and pane definitions in
  place of `WorkspaceSpec` and `ScreenSpec` tabs, and emits intents in place of `onSpec` and
  `onBinding`. `WorkspaceSpec`, `WorkspaceRegion` and `WorkspaceBinding` are removed; `LiveDocument`,
  `LiveTab` and `LiveRegion` become the shared types. No app imports them today.
- **The reference DAW.** ONE, Follow, Track, Hands and Mine, and the Workspace's own tabs, are
  rewritten as `SurfaceDocument`s on the framework. A story renders a document in mix's exact
  shape, with mix's region kinds, to show mix's rig can be built on it.

## Capabilities

### New Capabilities

- `live-surface-document`: the document an app owns and the surface draws: its shape, its
  version, and how the surface treats an id or kind it doesn't know.
- `live-pane-registry`: how an app defines pane kinds, how they reach the palette, and the
  ready-made Music live set.
- `live-surface-editing`: perform and edit modes, every edit as an intent, the pure applier,
  and the visual state zen keeps.
- `live-host-contract`: what a pane reads, what it asks for, how fast values reach it, and the
  rule that it never invents state.

### Modified Capabilities

- (none)

## Validation

- **Before merging:** `npm run typecheck`; `npx vitest run src/library/live src/library/layout`
  (the applier and document helpers); `npx vitest run src/library/view src/library/tiers.test.ts
  src/library/parity.test.tsx` (the Workspace is a converted component); `npm run build:lib &&
  npm run check:lib` (new public exports); `npm run build:storybook` and every play under
  `Live/` and `Design OS/Layout/Workspace` passing in both renderers; `story-spec sync --change
  live-surface --check` reporting nothing; `openspec validate live-surface --strict`; the PR's
  required `checks` job (main is gated: `pull-request`).
- **While building:** after each task group, `npm run typecheck` and the vitest runs above, so
  the Workspace rewrite and the document helpers never drift apart.
- **Review:** `look`. Once merged, the person opens `Live/Views` and edits Mine into their own
  page, then opens the mix-shaped story and compares it with mix's rig.

## Impact

- Changed: `src/library/layout/Workspace/` (document in, intents out, visual state, its model,
  fixtures, snapshot and stories); `src/library/live/` (gains `surface/` for the document,
  intents, applier and Music live definitions; `views.ts` becomes documents only;
  `LiveSet.story.tsx` applies intents through the applier); `docs/live-views.md`,
  `docs/live-workspace.md`, `src/library/live/README.md`.
- Public entries: `@satoramoto/zen` and `@satoramoto/zen/svelte` export the surface types,
  intents, `applySurfaceIntent` and `musicLivePanes`. Those are framework-free files, so the
  Svelte entry never reaches React through them (`check:lib` holds that).
- Shared files touched in their own first commit: `src/library/index.ts`, `src/library/svelte.ts`,
  `layout/index.ts`, `view/snapshot.test.ts` and the Workspace's tree snapshot.
- Not in this change: mix adopting it (deleting its `SurfaceEditor`, `RegionEditor` and closed
  `REGION_KINDS`) is a follow-up change in `openflowfm/mix`. Zen keeps no document store,
  persistence, undo history, scheduler or engine.
