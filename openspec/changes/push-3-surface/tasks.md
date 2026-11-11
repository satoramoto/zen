# Tasks

Branch `change/push-3-surface`. Every scenario in `specs/` becomes a `scenario()` story with
`parameters.spec` naming its capability; "its scenarios play" below means those stories pass in
both renderers. Each group ends by running the while-building checks from the proposal.

## 1. Ground: the area, the checks and the pack

- [x] 1.1 Declare the `push` area in `structure.ts` (`AREAS`, sidebar `Push`) in its own commit; `npx vitest run src/library/structure.test.ts` passes with an empty `src/library/push/index.ts`
- [x] 1.2 Add `push` to the tier scan, the contract scan (`library.test.tsx`) and the bindings-only scan, each with a baseline of zero, one commit each; the three tests pass and a deliberately literal colour in a scratch file fails the contract test (then remove it)
- [x] 1.3 Add the `push-3` palette, face and material and the `push-3` pack (source: the manual's URL; `keep` rules from design D9) in `foundation/themes/`, values not in the source marked `// added`; the pack appears in the theme picker story and `npx vitest run src/library` passes
- [x] 1.4 Add `foundation/themes/lamps.ts`: the indexed lamp table, the neutral fallback and the derived-shade rules, with unit tests for an unknown index and for each derived shade of every entry
- [x] 1.5 Write `docs/push.md` (what the area is, the three shapes, the sources) and add the area's paragraph to `AGENTS.md`; both name only files that exist
- [x] 1.6 Run `npm run typecheck` and `npx vitest run src/library/structure.test.ts src/library/tiers.test.ts`; both exit 0
- [x] 1.7 Fit review (design D10): in a scratch story, draw every row of D10's table from its existing component in the `push-3` pack at the unit's size, in both renderers; record in `docs/push.md` one verdict per part (as it is, one named prop, or new) with its reason; no part in groups 3 and 4 is built before its verdict is written, and a part that would need more than one prop on a component is brought back to the person as a new-component decision

## 2. The model's core

- [x] 2.1 Write `push/model/layout.ts`: every control's id, cluster, legend, accessible name, centre and size in millimetres, measured from the manual's control figure; a unit test counts 64 pads, 11 rotary controls, 16 display buttons, 8 scene buttons, 5 D-pad parts, 42 labelled buttons and checks the eight columns share centre lines; confirm the body's 380 by 304 mm against Ableton's tech specs and record the source in the file
- [x] 2.2 Define `PushSet`, `PushState`, `PushInput`, `PushIntent`, `Lamp` and `Screen` as plain-data types with a JSON round-trip test for each
- [x] 2.3 Implement `step` and `project` as the layered composition of design D3 with only the power and global-button layers filled in; table tests cover purity (same inputs, same result), an unknown control, and time arriving with the input
- [x] 2.4 Implement modifiers and timing: press versus hold, hold-as-modifier suppressing the press job, Shift and Select, momentary mode buttons, the `tick` input; the timing constants live in one file marked `// added`; table tests for each `push-device-model` requirement on presses and holds
- [x] 2.5 Implement the published combination list as the dispatch table itself, with a test that every entry is reachable by `step`
- [x] 2.6 Implement User Mode and the pedal inputs in the model, with table tests
- [x] 2.7 Add the scripted runner (a list of inputs in, intents and screens out) and a Node test that runs a session with no DOM
- [x] 2.8 Decide the renderer-free export for the model (design D11), add it to `package.json` exports and `vite.lib.config.ts`; `npm run build:lib && npm run check:lib` pass and show no React in its chunk
- [x] 2.9 Build a sample Set fixture (`push/model/sample.ts`): eight or more tracks of each kind, a synth, a Simpler, a Drum Rack, an Instrument Rack with macros, effects and Tuner, clips, scenes, a browser tree, unit readings; a test checks it against the `PushSet` type's invariants
- [x] 2.10 Run `npx vitest run src/library/push` and `npm run typecheck`; both exit 0

## 3. The surface

- [x] 3.1 Draw the labelled, display and scene buttons from `LampButton` per the fit review (legend or icon, accessible name, lamp states, down and up with time, up on removal); any prop it gains is one prop in `LampButton`'s own commit with its fixture, story and snapshot; `ButtonBar` is a layout
- [x] 3.2 Build `PadGrid` drawing `Pad` faces per the fit review (lamp colour and state as local variables on each cell, pressed look, focus and arrow-key movement) with fixtures and stories
- [x] 3.3 Build the pad input store (`pad.bind.ts`): velocity, pressure, slide, per-note bend across pads, multi-touch, the mouse and keyboard gestures of design D7, the sensitivity curve function; unit tests for the curve and bend maths, plays for the gestures
- [x] 3.4 Draw the encoders from `KnobReadout` per the fit review; build the jog wheel (turn, press, touch, nudge) and the touch strip from an existing part or new as the review found, with their stores, fixtures and stories; the D-pad is a layout of buttons
- [x] 3.5 Build the `SceneColumn` layout and `RearPanel` (ports with plugged state, the power button's hold) with fixtures and stories
- [x] 3.6 Build the latch gesture for holding several controls with one pointer, and the lamp animation store (pulse and blink phase from the beat, free-running without one, steady marks under reduced motion)
- [x] 3.7 Build the `Surface` layout from the layout table with the single scale property, its smallest size, and the four region layouts
- [x] 3.8 Write the `push-surface`, `push-pads` and `push-encoders` scenario stories; they play in React and Svelte
- [ ] 3.9 Browser evidence: overlay `Surface` on the manual's control figure at three widths and save the comparison under `docs/push/`; every control's centre falls inside its outline
- [x] 3.10 Run the while-building checks; all exit 0

## 4. The display shell

- [x] 4.1 Build `Display` (the 960 by 160 box, eight columns, top row, body, bottom row, overlays, the pixel scale property, the three type sizes, the dark-ground option) from a `Screen`
- [x] 4.2 Draw the parameter cell from `KnobReadout`, `Toggle`, `Segmented` and `SendBars` per the fit review (arc, bipolar arc, choice list, switch, bar, touched emphasis, greyed, automation dot, column spans) with fixtures for each kind
- [x] 4.3 Draw the tab row and the track row from existing parts per the fit review, new only where it says so (selected block, colours, kind icons, armed circle, clip progress bar, fold underline, paging arrows)
- [x] 4.4 Draw the menu columns from `FolderList` and `PageList` (highlight, chevrons, enclosing columns, scrolling, loading), and text entry, the code dialog, the confirmation and notices from existing parts, per the fit review
- [x] 4.5 Build the status overlays (battery mark, count-in bar, progress bar) and the empty, blank and User Mode states
- [x] 4.6 Wire display-button lamps to the top and bottom rows in `project`, and the jog wheel and D-pad list rule in `step`
- [ ] 4.7 Write the `push-display` scenario stories; they play in both renderers
- [ ] 4.8 Run the while-building checks; all exit 0

## 5. The assembled device and its look

- [x] 5.1 Build `bindPushDevice` (the store that holds state, calls `step`, schedules `tick`, feeds the frame reader) and the stand-in host used by every screen's stories
- [x] 5.2 Build the `Emulator` screen: `Surface`, the host over the sample Set, the gesture legend and a state and intent inspector; it loads in Storybook and a play presses Play and sees the intent
- [ ] 5.3 Write the `push-device-model` scenario stories against the host; they play in both renderers
- [ ] 5.4 Write the `push-theme` scenario stories (the pack, another pack, light mode with the dark display, lamp table, picker, reduced motion, bloom with brightness); they play
- [ ] 5.5 Browser evidence: the emulator in `push-3` and one other pack, dark and light, saved under `docs/push/`; legends and display text meet the library's contrast check
- [ ] 5.6 Export the `Push` namespace from `index.ts` and `svelte.ts` and register the parts in the view registries, one line per part, in their own commit; `npm run build:lib && npm run check:lib` pass
- [ ] 5.7 Run the while-building checks; all exit 0

## 6. Tracks, mixing and recording

- [x] 6.1 Model: track selection, the row's scrolling, arming rules by mode, Mute, Solo, Stop Clip (with the held lamps), Lock, exclusive arm and solo, duplicate and delete from the row; table tests
- [x] 6.2 Draw the mix strip from `Fader`, `Music.Meter` and `SendBars` per the fit review (meter from the frame reader with peak hold, volume mark, dB reading) and the Global Mix, Track Mix, Input & Output and Main screens in `project`, with send paging and unfolding of groups and Racks
- [x] 6.3 Model and screens: track options (Rename, Group, Freeze, Flatten, colours on the pads)
- [x] 6.4 Model: transport, Record's three-step cycle and lamp, New, Capture, Undo and redo, Delete and Duplicate alone, Tap Tempo, Automate, Arrangement recording in Control Mode
- [x] 6.5 Model and screens: the hold menus (Metronome, Quantize, Fixed Length), Repeat and Accent (latch and momentary, per track), the Volume and Swing & Tempo notices
- [x] 6.6 Write the `push-mix-view` and `push-recording` scenario stories; they play in both renderers
- [ ] 6.7 Add the Mix and recording sections to `docs/push.md`; run the while-building checks

## 7. Playing: notes and drums

- [x] 7.1 Model: the 64 Notes pad map for every key, scale, interval layout, In Key and Chromatic, Fixed, octave; table tests against hand-written grids for C major 4ths, 3rds and Sequential and one other key
- [x] 7.2 Model and screen: the Scale menu, the octave notice, layout cycling and per-track memory, sounding-note lamps from the Set, the touch strip's pitch bend and modulation
- [x] 7.3 Model: the drum layouts (Loop Selector, 16 Velocities, 64 Pads, 64 Slices' fill order), pad state colours, banks and rows, Select, Mute, Solo, Delete, Duplicate, Quantize and the colour picker on pads, Layout's momentary and locked borrowing; table tests
- [x] 7.4 Write the `push-note-mode` and `push-drum-mode` scenario stories; they play in both renderers
- [ ] 7.5 Browser evidence: the pads in 64 Notes, Loop Selector and 64 Pads beside the manual's figures, saved under `docs/push/`; run the while-building checks

## 8. Step sequencing

- [x] 8.1 Model: the drum sequencer's steps, colours, playhead, step size from the scene buttons (triplets unlit), mute and velocity per step
- [x] 8.2 Model: loop length pads (hold and tap, double tap, single-tap lock, colours), follow, Page Left and Right, copy and clear a page
- [x] 8.3 Model: the Melodic Sequencer (rows, range by octave, note and strip, its loop row) and Melodic + 32 Notes (selection, multi-step, held step's notes, copy a step, fifth-row loop pads)
- [x] 8.4 Model: held steps taking over the encoders in Clip, Device and Mix View, and all-steps-of-a-pad editing
- [x] 8.5 Table tests for 8.1 to 8.4, then the `push-step-sequencing` scenario stories; they play in both renderers; run the while-building checks

## 9. Session

- [x] 9.1 Draw the clip grid (from `LaunchGrid` or `LoopGrid` if the fit review found one fits, else new) and the Session Screen Mode screen (eight by eight, names, selection outline, scene numbers and names on jog touch, upper-button launch lamps)
- [x] 9.2 Model: Session Pad Mode's lamps and presses (launch, stop, record), scene launch from three places, the window's movement apart from selection, the shared window and its report for the Session Ring
- [x] 9.3 Model: Select, Duplicate, Delete and colour on pads and from the screen, Session Overview (momentary, locked, blocks of 64 scenes), the Scene and Clip workflows, the up and down arrows from Clip View
- [x] 9.4 Table tests, then the `push-session` scenario stories; they play in both renderers; run the while-building checks

## 10. Device View, Racks and sampling

- [x] 10.1 Model and screen: the device chain, banks as tabs, generic banks of eight for an undescribed device, encoder intents by parameter kind, the empty track state
- [x] 10.2 Build the device drawings (envelope, filter curve, oscillator shape, spectrum, gain reduction, tuner) as span cells fed by readings
- [x] 10.3 Model: delete, mute and move devices; Rack icons, unfolding, chains by hold, Drum Rack pads in the bottom row, a tapped pad's chain with choke and transpose; group and ungroup; save as preset
- [x] 10.4 Model and screens: macro banks, Macro Map mode, macro edit, unmap, randomize and variations with their menu
- [x] 10.5 Model: automation dots, Delete with an encoder, automation-marked intents while recording
- [x] 10.6 Draw the waveform from `Music.Waveform` inside a `MusicScope` node per the fit review, and Simpler's screens: the three modes' banks, slice markers, manual pad slicing, nudge, split and delete, Edit Mode's actions, the Rack-wrapped preset
- [x] 10.7 Table tests, then the `push-device-view` and `push-sampling` scenario stories; they play in both renderers
- [ ] 10.8 Browser evidence: Device View, an unfolded Rack and Simpler beside the manual's figures; run the while-building checks

## 11. Clip View

- [x] 11.1 Draw the piano roll from `music/components/PianoRoll` per the fit review (notes by velocity and pad colour, beat marks, markers, playhead from the frame reader, the sequenceable box, the pitch strip with density lines) and reuse the waveform for audio
- [x] 11.2 Model and screen: loop on and off with its parameters, Shift for sixteenths, Crop, Zoom around the last-moved position, real-time fit
- [x] 11.3 Model and screen: Note Edit mode (highlight, selection, the eight parameters, ranges, Select All, Delete), audio warp controls and audio edit (Set 1.1.1, Warp to Grid)
- [x] 11.4 Model: Convert's offers by selection and edition, Quantize's quick press, Double Loop, the empty audio slot
- [x] 11.5 Table tests, then the `push-clip-view` scenario stories; they play in both renderers; run the while-building checks

## 12. Browser and Sets

- [x] 12.1 Model and screen: Browse Mode (the Add menu, lazy folders with loading, load and leave, adding tracks, the path encoder, remembered place), Preview, Favorites and Collections
- [x] 12.2 Model: Hot-Swap Mode (opening at the source folder, staying open, Load Next and Previous, a single drum pad with its blink, pads still playing)
- [x] 12.3 Model and screen: Packs (installed, available, download progress, pause, install, cancel, offline, delete download, uninstall with confirmation)
- [x] 12.4 Model and screen: the Set Library (open, new, sort, Cloud label, Control Mode's list), the three saves, rename and delete from the item menu, Session with New
- [x] 12.5 Table tests, then the `push-browser` scenario stories; they play in both renderers; run the while-building checks

## 13. Setup, power, Learn and User Mode

- [x] 13.1 Screens: the Setup menu's eight tabs from the unit readings, each change an intent; Status (mode switch, battery, storage, name, brightness, Wi-Fi list, connect and forget, hotspot, Link, Play Sync) with the processor-less variant
- [x] 13.2 Screens: Expression, Sensitivity (the curve drawing with live press marks, Reset), Audio (rates, buffer, preamps, gain, meters, link, outputs, clock), MIDI (ports, input and output switches, External Sync), Pedals & CV, Preferences
- [x] 13.3 Screens: Software (licence, Authorize, usage data, update with progress and cancel, the Shift options, Reset with confirmation) and the code dialogs for authorization, Cloud, crash reports and pairing
- [x] 13.4 Model and screens: starting up and onboarding, low battery and safe shutdown, off; Learn's lessons; the User button's availability and the User Mode notice; the Volume encoder's choices from the Set
- [x] 13.5 Wire brightness and display light to the surface, and the Expression and Sensitivity settings to the pad input store
- [x] 13.6 Table tests, then the `push-setup` scenario stories; they play in both renderers
- [ ] 13.7 Browser evidence: each Setup tab beside its manual figure, saved under `docs/push/`; run the while-building checks

## 14. Integration

- [ ] 14.1 A scripted end-to-end session in the `Emulator` screen as one play: add a drum track from the browser, sequence a beat, record a melody, launch scenes, mix, save; every step's intent is seen by the host
- [ ] 14.2 A play asserts that changing one pad's pressure sets a property and re-renders no other pad, and that a meter update re-renders no screen cell
- [ ] 14.3 `story-spec sync --change push-3-surface`, then `--check` reports nothing; review the regenerated deltas against this change's and reconcile any requirement text the stories sharpened
- [ ] 14.4 Finish `docs/push.md`: the gesture table, the timing constants to tune on a unit, the manual's inconsistencies and how the spec resolved them, how to build an emulator app on the entries; every command and import in it runs as written
- [ ] 14.5 Final browser pass of the whole device against the manual's control figure and each main screen's figure in `push-3` and one other pack, dark and light, at three widths; the images are in `docs/push/`

## 15. Merge

- [ ] 15.1 `npm run typecheck`, `npx vitest run src/library`, `npm run build:storybook` and its story test run, `npm run build:lib` then `npm run check:lib`, `openspec validate push-3-surface --strict` and `story-spec sync --change push-3-surface --check` all pass; pull request from `change/push-3-surface` merged by auto-merge when the `checks` job passes, branch deleted

## Workflow follow-up

- Archive the change (`/opsx:archive`) once merged, showing the spec changes.
- Review is `look`: after merging, point the person at the `Push/Screens/Emulator` story, `docs/push.md` and the comparison images in `docs/push/`.
