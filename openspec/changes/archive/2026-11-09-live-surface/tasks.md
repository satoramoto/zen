# Tasks

## 1. The contract (framework-free)

- [x] 1.1 `layout/Workspace/Workspace.types.ts`: `SurfaceDocument`, `SurfaceTab`, `SurfaceRegion`, `SurfaceBinding`, `SurfaceTarget`; `openTab(doc)` (the first tab when `active` matches none); a type-level test that mix's document shape is assignable
- [x] 1.2 `layout/Workspace/surface.ts`: `PaneDefinition`, `surfaceScreen(tab, panes)` (dangling ids skipped, unknown kinds placed with a placeholder form); unit tests
- [x] 1.3 `layout/Workspace/surface.ts`: `SurfaceIntent` and `applySurfaceIntent(doc, intent, { newId })`; unit tests for every intent and for unknown targets
- [x] 1.4 `Music/live/live.model.ts`: `LiveFrame` (beat, position, levels), read through the Music family's existing frame stores (`mixer/frames.bind.ts`)
- [x] 1.5 `Music/live/panes.ts`: `livePanes` from today's `PANE_KINDS`; `views.ts` re-expressed as `SurfaceDocument`s using it

## 2. The Workspace takes a document

- [x] 2.1 Shared files first, own commit: `layout/index.ts`, `src/library/svelte.ts`, `Music/index.ts`, `Music/svelte.ts` exports (visual state is view state, so no store line)
- [x] 2.2 `Workspace.model.ts`: `document`, `panes`, `targets`, `canUndo`, `canRedo`, `onIntent`, the controllable visual state (D4) as view state; placeholder for unknown kinds; tab add, rename, duplicate, remove; region retitle
- [x] 2.3 Remove `Workspace.edit.ts`'s `ScreenSpec` edits and `WorkspaceSpec`/`WorkspaceRegion`/`WorkspaceBinding`; fixtures re-expressed as documents; tiers and bindings-only baselines hold (the Workspace had no tree snapshot)
- [x] 2.4 `npm run typecheck`, `npx vitest run src/library/live src/library/layout src/library/view src/library/tiers.test.ts src/library/parity.test.tsx`

## 3. The scenarios

- [x] 3.1 `npm install` so `story-spec` resolves; Workspace stories as `scenario()`s for `live-surface-document`, `live-pane-registry` and `live-surface-editing`, each played in both renderers
- [x] 3.2 Host contract scenarios (`live-host-contract`, `Live/Host contract`): no invented state, one intent per gesture, bound targets, drag cut off by removal, frame-driven meters, no frame reader and no measurement
- [x] 3.3 `TrackStrips` (meters) and `StemDeck` (playhead) read the frame (D5); `OrbitClock`, `LandingDial`, `ProgressionStrip` keep `beat` for now
- [x] 3.4 `Live/Views` applies intents through `applySurfaceIntent`; mix's default document, kinds and store methods drawn and edited in `Design OS/Layout/Workspace/Document` (Mix's default document)
- [x] 3.5 `story-spec sync --change live-surface`; `story-spec sync --change live-surface --check` reports nothing

## 4. Docs and checks

- [x] 4.1 `docs/live-views.md`, `docs/live-workspace.md`, `src/library/live/README.md`: the framework as it stands, the app/zen line, the intents
- [x] 4.2 Every check in the proposal's Validation, with the real output; the surface looked at in a browser at 900 px and narrow, in two packs
- [x] 4.3 Follow-up noted: an `openflowfm/mix` change that drops its `SurfaceEditor`, `RegionEditor` and closed `REGION_KINDS` and adds `retitleRegion` and positioned `addRegion` to its store
