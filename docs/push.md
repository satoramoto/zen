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
| Piano roll | `PianoRoll`, with one new prop | Keys, notes in a hue, ruling and a playhead. A note gained `level` (0 to 1), a fainter block for a softer note; its compact form, with no key column, is what the display draws. The loop, the markers, the pads' reach and the pitch strip are the display's own marks over it. |
| Waveform | `Trace`, as a band | `Music.Waveform` was tried and does not fit: it is a canvas of a fixed height that reads a deck's frames, and the display needs a sample's peaks in a box sized in its own pixels, with a lit stretch and slice marks over it. `Trace` gained `band` (the peaks as a filled shape) instead of the display gaining a second drawing. |
| Mix strip | `KnobReadout`, `Slider` and `Music.Meter` in a `MusicScope` node | A volume or a send is a parameter like any other; the meter is the toolkit's, moved once a frame by a store that reads the app's levels, so a level redraws nothing. |
| The Session overview on the display | `Pad` faces filling a grid | `LaunchGrid` and `LoopGrid` read the live model's songs and loops, not a matrix of clips. |
| Text entry, the code dialog, confirmations, notices | `Text` in the display's overlay | `SearchField` and `Modal` take the page's focus; the display's are drawn and worked from the encoders. |
| A device's drawing: envelope, filter curve, oscillator shape, spectrum | A new component, `Trace` | A line through a list of points, filled or not. Nothing in the library draws one from numbers within the contract (the math plots are a plotting library). This is the one new component the plan knows of. |

So the device needs two new props on existing parts (`origin` on `KnobReadout`, `level` on a
`PianoRoll` note) and one new component (`Trace`). Everything else is an existing part, or a
layout of existing parts.

## The parts

The package's React entry and its Svelte entry each expose the area as the `Push` namespace, with
the device model beside the parts.

| Part | What it is |
|---|---|
| `Push.Device` | The device over a Set: the surface and its display, self-running. It takes `set`, and reports `onIntent`, `onInput` and `onState`. |
| `Push.Surface` | The face alone: lamps, a screen and a strip in, inputs out. It holds no behaviour. |
| `Push.Display` | The 960 by 160 screen alone, drawing a `Screen` description. |
| `Push.RearPanel` | The back of the unit: its ports and the power button. |
| `Push.Trace` | A line or a band through points, for a device's drawing. |
| `Push.Emulator` | The device with a stand-in host that answers every intent over the sample Set, a legend of the gestures and an inspector of what was asked. It is the harness of every scenario story. |

### Building an emulator on it

The app owns the Set. The device asks; the app answers by giving a Set.

```tsx
import { useState } from 'react';
import { Push, ThemeScope } from '@satoramoto/zen';
import { packs } from '@satoramoto/zen/themes';
import '@satoramoto/zen/zen.css';

const pack = packs.find((p) => p.id === 'push-3')!;

export function MyPush() {
  const [set, setSet] = useState(() => Push.sampleSet());
  return (
    <ThemeScope facets={pack.facets} mode="dark">
      <Push.Device
        set={set}
        onIntent={(intent) => {
          // The app decides what an intent does to its Set. The device shows the Set it is given.
          if (intent.action === 'play') setSet((now) => ({ ...now, transport: { ...now.transport, playing: true } }));
          if (intent.action === 'stop') setSet((now) => ({ ...now, transport: { ...now.transport, playing: false } }));
        }}
      />
    </ThemeScope>
  );
}
```

In Svelte the parts are the same names from `@satoramoto/zen/svelte` (`Push.Device` and the rest).
Without a page, the model runs alone:

```ts
import { press, run, sampleSet, turn } from '@satoramoto/zen/push/model';

const steps = run(sampleSet(), [...press('mix', 0), turn('encoder-2', -3, 200)]);
steps.flatMap((s) => s.intents.map((i) => i.action)); // what was asked, in order
```

- Fast values (levels, the song position) do not go through the Set. `frame` on `Device` is read
  once a frame, and the meters and playheads move by properties, so a level redraws nothing. The
  `Push/Screens/Emulator` story named Only What Changed holds that.
