# Tasks

## 1. The contract and the grid (framework-free)

- [ ] 1.1 `layout/Workspace`: the `data` setting type, `SettingValue` as plain JSON, `resolveSettings` passing data through and the sheet skipping it; unit tests
- [ ] 1.2 `layout/Workspace`: the `SurfaceMode` context round each pane (`{ editing, locked }`), `useSurfaceMode` and `getSurfaceMode`
- [ ] 1.3 `Music/live/ControlPanel/ControlPanel.model.ts` types (`ControlParam`, `ControlCell`, `ControlKind`, the roles) and `grid.ts` (place, move, resize, remove, never overlapping); unit tests for the grid

## 2. The panel

- [ ] 2.1 The panel drawn: cells on the grid, each kind with its Music control, values in, `onParam` and `onTrigger` out, no-parameter and missing-parameter states; forms; React and Svelte bindings; registered for both renderers
- [ ] 2.2 Building: grid outlines, add to an empty cell, the tag's drag and corner resize (`bindCellDrag`, `bindCellResize`), arrows and Shift+arrows, the control's sheet; `onCells`
- [ ] 2.3 Learn: learn mode presses ask, pending pulse (steady under reduced motion), mapping marks, forget
- [ ] 2.4 `Music/live/panes.ts`: the `controls` kind (columns, rows, cells settings); exports in `Music/index.ts`, `Music/svelte.ts` in their own commit
- [ ] 2.5 `npm run typecheck`, the vitest runs, tiers, library and bindings-only rules

## 3. The scenarios and the looper's macros

- [ ] 3.1 Scenario stories for `live-control-panels`, `live-midi-learn` and the changed `live-pane-settings` requirement, the panel's plays in both renderers
- [ ] 3.2 The looper board's macros (D6) built through intents; the story host's parameters, values and stand-in MIDI strip; `Looper · learn` plays mapping a fader
- [ ] 3.3 `story-spec sync --change live-control-panels`, then `--check`

## 4. Docs and checks

- [ ] 4.1 `docs/live-views.md` (the control panel and learn), `docs/workspace.md` (data settings, surface mode)
- [ ] 4.2 Every check in the proposal's Validation, with the real output; the looper board with its macros looked at by touch emulation at 1280 × 800 and 900 × 700, in two packs
