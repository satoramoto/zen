# Design

## Decisions

- **One components folder, not a sub-area.** Nesting the older parts as `music/instrument/` would
  have needed no renames and no check changes, but it keeps two lists. The person chose one folder.
- **The token-drawn part takes the new name.** `Music.Knob`, `Music.Meter` and `Music.Transport`
  are the fidelity-locked port and are imported by mix[flow] under those names. The token-drawn
  ones are named for what they are: `KnobReadout` sits with `BarReadout`, `TempoReadout`,
  `ChordReadout` and `SendReadout` (a dial showing a value the host formats); `LevelMeter` and
  `TransportBar` say the same thing as before with a word that tells them apart.
- **Old root names stay as aliases.** Removing `Knob`, `Meter` and `Transport` from the package
  root would break `big-red-synth` and `visuals` for no gain in this change.
- **`music/root.ts` for the flat exports.** `music/index.ts` is the `Music` namespace, so the
  flat names need their own lower-case entry file; an area root may hold one.
- **Scan all of `music/` and record the toolkit's findings**, rather than list which folders are
  token-drawn. A list of held folders would let a new part be added unheld; a recorded baseline
  holds every folder, the old parts at zero and the toolkit where it is.
- **A named excuse list for the token contract.** `library.test.tsx` has no counts to record, so
  the port's files are named in `PORT_VOCABULARY`, with a test that each still needs it.

## Risks

- A part's registry name changes (`Knob` to `KnobReadout`). A tree in an app that draws
  `component('Knob', …)` through zen's registry would stop resolving. No app does: the registry
  is not exported.
- Story ids under `instrument-components-` change. Scripts and docs in the repo are rewritten by
  the move; links from outside are not.
