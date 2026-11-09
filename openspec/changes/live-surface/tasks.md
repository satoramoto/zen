# Tasks

## 1. The contract (framework-free)

- [ ] 1.1 `live/surface/document.ts`: `SurfaceDocument`, `SurfaceTab`, `SurfaceRegion`, `SurfaceBinding`, `SurfaceTarget`; `openTab(doc)` (the first tab when `active` matches none); a type-level test that mix's document shape is assignable
- [ ] 1.2 `live/surface/definitions.ts`: `PaneDefinition`, `surfaceScreen(tab, panes)` (dangling ids skipped, unknown kinds placed with a placeholder form); unit tests
- [ ] 1.3 `live/surface/intents.ts`: `SurfaceIntent` and `applySurfaceIntent(doc, intent, { newId })`; unit tests for every intent and for unknown targets
- [ ] 1.4 `live/surface/frame.ts`: `SurfaceFrame` and the `frame` store, registered in `view/stores.ts`
- [ ] 1.5 `live/surface/music.ts`: `musicLivePanes` from today's `PANE_KINDS`; `views.ts` re-expressed as `SurfaceDocument`s using it

## 2. The Workspace takes a document

- [ ] 2.1 Shared files first, own commit: `layout/index.ts`, `src/library/index.ts`, `src/library/svelte.ts` exports; `view/stores.ts` line for the UI store
- [ ] 2.2 `Workspace.model.ts`: `document`, `panes`, `targets`, `canUndo`, `canRedo`, `onIntent`, the controllable visual state (D4) through `bindSurfaceUi`; placeholder for unknown kinds; tab add, rename, duplicate, remove; region retitle
- [ ] 2.3 Remove `Workspace.edit.ts`'s `ScreenSpec` edits and `WorkspaceSpec`/`WorkspaceRegion`/`WorkspaceBinding`; fixtures re-expressed as documents; tree snapshot re-recorded; tiers and bindings-only baselines hold
- [ ] 2.4 `npm run typecheck`, `npx vitest run src/library/live src/library/layout src/library/view src/library/tiers.test.ts src/library/parity.test.tsx`

## 3. The scenarios

- [ ] 3.1 `npm install` so `story-spec` resolves; Workspace stories as `scenario()`s for `live-surface-document`, `live-pane-registry` and `live-surface-editing`, each played in both renderers
- [ ] 3.2 Host contract scenarios (`live-host-contract`) on the hosted pane stories: no invented state, one intent per gesture, bound targets, drag cut off by removal, frame-driven meters, no frame reader, reduced motion
- [ ] 3.3 `TrackStrips`, `StemDeck`, `OrbitClock`, `LandingDial`, `RigHealth` read the frame for their meters and playheads (D5)
- [ ] 3.4 `Live/Views` applies intents through `applySurfaceIntent`; `Live/Mix rig` story in mix's document shape and kinds
- [ ] 3.5 `story-spec sync --change live-surface`; `story-spec sync --change live-surface --check` reports nothing

## 4. Docs and checks

- [ ] 4.1 `docs/live-views.md`, `docs/live-workspace.md`, `src/library/live/README.md`: the framework as it stands, the app/zen line, the intents
- [ ] 4.2 Every check in the proposal's Validation, with the real output; the surface looked at in a browser at 900 px and narrow, in two packs
- [ ] 4.3 Follow-up noted: an `openflowfm/mix` change that drops its `SurfaceEditor`, `RegionEditor` and closed `REGION_KINDS` and adds `retitleRegion` and positioned `addRegion` to its store
