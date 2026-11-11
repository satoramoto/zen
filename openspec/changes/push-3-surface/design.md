# Design

## Context

See proposal.md for why. What shapes the approach:

- **The source is the manual.** The Push 3 manual (September 2025 edition) and its 212 figures
  describe every control and screen. There is no public Push 3 protocol document; Ableton's
  public `push-interface` document describes Push 2, whose display is also 960 by 160. Nothing
  here depends on a wire format.
- **Zen's rules apply in full.** Parts are bindings of one view tree (`foundation/view`), state
  is a framework-free store, components read only the contract's variables, files sit where
  `docs/structure.md` says, and every requirement is a `scenario()` story from which
  `story-spec sync` writes the delta. The deltas in this change are the plan; the stories own
  them once they exist.
- **Zen ends at the UI layer** for live work: apps own documents, history and the engine. The
  person chose "UI plus a behaviour model" for this change, so the model is new ground: it must
  hold behaviour without holding the app's state.
- **What exists.** `music/live/components/PushTwin` is a small fixed twin for one live layout.
  The `push` palette, face and material (the `yahaha-push` pack) are Yahaha's reading of Push,
  not the unit. Token-drawn `Pad`, `KnobReadout`, `Fader` and the toolkit's `Music.Meter` exist.

## Goals / Non-Goals

**Goals:**

- One layout table, one model, one display description: three plain-data things a developer can
  read, test and replace.
- Built from zen's existing components; a new one only where D10 says why.
- The model usable with no renderer (Node, a worker, another framework).
- A device that an app can drive at 60 frames a second without re-rendering 64 pads per frame.
- Every scenario playable in Storybook in both renderers.

**Non-Goals:**

- Sound, MIDI bytes, USB, the real display's pixel feed, running Live control scripts.
- Pixel-identical type or icons. The layout is faithful; the drawing is zen's.
- Replacing `PushTwin` or the live panes.
- Describing every Live device's banks. The model draws whatever banks the Set gives; the sample
  Set carries a handful (a synth, Simpler, a Drum Rack, a few effects, Tuner).

## Decisions

### D1. A top-level area `push`, not a sub-area of `music`

`src/library/push/` with `model/`, `components/`, `layouts/`, `screens/`; sidebar `Push`;
capabilities prefixed `push-`. It is a whole product surface with its own model, like `graph` or
`yahaha`, and it would double the size of `music`. It may draw `music`'s token-drawn parts
through the view registry; `music` never imports it.

*Alternative:* `music/push`. Rejected: the capability prefix and the sidebar would disagree with
the folder, and the music area's two-kinds-of-part rule (`docs/music.md`) would need a third.

Consequences, each a small shared-file commit: `AREAS` gains `push`; the tier scan
(`tiers.ts`), the contract scan (`library.test.tsx`) and the bindings-only scan gain the area
with a baseline of zero.

### D2. Three plain-data shapes and two pure functions

```
PushSet      what the app owns: tracks, devices, clips, transport, browser, unit readings
PushState    what the device remembers: modes, layout per track, held, locked, highlight, page
PushInput    one thing a person did: { control, kind, value?, time }

step(state, set, input)  ->  { state, intents: PushIntent[] }
project(state, set)      ->  { lamps: Record<ControlId, Lamp>, screen: Screen, notes: PadMap }
```

