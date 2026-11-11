# Proposal

## Why

Developers who write for Ableton Push 3 (control scripts, Max for Live devices, companion apps)
have no unit on the desk most of the time, and no faithful stand-in on screen. Zen already draws
controllers and DAW panes from tokens; replicating the whole Push 3 surface and its display's
interface system is the hardest test of that system so far, and the basis for a Push 3 emulator.
It is also a deliberate benchmark: one model (Fable 5.2) specifies and builds a complete,
documented hardware interface from its manual.

## What Changes

Source: the Ableton Push 3 manual (ableton.com/en/push/manual, the September 2025 edition) and
its figures. Everything the manual describes is in scope, for both configurations (standalone and
controller).

- **A new area, `push`** (`src/library/push/`, sidebar `Push`): the surface's parts, the display's
  screens, and a pure model of the device. React and Svelte bindings from one view tree, like every
  other area.
- **The whole surface, laid out as the unit is.** 64 pads, eight encoders over the display, the
  Volume and Swing & Tempo encoders, the jog wheel, the touch strip, sixteen display buttons, eight
  scene and repeat-interval buttons, the Session D-pad, all forty-two labelled buttons, and the rear
  panel's ports. Positions and proportions come from the manual's control figure, held in one
  layout table.
- **Expressive input from a pointer.** A pad press carries velocity, pressure, slide and per-note
  pitch bend; an encoder is touched, turned and (where the unit allows) pressed; the jog wheel is
  turned, pressed and nudged. Mouse, touch, pen and keyboard all reach every control.
- **The display's interface system.** A 960 by 160 screen in eight columns that line up with the
  encoders and display buttons, with its parts (parameter cells, tabs, track row, lists and menus,
  piano roll, waveform, clip grid, meters, text entry, code dialogs, notices) and every screen the
  manual shows: Device, Mix (global, track, input and output), Clip (MIDI and audio, note edit),
  Session, Browse and Hot-Swap, Sets, Scale, the hold menus (Metronome, Quantize, Fixed Length),
  Setup's eight tabs, Learn and User Mode.
- **A behaviour model with no audio and no MIDI.** Pure functions over plain data: the app gives a
  Set and holds the device's state; an input returns the next state and the intents the device
  asks; a projection returns every lamp and the display. Modes, layouts, Shift and hold
  combinations, momentary and latched presses, workflows, locks and step editing are all in it.
- **A `push-3` theme pack** that reproduces the unit's look from tokens (matte black body,
  translucent pads, lit legends, the display's black ground and track colours). Any other pack
  recolours the whole device.
- **An assembled emulator screen in Storybook** with a stand-in host and a sample Set, so the whole
  device can be played in a browser.

Not in this change: sound, a MIDI or USB wire protocol, a display feed for real control scripts,
Live's own screens, and the emulator app itself (it is built on this, in its own repo).
`PushTwin` (the live pane) is left as it is.

## Capabilities

### New Capabilities

- `push-surface`: the control inventory, its layout, labels, lamps, sizing and access by pointer
  and keyboard, and the rear panel.
- `push-pads`: the 8 by 8 grid as an expressive input and a lamp matrix, with the expression modes
  and the sensitivity curve.
- `push-encoders`: the rotary and linear controls: the eight encoders, Volume, Swing & Tempo, the
  jog wheel, the touch strip and the Session D-pad, and their gestures.
- `push-display`: the display's frame, grid and shared parts, and the rules every screen follows.
- `push-device-model`: the plain-data contract between an app and the device: the Set, the device
  state, inputs, intents and the projection to lamps and display, with modifiers and modes.
- `push-note-mode`: playing melodies: the 64 Notes layout, keys and scales, octaves and the touch
  strip.
- `push-drum-mode`: playing and arranging drums: Loop Selector, 16 Velocities, 64 Pads and 64
  Slices, pad selection, colour, mute, solo, copy and delete.
- `push-step-sequencing`: the drum and melodic sequencers, Melodic + 32 Notes, step size, loop
  length and pages, and per-step editing and automation.
- `push-session`: Session Screen Mode, Session Pad Mode, Session Overview, scenes, and the Scene
  and Clip workflows.
- `push-device-view`: Device View: the device chain, parameter banks, Racks, chains, drum pads and
  macros, and acting on devices.
- `push-mix-view`: Global and Track Mix Modes, input and output routing, the Main track, track
  options, and the track actions (stop, mute, solo, lock, arm).
- `push-clip-view`: Clip View for MIDI and audio clips: loop and crop, zoom, Note Edit mode,
  warping, audio edit and Convert.
- `push-sampling`: Simpler's three playback modes on the device, slicing, and its edit options.
- `push-browser`: Browse and Hot-Swap Modes, Collections, Packs, the Set Library, and saving,
  renaming and deleting content.
- `push-recording`: transport, recording and overdub, count-in, Fixed Length, Repeat, Accent,
  Capture, Quantize, the metronome, tempo and swing, automation, and undo.
- `push-setup`: the Setup menu's eight tabs, power and battery, Wi-Fi, Link, Cloud, authorization
  and pairing dialogs, Learn, and User Mode.
- `push-theme`: the `push-3` pack and the lamp colours, and how another pack recolours the device.

### Modified Capabilities

None. `library-structure` gains a declared area, which its requirements already allow.

## Impact

- **Existing parts first:** the device is drawn from zen's existing components (`LampButton`,
  `Pad`, `KnobReadout`, `Fader`, `FolderList`, `PianoRoll`, `Music.Waveform`, `Music.Meter` and
  others), themed by the pack. An existing component gains at most one prop at a time, each in
  its own commit; a new component is written only where the pack and an existing part cannot
  carry the use (design D10 lists each part and where it starts).
- **New code:** `src/library/push/` (`model/`, `components/`, `layouts/`, `screens/`), exported as
  the `Push` namespace from `@satoramoto/zen` and `@satoramoto/zen/svelte`, with the model also
  reachable without a renderer.
- **Shared files** (each in its own small commit): `structure.ts` (the area), the contract, tier
  and bindings-only checks' scan lists, `foundation/themes/` (the `push-3` facets and the lamp
  table), `packs.ts`, `index.ts`, `svelte.ts`, the view registries.
- **Docs:** `docs/push.md` (the reference for building an emulator on it), a line in `AGENTS.md`.
- **No new dependencies.** No change to existing components' behaviour.
- **Size:** seventeen capabilities, 291 requirements, 425 scenarios (each one a story play). The build is phased so the surface,
  the model's core and the display shell land and are usable before the modes.

## Validation

**Before merging:**

- Every scenario is a Storybook play that passes in both renderers (`npm run build:storybook`,
  then the story test run CI uses), and `story-spec sync --change push-3-surface --check` reports
  nothing.
- `npm run typecheck`, `npx vitest run src/library` (the model's unit tests, tiers, structure,
  contract, bindings-only, parity), `npm run build:lib` then `npm run check:lib`.
- `openspec validate push-3-surface --strict`.
- Browser evidence, since builds and plays do not show layout: the assembled device next to the
  manual's control figure at three widths, and each display screen next to its manual figure,
  in the `push-3` pack and one other pack, dark and light.
- CI's `checks` job on the pull request.

**While building:** after each task group, `npm run typecheck`, the group's own plays, and
`npx vitest run src/library/push` for the model. After any group that adds files:
`npx vitest run src/library/structure.test.ts src/library/tiers.test.ts`.

**Review:** `look`