- The two pedals are not on the face. A page reports one, or anything else it hears (a footswitch
  over Web MIDI), as a `pushinput` event on the surface's element:
  `surface.dispatchEvent(new CustomEvent('pushinput', { detail: { control: 'pedal-1', kind: 'down' } }))`.

## Mixing and recording

- **Mix** is two screens. The first press shows all tracks at once (Global Mix): Volumes, Pans or
  one send across the eight tracks in view, chosen on the upper display buttons, with an arrow at
  the right end when there are more sends than fit. The second press shows the selected track
  (Track Mix): its volume, pan and sends, and Input & Output on the second button.
- **Meters** read the app's levels from the frame. A track the frame does not name is drawn empty
  and marked as not measured.
- **Mute, Solo and Stop Clip** act on the selected track; held with a lower display button they act
  on that track; with **Lock** they stay on the lower buttons until let go.
- **Record** asks the app to record; **New** asks for a new scene, or a new clip under the Clip
  Workflow preference (`new-scene`, `new-clip`). A pedal in the first jack does what Record does,
  and what New does on a double tap.
- **Metronome, Quantize and Fixed Length** each do their job on a quick press and show their
  options on the display while held past the hold time. **Tap Tempo** sets the tempo from the
  gaps between taps. **Repeat** and **Accent** latch on a press and visit while held.
- **Automate** arms automation; while it is armed and the Set is recording, a turned parameter is
  asked with `automation: true`.

## Gestures

With a mouse and keys, as the emulator's legend says:

| On the unit | In a browser |
|---|---|
| Press | Click, or Space or Enter on the focused control |
| Hold several | Right-click a control, or press L on it, to latch it down; again to let go; Escape lets all go |
| Hard press | Alt-click a pad |
| Pressure | The wheel while a pad is held with the mouse; a pen or touch gives its own |
| Slide | Where on the pad it is clicked, then drag up or down |
| Bend | Drag sideways from a held pad, on to its neighbours |
| Turn | Drag up on a knob, the wheel, or the arrow keys |
| Touch a knob | Press and hold it without moving, or latch it |
| Nudge the jog wheel | The arrows at its sides |
| Play from the keys | Focus a pad, then the rows 1 to 8, Q to I, A to K and Z to comma |
| The pedals | A `pushinput` event on the surface (above) |

### Hold and press

Every combination the model knows, from `combinations()` (the table the model dispatches on, so
this list cannot drift from what it does; regenerate it from there when a combination is added).

