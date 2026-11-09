# Design

## Context

The surface (`live-surface`, `live-panel-layout`) arranges, sizes, configures and locks panes from
the app's document, sends every edit as an intent, and keeps only visual state. The Music family
already draws parameter controls in mix[flow]'s face: `Knob`, `Slider` (`Fader`), `Toggle`, `Button`,
all on the Music `Param` (range, unit, format), and the throw pads draw an XY with its trail. The
person plays with a laptop, a touchscreen and hardware controllers, and wants panels of their own
controls, starting with the looper board's macros. Zen ends at the UI layer: the parameters,
their values, the MIDI and the mappings are the app's.

## Goals / Non-Goals

**Goals:** a control panel pane on a grid; six control kinds bound to the app's parameters;
values in, moves out; building controls in place while the surface edits; MIDI learn as asks and
readings; plain-data settings; surface mode for panes; the looper board's macros.

**Non-goals:** MIDI or OSC I/O, controller feedback, mapping storage (all the app's); scripting or
expressions (one control moves one parameter, an XY two); free placement off the grid; a control
panel outside the Music family.

## Decisions

### D1. The panel is a Music live pane, read and asked like the others

```ts
interface ControlParam {
  id: string; label: string; group?: string;
  param: Param;                                  // Music's: range, unit, steps, format
  role: 'continuous' | 'switch' | 'trigger';
}
interface ControlCell {
  id: string; control: ControlKind;              // 'fader' | 'knob' | 'toggle' | 'button' | 'pad' | 'xy'
  param?: string; paramY?: string; label?: string;
  x: number; y: number; w: number; h: number;    // grid cells, 0-based
}
interface ControlPanelProps {
  cells: readonly ControlCell[]; columns: number; rows: number;
  params: readonly ControlParam[]; values: Readonly<Record<string, number>>;
  onParam?(move: { param: string; value: number }): void;
  onTrigger?(press: { param: string; down: boolean }): void;
  onCells?(next: readonly ControlCell[]): void;  // building, while the surface edits
  learning?: boolean; learnTarget?: string; mappings?: Readonly<Record<string, string>>;
  onLearn?(param: string): void; onForget?(param: string): void;
}
```

It lives in `Music/live/ControlPanel/` with the house shape (model, React and Svelte bindings each
one `<Tree>`, forms, fixtures, stories). Which control kind takes which role: fader, knob and XY are
`continuous`; toggle is `switch`; button and pad are `trigger`. A sheet offers only parameters of
its control's role. During a gesture each control shows the value it is being dragged to, and
snaps back to the app's value when the gesture ends (the house rule for controlled Music controls).

### D2. Cells are plain data in the region; the grid is pure

The panel's kind declares `columns` and `rows` (`number` settings, 8 × 4 by default) and `cells` (a
new `data` setting: `{ type: 'data'; default: JsonValue }`). `SettingValue` widens to plain JSON;
`resolveSettings` passes a data setting through, and the sheet skips it. The app hands
`settings.cells` to `ControlPanel` and turns `onCells(next)` into
`configureRegion({ …settings, cells: next })`. The grid edits are pure functions in
`layout/cells.ts` (not in the Music family: it is plain geometry, and `docs/music.md` keeps new
helper unit suites out of Music): place, move (stop at the last free cell on the path), resize
(clamped to the grid and to free cells), remove. They are unit-tested and never let two controls
overlap.

*Rejected:* a separate document field for controls. Settings already travel with the region and
through `configureRegion`, and mix's store needs no new method.

### D3. Surface mode reaches panes through a context

Each leaf's content is wrapped in a `SurfaceMode` context (`{ editing, locked }`) through the
registered `Context` component, next to its `FormScope`. React reads it with
`useSurfaceMode()` and Svelte with `getSurfaceMode()`. The control panel builds only when
`editing && !locked`. Any app pane can use the same context.

### D4. Building in place

While building: the grid draws as faint cell outlines, and every empty cell is a button ("add a
control here") opening the six kinds. A placed control shows a tag (its label, or its kind). The
tag drags the control on the grid, and its corner handle resizes it. With the tag focused, the
arrows move it and Shift+arrows resize it. Pressing the tag opens the control's sheet (kind,
parameter, label, remove), inline under the panel's top edge as the surface's region sheet is; the
label field saves when left or on Enter. Both gestures go through one framework-free store,
`liveCellDrag` (mode `move` or `resize`), registered in the Music store registry. A control's own gesture is off while building, so a drag on a fader
moves the cell, not the value.

### D5. Learn mode is the app's

`learning`, `learnTarget` and `mappings` are readings; `onLearn` and `onForget` are asks. In learn
mode a press on any control sends `onLearn(param)` and nothing else (the gesture stores are off).
The pending control pulses with `--selected`, and under reduced motion it holds a steady outline.
A mapped control carries a small mark with the first word group of its mapping (`CC 21`), and in
learn mode a forget button. The story host stands in for MIDI with a strip of "controller" sliders:
each mapped one sets the value through the host, and learn maps the next slider moved.

### D6. The looper's macros

`LOOPER_TAB` gains a `controls` region, docked right of the strips (shares 1.6 : 1). Its cells, on
6 × 3, are four faders (filter, delay send, reverb send, drive), four pads (riser, drop, stutter,
kill) and a freeze toggle, placed with the grid's `place` and applied through `configureRegion`.
No XY: the board's throws pane already carries the delay throw. The story host lists those
eight parameters and keeps their values.

## Risks / Trade-offs

- **Two editors in one surface.** The surface edits regions and the panel edits cells. They share
  the edit mode and the lock (D3), and the panel's tools are drawn inside its own frame, so the
  two never cover each other.
- **Gesture conflicts on touch.** While building, every control's own gesture is off; while
  playing, the grid's are off. The two never compete for a touch.
- **Wider `SettingValue`.** Plain JSON in settings could grow without bound; only `data`
  settings take it, and the applier and the document don't care what it is.

## Open Questions

- Should one control move several parameters (a macro fanning out)? This change: no. The app can
  fan one parameter out itself.
