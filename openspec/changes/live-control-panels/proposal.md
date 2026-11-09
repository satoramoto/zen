# Proposal

## Why

`live-panel-layout` lets you arrange, size, configure and lock the panes zen ships. But a panel
you play live is mostly your own controls: four macro faders for the filters, a row of pads that
fire your FX, a knob for the delay feedback, an XY for the throw. Lemur and TouchOSC users build
exactly these. Right now nothing in zen lets you place a fader and say what it moves. And on
stage most of those moves come from a controller, so a control needs to learn its MIDI source
and show what it's mapped to. Zen still ends at the UI layer. The app lists its parameters, says
their values, does the MIDI, and keeps the mappings. Zen draws the controls, says which ones a
person moved, and makes building them as direct as building the panel around them.

## What Changes

- **A control panel pane (`Music.ControlPanel`, kind `controls` in `Music.livePanes`).** A grid of
  cells, each holding one control: a fader, a knob, a toggle, a button, a pad, or an XY. Each
  control is bound to one of the app's parameters (an XY to two) and drawn with the Music family's
  own controls. Values are readings the app gives (`values` by parameter id). A move sends
  `onParam({ param, value })`, and a button or pad sends `onTrigger({ param, down })` on press and
  release.
- **The app's parameter catalogue.** `params` lists what a control can move: id, label, group, and
  its range and unit (the Music `Param`), plus whether it is continuous, a switch or a trigger. A
  control offers only the parameters of its kind.
- **Building controls in place.** While the surface is editing and the tab is unlocked, the panel
  shows its grid. An empty cell offers the control kinds. A placed control can be moved and
  resized on the grid (drag, or arrows and Shift+arrows), and has a sheet for its kind,
  parameter, label and removal. Every change sends `onCells(next)`, which the app saves as the
  region's settings (`configureRegion`). The panel's grid size (columns and rows) is an ordinary
  setting in the pane's settings sheet.
- **Surface mode for panes.** The surface tells each pane it draws whether it is editing and
  whether its tab is locked (`useSurfaceMode()` / `getSurfaceMode()`), so a pane with its own edit
  affordances follows the surface's.
- **MIDI learn.** With `learning` on, the app's learn mode, pressing a control asks to learn its
  parameter (`onLearn(param)`). The control the app is waiting on (`learnTarget`) pulses. Each
  mapped control shows its mapping (`mappings`, the app's words, such as `CC 21 · ch 1`) and can
  forget it (`onForget(param)`). The app captures the MIDI, stores the mapping, and moves the
  value, which the control then reads back like any other reading.
- **Data settings.** A pane kind can declare a setting of plain data the pane edits itself (the
  control panel's cells). It is carried in the document and reaches the pane, and it is never
  listed in the settings sheet.
- **The looper board gains its macros:** a control panel of four filter faders and four FX pads
  beside the strips, built through the builder's intents and the panel's own edits.

## Capabilities

### New Capabilities

- `live-control-panels`: the control panel pane: its grid, its controls and their parameters,
  values in and moves out, and building controls in place.
- `live-midi-learn`: learn mode on a control panel: asking to learn, the pending control,
  showing and forgetting mappings.

### Modified Capabilities

- `live-pane-settings`: a pane kind can declare plain-data settings the pane edits itself.

## Validation

- **Before merging:** `npm run typecheck`; `npx vitest run src/library/layout src/library/view
  src/library/tiers.test.ts src/library/library.test.tsx src/library/Music` (the cell grid's
  placement, moves and collisions are pure and unit-tested; Music UI is held by plays, as
  `docs/music.md` asks); `npm run build:lib && npm run check:lib`; `npm run build:storybook`; every
  play under `Music/Live` (the control panel in both renderers) and `Design OS/Layout/Workspace`;
  `story-spec sync --change live-control-panels --check` reporting nothing for the live
  capabilities; `openspec validate live-control-panels --strict`; the PR's `checks` job.
- **While building:** after each task group, `npm run typecheck` and the control panel's plays.
- **Review:** `look`. Once merged, open the looper board: unlock it, add a knob for the delay
  feedback to the macros, turn learn on, and map a fader by moving a controller in the story's
  stand-in MIDI strip.

## Impact

- New: `src/library/Music/live/ControlPanel/` (model, cells, the React and Svelte bindings,
  forms, fixtures, stories), `src/library/Music/live/views/` (the macros in the looper board,
  the learn stand-in in the story host).
- Changed: `layout/Workspace/` (surface mode handed to each pane through a context, the data
  setting type), `Music/live/panes.ts` (the `controls` kind), `Music/index.ts` and
  `Music/svelte.ts` (exports, in their own commit), `docs/live-views.md`, `docs/workspace.md`.
- Uses existing parts: the Music `Knob`, `Slider`, `Toggle` and `Button`, the throw pads' XY
  drawing, the Music `Param`, and the view `Context` for surface mode. No new dependency.
- Not in this change: real MIDI I/O (the app's), controller feedback such as LED rings and motor
  faders (the app's, from the same values), OSC, and free-form placement outside the grid.
