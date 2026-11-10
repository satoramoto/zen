# Proposal

## Why

`music/components` holds two meters and two transports. `LevelMeter` is a token-drawn copy of the
toolkit's `Meter`, and `TransportBar` a second take on the toolkit's `Transport`. The toolkit is
the cornerstone, so the copies are the odd ones, and a reader should not have to choose.

## What Changes

- **`LevelMeter` is removed.** MixBand draws `Music.Meter` inside a `MusicScope` node.
- **`TransportBar` is removed.** Yahaha's Show draws `Music.Transport` inside a `MusicScope` node.
- **`Music.Transport` takes on what `TransportBar` could do**, all optional, the reference
  rendering unchanged when unused:
  - `unit` and `onUnit`: the host may keep the reading's unit.
  - `onLoop`: the loop as plain data, its flips through a callback; `loop.onChange` is optional.
  - `loop.label`: the loop switch's accessible name.
  - `tempo.param` is optional: 20 to 300 BPM (`TEMPO_PARAM`) when absent.
  - Forms (`Transport.forms`): `bar`, and `compact` (play and the reading alone).
  - `Music` exports `TRANSPORT_FORMS`, `TRANSPORT_UNITS`, `clockText`, `positionText`,
    `readingText` and the transport's types.
- **BREAKING: the package root no longer exports** `Meter`, `LevelMeter`, `MeterProps`,
  `MeterLayout`, `MeterSide`, `Transport`, `TransportBar`, `TransportProps`, `TRANSPORT_FORMS`,
  `TRANSPORT_UNITS`, `clockText`, `positionText`, `readingText` or the transport's types; the
  Svelte entry no longer exports `Meter` or `LevelMeter`. They are `Music.Meter` and
  `Music.Transport`, inside `Music.Scope`.
- The two knobs both stay (`KnobReadout`, also exported as `Knob`; `Music.Knob`): they are
  different controls.

## Capabilities

### New Capabilities

- (none)

### Modified Capabilities

- `library-structure`: the music area has one meter and one transport.

## Impact

- MixBand's strip and return meters and Show's bar change appearance to the toolkit's.
- Two tree snapshots (MixBand, Show) change; the two parts' own snapshots, fixtures, stories
  and registry lines go.
- `openflowfm/visuals` imports `Meter` from the package root (`SourcePicker.tsx`). Its pinned
  zen predates this, so it keeps working until it bumps the pin or links this checkout; then it
  needs `Music.Scope` around `Music.Meter`. No other app imports a removed name.
- Story ids under `music-components-levelmeter--` and `music-components-transportbar--` are gone.

## Validation

**Before merging:** `npm run typecheck`; `npm test`; `npm run build:storybook`; `npm run build:lib`
then `npm run check:lib`; `npm run build`; the plays of `Music/Components/Transport` (with the new
Compact, HostUnit and LoopAsData stories), `Music/Components/Meter`, `Music/Components/MixBand`,
`Yahaha/Screens/Show` and `Core/Layouts/Workspace` in a served Storybook, both renderers, none
failing; MixBand and Show looked at in a browser; `openspec validate retire-music-duplicates
--strict`; the PR's required `checks` job.

**Review:** `look`. Afterwards: open `Yahaha/Screens/Show` and `Music/Components/MixBand`.
