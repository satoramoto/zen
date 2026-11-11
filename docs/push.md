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
