# Proposal

## Why

The surface from `live-surface` can place the sixteen live panes in rows and move them one step at a
time, and that is all. You can't make a pane bigger, put two panes in a column, drag one where
you want it, keep a stray touch from rearranging the page mid-set, or tell a pane what to show
(which tracks a strip carries, which cuts a pad row offers). The panels on stage have to be
built, tuned and locked, and right now they can only be listed. This change makes the builder
good enough to build the panel we'd actually play first, the looper performance board, from the
panes that exist. It works the same with a touchscreen, a laptop or beside hardware controllers.
Custom control panels (your own faders, knobs, pads and XY pads bound to parameters) and MIDI learn
follow in `live-control-panels`.

## What Changes

- **A tab is a layout tree, not rows (document version 2).** A tab's layout splits into rows or
  columns, to any depth, each child with a share of the room. Region instances sit at the leaves.
  Every tab can be locked. Version 1 documents (mix's today) are still drawn: their rows read as
  a column of rows of equal shares.
- **Resize.** In edit mode a handle sits between every two siblings. Dragging it, or using the
  arrow keys on it, changes the two shares. The surface previews the drag and sends one
  `resizeSplit` intent when it ends. A pane never gets less room than its smallest form.
- **Dock.** Dragging a region's tag over another region shows five drop zones (left, right,
  above, below, swap). Dropping sends one `dockRegion` intent. The step-wise move tools stay, for
  keyboard and switch access.
- **Lock.** A locked tab offers no edit tools at all, and its panes take every touch. The lock is
  part of the document, so it travels with the panel. Unlocking is a deliberate press, held on
  touch.
- **Per-pane settings.** A pane definition can declare settings: choices, toggles, numbers in a
  range, and a pick of the app's targets ("which tracks"). The region's tools open a settings
  sheet; a change sends one `configureRegion` intent. The values live in the region
  (`settings`) and reach the app's `pane(region, target)`. The live panes declare what their own
  props already allow: tracks shown, form, pads offered.
- **Forms by room.** A region's room is its share of the tab. The surface draws the largest of
  the pane's forms that fits, so a resized pane steps its form up and down.
- **The looper performance board.** A reference document built only through the builder's
  intents, with its own story: launch grid, track strips (four tracks), cut pads, throws, song
  card and rig line, resized and locked.
- Edit mode works with a finger (targets at least `minTarget`, no hover-only tools), a mouse and the
  keyboard (every tool reachable by Tab, the arrows resize and move).

## Capabilities

### New Capabilities

- `live-panel-layout`: the layout tree, resizing, docking, locking, forms by room, and the
  inputs edit mode works with.
- `live-pane-settings`: settings a pane kind declares, the settings sheet, and the values a
  region carries to the app.

### Modified Capabilities

- `live-surface-document`: version 2 (layout tree, lock, region settings), and version 1 drawn
  as before.
- `live-surface-editing`: new intents (`resizeSplit`, `dockRegion`, `configureRegion`,
  `lockTab`) and their applier.

## Validation

- **Before merging:** `npm run typecheck`; `npx vitest run src/library/layout src/library/view
  src/library/tiers.test.ts src/library/library.test.tsx src/library/Music` (the layout tree,
  the applier, the room-to-form pick and the v1 reading are pure and unit-tested); `npm run
  build:lib && npm run check:lib`; `npm run build:storybook`; every play under `Design
  OS/Layout/Workspace` and `Music/Live` passing (the Workspace's in both renderers); `story-spec
  sync --change live-panel-layout --check` reporting nothing for the live capabilities; `openspec
  validate live-panel-layout --strict`; the PR's `checks` job.
- **While building:** after each task group, `npm run typecheck` and the Workspace's vitest run,
  and the Workspace plays once the layout draws, so the tree, the applier and the drawing never
  drift apart.
- **Review:** `look`. Once merged, open the looper board story on a touchscreen if you have one.
  Unlock it, resize the grid against the strips, dock the cut pads under the throws, set the
  strips to four tracks, lock it, and play it.

## Impact

- Changed: `src/library/layout/Workspace/` (the document's v2 types, the layout tree and its
  applier, resize handles, drop zones, lock, settings sheet, forms by room, the stories);
  `src/library/Music/live/panes.ts` (settings for the live panes);
  `src/library/Music/live/views/` (the looper board document and story; the reference documents
  move to v2).
- Uses existing parts: `Popover`/`Sheet` for the settings sheet, the form controls (`Segmented`,
  `Select`, `Checkbox`, `NumberField`) for its fields, `assembly`'s length resolution for forms by
  room. No new dependency.
- Mix keeps version 1 until its follow-up adopts version 2. The applier upgrades a v1 document
  to v2 on its first layout edit, so an app that applies intents ends up on v2.
- Not in this change: custom control panels, parameter catalogues, MIDI learn
  (`live-control-panels`); persistence, which stays the app's.
