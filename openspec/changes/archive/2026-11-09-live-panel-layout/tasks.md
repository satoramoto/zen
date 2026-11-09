# Tasks

## 1. The document and its applier (framework-free)

- [x] 1.1 `Workspace.types.ts`: `LayoutNode`, `SplitNode`, `SurfaceTabV2`, `SurfaceDocumentV2`, region `settings`, `SettingSpec`, `DockZone`; the new and changed intents (D2)
- [x] 1.2 `surface.ts`: `readDocument` (v1 → v2 reading, deterministic split ids), `tabLeaves`, `formForRoom`, `resolveSettings`; unit tests (mix's v1 document reads as before)
- [x] 1.3 The applier: `resizeSplit`, `dockRegion` (collapse, merge, wrap, swap), `configureRegion`, `lockTab`, `addRegion` beside/zone, `moveRegion` in the tree; a changed v1 document comes back as v2; unit tests for each and for unknown targets

## 2. Drawing the tree

- [x] 2.1 The split tree drawn in the Workspace model (no separate composite needed): shares as `fr` tracks, each leaf measured and given its form through `FormScope`
- [x] 2.2 The Workspace draws tabs with `Splits` (v1 through `readDocument`); the empty tab and the placeholder as before
- [x] 2.3 `bindSplitHandle` and the handles (pointer, arrows, the smallest-form floor, preview as visual state); `bindDockDrag` and the drop zones
- [x] 2.4 Lock: the head's Unlock (hold on pointer, Enter on keyboard), no edit chrome while locked; edit tools at least `minTarget`
- [x] 2.5 `npm run typecheck`, the Workspace's vitest run, tiers, library and bindings-only rules

## 3. Settings

- [x] 3.1 The settings sheet (fields per `SettingSpec` type) from the region's tools; `configureRegion` on change; `pane(region, target, settings)`
- [x] 3.2 `Music/live/panes.ts`: settings for `mix`, `loop`, `cuts`, `dice`; the live views draw from them

## 4. The scenarios and the looper board

- [x] 4.1 Scenario stories for `live-panel-layout`, `live-pane-settings` and the changed `live-surface-document` and `live-surface-editing` requirements; the Workspace's play in both renderers
- [x] 4.2 `LOOPER_DOCUMENT` built by applying intents; `Music/Live/Views → Looper` locked at 1280 × 800, and a play that unlocks, resizes, docks, configures and relocks it
- [x] 4.3 `story-spec sync --change live-panel-layout`, then `--check`

## 5. Docs and checks

- [x] 5.1 `docs/workspace.md` (the tree, resizing, docking, lock, settings), `docs/live-views.md` (the looper board)
- [x] 5.2 Every check in the proposal's Validation, with the real output; the looper board looked at by touch (or touch emulation), at 1280 × 800 and 900 × 700, in two packs
