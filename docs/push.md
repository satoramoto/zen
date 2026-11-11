# Push

The Push area (`src/library/push/`, sidebar `Push`) is the Ableton Push 3 as a piece of UI: every
control of the unit, its 960 by 160 display, and a model of how the device behaves. It is the
basis for a Push 3 emulator a developer can build an app on. The plan and its seventeen
capabilities are the OpenSpec change `push-3-surface`.

It makes no sound and speaks no MIDI. Zen ends at the UI layer: the app owns the Set, the engine
and the wire. The area holds what a person sees and touches, and the rules that turn a touch into
something the app is asked to do.

## Sources

- The Push 3 manual, September 2025 edition: <https://www.ableton.com/en/push/manual/>. Every
  control, screen and workflow here is read from it and from its figures.
- Nothing was measured on a unit. What the manual does not give (colour values, hold times,
  encoder acceleration, the typeface) is a named value marked `// added`, to be tuned later.

## The model

`src/library/push/model/` holds the device with no renderer. It is also its own package entry,
`@satoramoto/zen/push/model`, which imports neither React nor Svelte, so a script, a worker or a
test can run the device alone.

Three plain-data shapes cross it (`types.ts`). Each survives JSON.

| Shape | Whose | What it holds |
|---|---|---|
| `PushSet` | the app's | tracks, devices and parameters, clips, scenes and notes, transport, the browser's content, and the unit's own readings (settings, battery, storage, networks, ports) |
| `PushState` | the device's, held by the app | the display mode and the pad mode, the layout per track, what is held, what is locked, the highlight in a list, the page of steps in view |
| `PushInput` | a person's | one control, what happened to it (`down`, `up`, `turn`, `touch`, `release`, `move`, `nudge`, `pressure`, `slide`, `bend`, or a `tick` of time), and when |

Two pure functions use them:

```ts
import { initialState, project, sampleSet, step } from '@satoramoto/zen/push/model';

const set = sampleSet();
let state = initialState();
const { state: next, intents } = step(state, set, { control: 'play', kind: 'down', time: 0 });
// intents: [{ kind: 'transport', action: 'play' }]
const { lamps, screen, notes } = project(next, set);
```

- `step(state, set, input)` gives the next state and the intents: what the device asks of the
  app. It never changes the Set. The device shows a change only when the app gives a Set that has
  it, so a refused intent is shown truthfully.
- `project(state, set)` gives every control's lamp, the screen as data, and what each pad plays.
- Time comes with the input. A hold that matures with nothing touched is a `tick`:
  `nextTick(state)` says when the next one is due, and `tick(time)` makes it.
- An intent is one of six kinds (`note`, `edit`, `transport`, `navigate`, `file`, `setting`), and
  its `action` is one of the names in `intents.ts` (`intentList()` gives them all).
- `run(set, inputs)` applies a script of inputs and returns the intents, lamps and screen after
  each (`run.ts`). `combinations()` lists every hold-and-press the model knows; it is read from
  the table the model dispatches on (`combos.ts`).
- `sampleSet()` is a Set with a little of everything, for stories, tests and a first run.

The model is layers, highest first (`layers/`): a unit that is not on, User Mode, then the
buttons that mean the same everywhere. A layer takes an input or passes it down, and paints the
lamps and screen parts it owns.

### The layout table