| Hold | And press | Where | What it asks |
|---|---|---|---|
| Delete | Upper | Session Screen Mode | Delete the clip of the track above the button, in the selected scene |
| Duplicate | Upper | Session Screen Mode | Pick up the clip of the track above the button in the selected scene; pressed again after moving the selection, paste it there |
| Delete | Upper | Device View | Delete the device above the button |
| Mute | Upper | Device View | Switch the device above the button off or on |
| Save | Upper | Device View | Save the device or Rack above the button as a preset in the User Library |
| Shift | Upper | Device View | Mark the device above the button: marked devices can be grouped into a Rack, a marked Rack ungrouped |
| Delete | Encoder (touch) | Device View | Delete the parameter’s automation when it has any, else reset the parameter to its default |
| Mute | Lower | A screen with the track row | Mute the track above the button, leaving the selection as it is |
| Solo | Lower | A screen with the track row | Solo the track above the button, leaving the selection as it is |
| Stop Clip | Lower | A screen with the track row | Stop Clip the track above the button, leaving the selection as it is |
| Record | Lower | A screen with the track row | Arm or disarm the track above the button |
| Duplicate | Lower | A screen with the track row | Duplicate the track above the button |
| Delete | Lower | A screen with the track row | Delete the track above the button |
| Shift | Lower | A screen with the track row | Show the track’s options (Rename, Group, Freeze, Flatten) and its colours on the pads; a further track adds it for grouping |
| Lock | Mute | A screen with the track row | Lock Mute to the lower display buttons, until Lock or Mute is pressed again |
| Lock | Solo | A screen with the track row | Lock Solo to the lower display buttons, until Lock or Solo is pressed again |
| Lock | Stop Clip | A screen with the track row | Lock Stop Clip to the lower display buttons, until Lock or Stop Clip is pressed again |
| Shift | Save | Any | Save the Set as a new version in its project |
| Duplicate | Save | Any | Save the Set as a new project |
| Session | New | Any | Make a new empty Set |
| Shift | Record | Control Mode | Record in the other view: the Arrangement when Session is in focus, Session when the Arrangement is |
| Shift | Automate | Any | Re-enable all overridden automation |
| Delete | Automate | Any | Delete all automation in the clip |
| Shift | Duplicate | Clip Workflow | Make a new scene holding all playing clips |
| Shift | Stop Clip | Any | Stop all clips |
| Shift | Dpad Centre | Session | Launch the selected clip (Scene Workflow) or the selected scene (Clip Workflow): the other of what the centre does alone |
| Shift | Undo | Any | Redo the last undone change |
| Select | Pad | Session Pad Mode | Select the clip without launching it, and show its name |
| Delete | Pad | Session Pad Mode | Delete the clip |
| Duplicate | Pad | Session Pad Mode | Pick up the clip; the next pad pressed takes a copy of it |
| Shift | Pad | Session Pad Mode | Show the colours on the outer ring of pads, to give the clip one |
| Shift | Layout | Session Pad Mode | Lock the Session Overview on the pads until Layout is pressed again |
| Select | Pad | Note Mode, a Drum Rack | Select the drum pad without sounding it |
| Mute | Pad | Note Mode, a Drum Rack | Mute or unmute the drum pad, without sounding it |
| Solo | Pad | Note Mode, a Drum Rack | Solo or unsolo the drum pad, without sounding it |
| Delete | Pad | Note Mode, a Drum Rack | Delete the drum pad’s notes from the clip when it has any, else the pad’s devices |
| Duplicate | Pad | Note Mode, a Drum Rack | Pick up the drum pad’s devices; the next pad pressed takes a copy of them |
| Shift | Pad | Note Mode, a Drum Rack | Show the colours on the outer ring of pads, to give the drum pad one |
| Quantize | Pad | Note Mode, a Drum Rack | Quantize the drum pad’s notes only |
| Mute | Pad | Note Mode, a drum sequencer | Mute or unmute the notes in the step, without removing them |
| Duplicate | Pad | Note Mode, a drum sequencer | Pick up the page of steps; the next loop length pad pressed takes a copy, added to what is there |
| Delete | Pad | Note Mode, a drum sequencer | Clear the page of steps |
| Shift | Layout | Note Mode, a Drum Rack or a melodic sequencer | Lock the borrowed controls (velocity pads, or the loop length pads) until Layout is pressed again |
| Duplicate | Pad | Note Mode, Melodic Sequencer + 32 Notes | Pick up the step’s notes; the next step pressed takes a copy of them |
| Duplicate | Pad | Note Mode, a melodic sequencer with its loop length row shown | Pick up the page of steps; the next loop length pad pressed takes a copy, added to what is there |
| Delete | Pad | Note Mode, a melodic sequencer with its loop length row shown | Clear the page of steps |
| Select | Strip (touch) | Note Mode, a playing layout | Switch the touch strip between pitch bend and the modulation wheel |

A quick press and a hold of the same button differ by `HOLD_MS`. A second press of a track's lower
display button within `DOUBLE_MS` arms the track.

## More values to tune

Beside the table under "Values to tune on a unit":

| What | Where | Now |
|---|---|---|
| How long the power button is held | `model/timing.ts` `POWER_HOLD_MS` | 3000 ms |
| A fine turn (Shift held) | `FINE` | a tenth of a step |
| One encoder step of a continuous parameter | `TURN_STEP` | 1/127 of its range |
| Encoder steps for one move of a list or a choice | `STEPS_PER_CHOICE` | 4 |
| How long an encoder stays touched after a wheel notch | `layouts/Surface/surfaceInput.ts` `WHEEL_TOUCH_MS` | 350 ms |
| The display's three type sizes, in its own pixels | `layouts/Display/Display.css` | 12, 15 and 26 |
| How light the dark display's ground may be, and how dark type in a lamp's colour may be | `layouts/Display/Display.css` | lightness 0.2 and 0.72 (OKLCH) |
| How much of the print colour an unlit pad is | `layouts/Surface/Surface.css` | 10 percent, the rest see-through |

