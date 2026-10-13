# `@openflow/widgets` in openflowfm/visuals: the review

> **History.** On 2026-10-13 visual[flow]'s UI moved out of zen into openflowfm/visuals (`app/src/ui/`); `src/library/visuals/` and `@satoramoto/zen/visuals` no longer exist. This review is kept as a record.

After openflowfm/visuals#239 moved the app's UI onto zen (`@satoramoto/zen/visuals`), the
widgets suite was still a dependency of the visuals app (`package.json` pinned
`openflowfm/widgets#ef99d1b`). This is every import that was left, what each widget did
there, and what replaces it. The outcome: the lab editor moved into zen
(`src/library/visuals/Editor/`, the package entry `@satoramoto/zen/visuals/lab`), the two
missing controls were built generic in zen, and the dependency is gone from visuals.

## Who still imported it

Only two groups of files: the lab editor (reached only from `app/src/Lab.tsx`, behind
`VITE_LAB`), and the old app UI that zen had already replaced but that was still in the tree
because the editor's `Library` pulled it in. Nothing the app people get rendered any of it.

| visuals file | widget | what it did there | in zen |
|---|---|---|---|
| `Lab.tsx` | `theme/ThemeRoot`, `theme/theme` `DEFAULT_THEME`, `palette.css`, `tokens.css` | the editor's theme root and the suite's palette and tokens | **drop**: `VisualsApp`'s `ThemeScope` on the `visuals` pack; the editor is mounted by `VisualsApp lab={VisualsEditor}` |
| `Editor.tsx` | `controls/Button` | previous, next, random in the header | core `ActionButton` (exists) |
| `views.tsx` | `controls/Segmented` | the view switch | core `Segmented` (exists; zen's `Views/ViewSwitch`) |
| `views.tsx` | `controls/Button` | the notice banner's ✕ | core `ActionButton` (exists; zen's `Views/NoticeBanner`) |
| `views.tsx` | `chrome/HintFooter` | the hint strip: what the pointer or focus is on | exists, folded into zen's `Views/Hints` |
| `StageGraph.tsx` | `chrome/Graph`, `GraphNode`, `GraphView` | the pannable, zoomable canvas of the MilkDrop pipeline, nodes placed by the host, cords between ports | **missing → built**: core `Graph` (`components/core/Graph/`), with `GraphView.fit()` added (the host had been shrinking faces to fit because the widget had no setter) |
| `StageGraph.tsx` | `chrome/Port` | a stage's inlet and outlet dots | **missing → built**: core `Port` (same folder) |
| `StageGraph.tsx` | `chrome/Device`, `DevicePortRow` | each stage's face: head, picture, one wiring row, body | **missing → built**: core `Device` (`components/core/Device/`), no fold or power switch |
| `StageGraph.tsx` | `chrome/Popup` | the "+ add layer" menu | core `Popup` / `Popover` (exists) |
| `StageGraph.tsx`, `graph/RemoveLayer.tsx`, `Inspector.tsx` | `controls/Button` | fit, write my own, remove, × | core `ActionButton` (exists) |
| `Inspector.tsx` | `controls/NumberField` | the file's loose values | core `NumberField` (exists) |
| `graph/Setting.tsx` | `controls/NumberField`, `Select`, `Toggle` | one setting as a number, a menu or a switch | core `NumberField`, `Select`, `Toggle` (exist) |
| `SourcePicker.tsx` | `music/Meter`, `controls/Select` | the input's level meters and source menu | music `Meter`, core `Select` (exist; zen's `visuals/SourcePicker` is the port) — **drop** the visuals copy |
| `Pack.tsx`, `PackOffer.tsx`, `Credits.tsx` | `controls/Button` | the full pack's download, offer and credits | already ported (`visuals/Pack`, `PackOffer`, `Credits`) — **drop** the visuals copies |
| `LibraryGrid.tsx`, `PresetDrawer.tsx` | `controls/ButtonFace` | tile chips, the drawer's toggles | core `ActionButtonFace` (exists; already ported) — **drop** the visuals copies |
| `controls.ts` | `param/param` `Param` (type) | the shape a setting's range becomes | core `Param` (exists) |

No XYPad, Knob, Modal or Fader import was left: those had gone with #239.

## Where the lab deviated from zen's primitives

`lab.css` and `graph.css` were the page's last hand-set look:

- **Type set by hand.** `html:root` redefined the suite's faces (`--sans` Instrument Sans,
  `--code` Recursive with its axes, `--sep-space`), and each rule picked sizes from the
  suite's ramp (`--text-lead`, `--text-label`, `--text-heading`) and weights. In zen every
  printed string is `Text` in a role (`heading`, `caption`, `label`, `code`).
- **Surfaces painted by hand.** The library column and the inspector painted `--panel` with a
  `--bd3` rule between columns; the add menu its own background, border, radius and
  `--shadow-menu`; `.vf-sheet` a literal `rgb(0 0 0 / 0.45)` shadow; the letterbox a literal
  `#000`; a global `:where(button, select, input, textarea)` restyled every form control. In
  zen the columns are `Region`s on the theme's plate, the graph a `base` Layer, a node a
  `raised` Surface, the menu a `float` Layer (Popover), code a `well`, and the letterbox
  `--surface-0`.
- **Gaps and sizes in pixels.** The `220px · 1fr · 380px` grid, 4–12px gaps, 168px and 88px
  node widths, 84/96/64px control widths, the header's `calc(var(--ctl-h) + 13px)`. In zen
  they are scale steps or declared `--vs-*` knobs (`--vs-editor-library`, `--vs-stage-wide`…),
  and spacing between controls is a `Group`/`Stack` gap.
- **Colour picked by kind.** Motion blue, shaders amber, layers green, problems red, through
  the widgets' `--wdg-device-accent` and `--wdg-cord-*` host tokens. Under the visuals pack
  amber means caution, green signal and the hues are stems, so the port uses tone steps for
  kinds and keeps `--danger` for a problem (decision 37).
- **Fit by shrinking faces.** The widget graph owned its zoom with no setter, so the editor
  measured the nodes and shrank them with `--wdg-node-zoom`. zen's `Graph` fits itself.