`model/layout.ts` is the unit's face as data: 147 controls, each with a stable id (`pad-3-5`,
`encoder-4`, `capture`), its cluster, legend, spoken name and box in millimetres. Rows and columns
count from the top left. The face is 380 by 318 mm (Ableton's technical specifications); places
are measured from the manual's control figure. The plan's design said 304 mm deep, from memory;
the technical specifications say 318.

### Values to tune on a unit

The manual gives no numbers for these. Each is a named constant marked `// added`.

| What | Where | Now |
|---|---|---|
| Hold time, double-press time, the pedal's double tap, how long a notice stays | `model/timing.ts` | 450, 350, 350 and 1500 ms |
| Lamp colours | `foundation/themes/lamps.ts` | Live's colour chart |
| User Mode numbers of the Push 3's new controls (Sets, Learn, Save, Lock, Capture, Session Screen, the D-pad's centre, the jog wheel, the encoders' presses) | `model/midi.ts` | free control numbers; the shared controls keep the Push 2's published ones |

## The look

- The pack is `push-3` (`src/library/foundation/themes/packs.ts`): the `push-3` palette, face and
  material with the `compact` scale. Any other pack recolours the device.
- Lamp colours are not part of the theme contract. `src/library/foundation/themes/lamps.ts` holds
  one table of seventy colours, in the order of Live's track and clip colour chart, so a Set
  carries an index and never a colour. `lampVars()` gives them as `--push-lamp-N` custom
  properties for the device's root; `lampShadeCss()` derives the brighter, lighter, dimmer and
  darker version of any of them by one rule each.

## Existing parts first

The device is drawn from zen's existing components wherever they can do the job: first a
component as it is under the `push-3` pack, then a component with one more generic prop, and a new
component only for a large difference of function. The verdict for each part of the device, with
its reason, is recorded below as the fit review finds it.

### The fit review

Every candidate was drawn from its own fixtures in the `push-3` pack, dark, by both renderers (the
two drew the same pixels), and read against the manual's figures. One verdict per part:

| Part of the device | Verdict | Why |
|---|---|---|
| Labelled buttons, display buttons, scene buttons, the D-pad's parts | `Pad`, as it is | A cap on the unit is a key whose printed legend lights. `Pad` is a key with a centred legend that fills its cell, lights as a solid block in a colour, and has a spoken name. `LampButton` was the first guess and is the worse fit: it draws an LED beside the label and reports a toggle. |
| A pad's face | `Pad`, as it is | The same key with no legend. |
| How a button or pad is coloured and dimmed | Local variables on its cell, no prop | `Pad` draws a hue slot and its legend in `--text-1`. The cell that holds it restates `--hue-1` as the lamp's colour (`--push-lamp-N`, or a derived shade) and `--text-1` as the legend's brightness, so unlit, dim, lit and any of seventy colours need nothing new on `Pad`. |
| A press: down, up, held, latched | The surface's own input store, no prop | Every control sits in a cell the `Surface` layout owns. One store on the surface hears pointers and keys on those cells, so a `Pad`'s own click is not used and nothing reports a toggle. |
| The pad grid and expressive input | A layout, `PadGrid`, with its own store | Velocity, pressure, slide and bend across 64 pads is one interaction over the whole grid. The faces are `Pad`. |
| Encoders, Volume, Swing & Tempo | `KnobReadout`, as it is | It turns in steps (drag, wheel, arrow keys) and presses. With no value it draws a bare cap with a pointer. Touch is heard by the surface's store. |
| Jog wheel | A layout of `KnobReadout` and two `Pad`s | The wheel turns and presses as a knob does; nudging it left and right is a key either side. |
| Touch strip | `Slider`, as it is | Vertical, filled from the bottom or from the middle, any ink, and it says when it is let go. |
| Rear panel | A layout of `StatusDot`, `Text` and a `Pad` | A port is a named dot, lit when something is plugged in; the power button is a key. |
| The unit as a whole | A new layout, `Surface` | Nothing places parts from a table of millimetres. |
| The display's box | A new layout, `Display` | The 960 by 160 box, its eight columns, two rows and overlays arrange other parts. |
| A parameter with an arc | `KnobReadout`, with one new prop | Name, value, unit and arc are what the display shows. A bipolar parameter (pan) fills from the middle, which `KnobReadout` cannot draw: it gains `origin`, as `Slider` already has. |
| A switch, a choice list | `Toggle`, `Segmented`, as they are | |
| A touched parameter, an automated one | Local variables on the cell, and a `StatusDot` | |
| The tab row and the track row | `Text`, `Icon` and `StatusDot` in the display's cells | `Tabs` sizes each tab to its word and underlines the chosen one; the display has eight fixed columns and marks the chosen one with a block. A cell with a `Text` in it is all the row is, so there is no new component. |
| Menus: the browser, Sets, Setup's choices | `FolderList`, as it is, one per column | It already is the display's list: rows, a solid block on the chosen one, a mark at the right end (the chevron of a folder), rows that cannot be chosen (a folder still loading). |
| Setup's tabs | `PageList`, as it is | |
| Piano roll | `PianoRoll` | Keys, notes in a hue, ruling and a playhead. Shading by velocity and the pitch strip are tried when Clip View is built. |
| Waveform | `Music.Waveform` in a `MusicScope` node | Tried when Simpler is built. |
| Mix strip | `KnobReadout` and `Music.Meter`; `Fader` | Tried when Mix View is built. |
| The Session overview on the display | `Pad` faces filling a grid | `LaunchGrid` and `LoopGrid` read the live model's songs and loops, not a matrix of clips. |
| Text entry, the code dialog, confirmations, notices | `Text` in the display's overlay | `SearchField` and `Modal` take the page's focus; the display's are drawn and worked from the encoders. |
| A device's drawing: envelope, filter curve, oscillator shape, spectrum | A new component, `Trace` | A line through a list of points, filled or not. Nothing in the library draws one from numbers within the contract (the math plots are a plotting library). This is the one new component the plan knows of. |

So the device needs one new prop (`origin` on `KnobReadout`) and one new component (`Trace`).
Everything else is an existing part, or a layout of existing parts.