## Where the manual left a choice

| The question | What was decided |
|---|---|
| The body's depth | 318 mm, from Ableton's technical specifications. The plan's design said 304, from memory. |
| Colour values, hold times, encoder acceleration, the typeface | The manual prints none. Each is a named value marked `// added`, listed in the tables above. |
| User Mode numbers for the Push 3's new controls | The controls the Push 2 shares keep its published numbers; the new ones take free control numbers (`model/midi.ts`). |
| Which colours the pads show when one is chosen | For a track, all 64 pads show the table in a fixed order. For a clip or a drum pad, the outer ring of pads shows them, so the pads inside still play. The current colour pulses. |
| What a touched parameter looks like | Its name, its value at the large size on a line of its own, and a smaller dial under them. The manual's figures show the emphasis and not its measure. |
| The display in a pack whose dark ground is not dark | A screen is a lit screen: its ground is the pack's, solid, and no lighter than a screen is; type in a lamp's colour is no darker than can be read on it. Under `push-3` both rules change nothing. |
| A lamp's darker and lighter versions on a light body | One rule each, toward the unlit pad or toward white. On a light body a "darker" lamp is paler, not darker: it is less lit. |

### Known gaps

- A lesson's link to further material is shown as its address in text. The unit shows a code image.
- Holding a switch's display button to map it (the manual's Map by hold) is not modelled; mapping
  goes through the macro screen.
- A one-shot Simpler's Gain is in its second bank, not its first.
- `.svelte` files are not type-checked (the project's standing limit); the plays run every scenario
  in both renderers.

## Evidence

`docs/push/` holds zen's own renders (React, at the widths named). The manual's figures are not
kept in the repo: each render was read against its figure, and the control figure was compared by
measure.

- **The face against the manual's control figure**: the surface was drawn at 760, 1100 and 1500
  pixels wide (`surface-760.png`, `surface-1100.png`, `surface-1500.png`) and every one of its 147
  controls and the display laid over the figure. At all three widths every centre fell inside its
  white shape on the figure.
- **Packs and modes**: `emulator-push-3-dark.png`, `emulator-push-3-light.png`,
  `emulator-linear-dark.png`, `emulator-linear-light.png`, and at 900 and 1800 wide
  (`emulator-push-3-dark-900.png`, `emulator-linear-light-900.png`, `emulator-push-3-dark-1800.png`).
  The Theme scenario named Legible In Every Pack measures every legend and every display text
  against its ground in all thirteen packs, light and dark: 4.5 to 1 for anything that can be
  pressed or read, 2 to 1 for the print of a control that is unavailable.
- **The pads**: `pads-64-notes.png`, `pads-loop-selector.png`, `pads-64-pads.png`, `pads-session.png`.
- **The display**: `display-device-view.png`, `display-rack-unfolded.png`, `display-drum-rack.png`,
  `display-simpler.png`, `display-simpler-slicing.png`, `display-mix.png`, `display-clip.png`,
  `display-clip-audio.png`, `display-session.png`, `display-browser.png`, `display-sets.png`, and
  Device View in a light pack (`display-device-view-linear-light.png`).
- **Setup**, tab by tab: `setup-status.png`, `setup-expression.png`, `setup-sensitivity.png`,
  `setup-audio.png`, `setup-midi.png`, `setup-pedals-cv.png`, `setup-preferences.png`,
  `setup-software.png`, and a lesson (`setup-learn.png`).

## Checks

```sh
npx vitest run src/library/push          # the model's table tests
node scripts/push-stories.mjs            # every Push story's play, in React and Svelte, against a served Storybook
node scripts/push-stories.mjs "Push/Screens/Theme" --theme linear --mode light   # the same plays in another pack
node scripts/push-stories.mjs push-screens-theme--reduced-motion --reduced-motion
npx tsx scripts/push-stories.ts push-setup   # regenerate a capability's stories from its spec
```

`scripts/push-stories.mjs` asks the Storybook at `http://localhost:6006` (or `--url`, or
`PUSH_PREVIEW_URL`); start one with `node ~/Projects/satoramoto/zen-flow/herdr/scripts/previews.mjs ensure <project>`.