The app holds `PushState` (it is the app's to persist or discard) and calls `step`; zen ships a
small store (`bindPushDevice`) that does this for an app that does not care to. Time arrives in
the input, so double presses and press-versus-hold are decided without timers inside `step`; a
hold that matures with no further input is delivered as a `tick` input the store schedules.

*Alternative:* a class with internal timers and events. Rejected: not serialisable, not testable
by table, and it would hold state the app cannot see.

*Alternative:* the model edits a copy of the Set optimistically. Rejected: it makes the device
lie when the app refuses (`push-device-model`: "shows what the app gives").

### D3. The model is split by mode, composed by layer

`step` and `project` are composed from layers, highest first: power and User Mode; overlays
(text entry, dialogs, confirmation, colour picker); hold menus (Metronome, Quantize, Fixed
Length, track options, Layout's momentary controls); global buttons (transport, Undo, Save,
modifiers); the display mode (Device, Mix, Clip, Session Screen, Browse, Sets, Setup, Learn,
Scale); the pad mode (a note layout, a drum layout, a sequencer, Session Pad, overview). A layer
either consumes an input or passes it down, and paints only the lamps and screen regions it
owns. Each layer is a file under `push/model/` with its own table-driven tests.

The published combination list (`push-device-model`: "the combinations are listed") is the same
table the layers dispatch on, so the list cannot drift from the behaviour.

### D4. One layout table in millimetres

`push/model/layout.ts` holds every control's id, cluster, centre and size in millimetres on a
380 by 304 body, measured from the manual's control figure. The surface is one CSS grid-free
absolutely placed tree scaled by a single custom property (`--push-mm`), so the whole object
scales as one (`push-surface`: "scales as one object") and a region is a filter of the table.

*Alternative:* nested flex and grid clusters. Rejected: proportions drift between clusters and
the overlay comparison against the figure becomes approximate.

### D5. The display is DOM and SVG in a 960 by 160 box

A `Screen` is plain data: a kind, eight columns of cells, a top row, a bottom row and overlays.
`Display` draws it with the view tree in a box sized `960 * --push-px` by `160 * --push-px`;
text is real text (selectable, readable by assistive technology), drawings (arcs, piano roll,
waveform, envelope, meters) are SVG. The type scale is three sizes fixed in display pixels.

*Alternative:* a canvas. Rejected: no tree snapshot, no parity check, no assistive text, and it
cannot read the contract's variables without a second path.

### D6. Fast values bypass rendering

Meters, the playhead, the blink phase, pad pressure and the touch trace change faster than the
tree should. They go through a frame reader as in `music/live` (`LiveFrame`): a store bound to
the node reads the frame each animation frame and sets custom properties. Pulse and blink are
CSS animations whose phase is set from the beat; without a beat they free-run.

### D7. Expression from ordinary pointers

A pad reads `PointerEvent.pressure` where the device reports it (pen, some touch). For a mouse:
click height on the pad is slide, horizontal drag is bend (carried across pads by pointer
capture), vertical drag after a short dead zone is slide, the wheel while held is pressure,
Alt-click is a hard press. Multi-hold with one mouse is a latch: right-click or long-press a
control to hold it, again to release; latched controls show a mark. Keyboard: the four letter
rows map to the grid's lower rows in the focused quadrant. These gestures are listed in
`docs/push.md` and shown in a legend on the emulator screen.

The raw force to velocity curve (Threshold, Drive, Compand, Range) is one pure function shared
by the pads and the Sensitivity tab's drawing.

### D8. Lamp colours live with the themes, outside the contract

`foundation/themes/lamps.ts` holds the indexed table (Live's track and clip colour indices) and
the rules for derived shades. The device root sets them as local custom properties
(`--push-lamp-N`); parts read those and the contract only. `toCssVars()` is not widened: the
table is data the Set indexes, not a theme facet, and seventy more variables on every scope
would cost every other screen.

State colours (playing, recording, selected, soloed, queued, empty) map to the contract's
meaning colours (`success`, `danger`, `selected`, a hue, `text` steps) so a pack can restate
them.

Values not found in the manual (exact LED hues) are marked `// added`, as the theme rule asks.

### D9. A new `push-3` pack with its own facets

Palette `push-3` (black ground, neutral greys, white action), face `push-3` (a neutral
grotesque for legends and display, tabular numerals), scale `compact`, material `push-3`
(matte body, small control radius, translucent pad wells, bloom). The existing `push` facets
stay Yahaha's. The display keeps a dark ground by default in any mode (`push-theme`), done by a
nested scope with the pack's dark values.

### D10. Existing parts first

The device is built from zen's existing components wherever they can do the job. Each part is
decided in this order, and the first that works is taken:

1. **An existing component as it is**, made to look right by the `push-3` pack and by local
   variables the enclosing layout sets (a pad's lamp colour is a variable on its cell, not a new
   prop).
2. **An existing component with one more prop.** The prop is generic (it names what the control
   does, never the Push), lands in that component's own small commit with its fixture, story and
   tree snapshot, and is added one at a time: a second prop on the same component is a second
   decision, made after the first is in use.
3. **A new component in `push/components/`**, only when the pack and an existing component cannot
   carry the use, or the difference is one of function and is large (a different interaction,
   not a different look). Needing several props at once on one component is the sign of this.

Arranging existing parts is a layout, not a component: a row of buttons, the D-pad, the scene
column and the regions of the unit are `push/layouts/`.

The table is where each part starts. The fit is read from each component's props, not yet tried
in a browser; task 1.7 tries every row in the `push-3` pack at the unit's size and records the
verdict and its reason in `docs/push.md`, before anything in groups 3 and 4 is built.

| Part of the device | Starts from | Known gap |
|---|---|---|
| Labelled buttons, display buttons, scene buttons, D-pad parts | `LampButton` (label, lit, hue, disabled, long press) | Reports a toggle, not down and up; text labels only (several legends are icons); pulse and blink |
| Pad face | `Pad` (label, hue, state, lit, fill or ring) | Colour is a hue slot, the unit's is an indexed lamp: set as local variables by the grid. Its press is a click |
| Pad grid and expressive input | New: `PadGrid` with its store | Velocity, pressure, slide and bend across 64 pads is one interaction no part has. It draws `Pad` faces if the face can be passive |
| Encoders, Volume, Swing & Tempo | `KnobReadout` (turn steps, press) | No touch report; the unit's caps show no value |
| Jog wheel | `KnobReadout` | Nudge left and right as well as turn, press and touch: likely new |
| Touch strip | `Slider` or `LineSlider` | A lit column with a touch position and no thumb: likely new |
| Rear panel | New: `RearPanel`, with `StatusDot` for a plugged port | Nothing draws ports |
| Display box | New: `Display` | The 960 by 160 shell, columns, rows and overlays |
| Parameter cell | `KnobReadout` (arc, label, value, unit), `Toggle`, `Segmented`, `SendBars` by kind | Bipolar arc; touched emphasis; automation dot |
| Tab row | `Tabs` or `Segmented` | Eight fixed columns |
| Track row | New, unless `Segmented` carries colour, kind icon and the armed mark | To be tried |
| Menus of the browser, Setup and Sets | `FolderList` per column, `PageList` | Chevrons for enclosing columns; a loading row |
| Setup's rows | `SettingsRow` with `Toggle`, `Select`, `StepValue` | None known |
| Piano roll | `music/components/PianoRoll` (keys, notes, ruling, playhead) | Velocity shading; the sequenceable box; the pitch strip |
| Waveform | `Music.Waveform`, inside a `MusicScope` node | Slice and loop markers |
| Mix strip | `Fader` (level, two meters, peak), `Music.Meter`, `SendBars` | None known |
| Session overview | `LaunchGrid` or `LoopGrid` | Both read the live model's songs, not a clip matrix: likely new |
| Text entry, the code dialog, confirmations, notices | `SearchField`, `Modal`'s face, `Text` | These are drawn on the display, not focused in the page: to be tried |
| The unit as a whole | New layout: `Surface`, from the layout table | `Assembly` solves app screens, not a fixed drawing |
| Emulator's inspector and legend | Core parts only | None |

An earlier draft of this plan listed twenty-two new components. The names it used for display
parts (`ParamCell`, `TabRow`, `MenuColumns`, `MixStrip`, `WaveformView`, a second `PianoRoll`)
are now names for what the display draws, not for components to write.

Adding a prop to a component that has a spec is a change to that capability. None of the
candidates above has one today (`openspec/specs/` holds no spec for a core or music control), so
the proposal still lists no modified capability; if task 1.7 finds otherwise the change is
updated before the prop is written.

- **layouts/** `Surface`, `DisplayBlock`, `PadBlock`, `LeftColumn`, `RightColumn`, `ButtonBar`,
  `SceneColumn`, `DPad`.
- **screens/** `Emulator` (surface, stand-in host, sample Set, gesture legend, state
  inspector), and one screen per capability whose stories are that capability's scenarios.

Scenario stories for a capability sit in the screen that shows it whole (as
`music/live/screens/Daws` does for the host contract), driving the real model with a small
stand-in host; pure model requirements also get table tests in `push/model/`.

### D11. Exports

`Push` namespace from `@satoramoto/zen` and `@satoramoto/zen/svelte` (parts, `Surface`,
`Display`, `bindPushDevice`); the model (`step`, `project`, the types, the layout table, the
combination list) also from a renderer-free entry so a script can import it alone. Whether that
is a new `@satoramoto/zen/push` entry or part of `@satoramoto/zen/themes`' pattern is decided in
task group 2 against `check:lib` (no React in the chunk).

### D12. Build order

The surface, the model's core and the display shell first (a device that lights and reports
before it does anything), then the two things everything else stands on (track row and
parameter cells; note and drum layouts), then the screens by how much they share. Each group
lands its own stories, model tests and docs. See tasks.md.

## Risks / Trade-offs

- **Size: 291 requirements, 425 plays.** → Phased groups, each mergeable in principle; the
  while-building checks run per group; scenario stories share one host harness so a play is a
  few lines.
- **The spec is read from a manual, not from a unit.** Timing (hold time, double-press window),
  encoder acceleration and exact lamp hues are not in it. → They are named constants in one
  file, marked `// added`, and listed in `docs/push.md` as the first things to tune against a
  real unit.
- **Where the manual is silent or inconsistent** (it says "Main" in text and "Master Track" in
  the figure; the Exclusive Arm option is described under Preferences and referred to under
  Status). → The spec follows the text and the tab that describes the setting; the differences
  are listed in `docs/push.md`.
- **Device banks are per device and unbounded.** → The model draws what the Set gives; fidelity
  of a given device's banks is the emulator app's data, not zen's code.
- **64 pads with per-frame expression.** → D6; a play measures that a pressure change sets a
  property and does not re-render the grid.
- **Mouse gestures for expression are invented.** → D7 keeps them in one bind file and one doc
  section; real pressure is used when present.
- **Trademarks.** "Ableton" and "Push" are Ableton's marks. → The pack and docs name the source
  as zen's packs do; no logo is drawn; the emulator app decides its own naming.
- **Tier and contract baselines.** A new area must enter at zero. → Group 1 adds the area to
  the scans before any part exists, so the first violation fails at once.

## Open Questions

- The exact lamp table values: start from Live's published clip colour chart; tune by eye
  against a unit later. Does not change the spec.
- Whether `PushTwin` should later be drawn from `PadGrid` and `Display`. A follow-up change.
