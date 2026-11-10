# Proposal

## Why

The library has two music families in two areas: `instrument/` (27 token-drawn parts: Fader, Pad,
Keys, the readouts, the live workspace's parts) and `music/` (the mix[flow] toolkit and its live
surface). The sidebar shows them as two groups, a reader has to know which family a part is in
before they can find it, and three names (`Knob`, `Meter`, `Transport`) exist in both.
`library-structure` left them apart because of those names.

## What Changes

No part looks or behaves differently, and no app's import breaks.

- **One area.** The 27 parts of `instrument/components` move to `music/components`, beside the
  toolkit's. `instrument/` is no longer an area. Its entry becomes `music/root.ts` (what the
  package root exports flat) and its shared data `music/model/live.model.ts`.
- **A folder name is unique.** The token-drawn `Knob`, `Meter` and `Transport` become
  `KnobReadout`, `LevelMeter` and `TransportBar`: folder, files, component, props type and the
  name the view tree looks them up by. The package root and the Svelte entry export the new names
  and keep the old ones (`Knob`, `KnobProps`, `Meter`, `MeterProps`, `Transport`,
  `TransportProps`) as aliases. `Music.Knob`, `Music.Meter`, `Music.Transport` and `Music.Fader`
  are untouched.
- **The sidebar has one group.** `Instrument/Components/<Name>` becomes
  `Music/Components/<Name>`; story ids follow (`instrument-components-fader--…` is
  `music-components-fader--…`).
- **The checks follow the folder.** The checks that were keyed on `instrument` now scan `music`:
  - Tier rules: every folder of `music/` is counted. The token-drawn parts stay at zero. The
    toolkit's present findings (737, mostly its reference pixels and type) are recorded in
    `tiers.baseline.json` and can only go down. `music/live` parts are counted per part.
  - Bindings-only: all of `music/`. The toolkit already passes; its story helper `preview.tsx`
    becomes `preview.story.tsx`, the name a story harness has.
  - Token contract (`library.test.tsx`): all of `music/`, except the files named in
    `PORT_VOCABULARY` (24 files of the port that read the reference's own variables, radii or
    spectral colours). A second test fails when a listed file no longer needs the excuse, so the
    list only shrinks; a new music file is held to the contract.

Not in this change: retiring either of a duplicated pair (`LevelMeter`/`Music.Meter`,
`TransportBar`/`Music.Transport`), or bringing the toolkit's findings down.

## Capabilities

### New Capabilities

- (none)

### Modified Capabilities

- `library-structure`: music is one area whose components folder holds both kinds of part, and
  the component rules cover it.

## Impact

- 204 files move; the registries (`foundation/view/reactComponents.ts`, `svelteComponents.ts`,
  `stores.ts`, `snapshot.test.ts`), the two entries, Yahaha's models and the Workspace samples
  have their imports rewritten.
- Four tree snapshots (KnobBank, MixBand, ArpSequencer, Show) record the new component names.
- `tiers.ts`, `tiers.baseline.json`, `foundation/view/bindings.ts`, `library.test.tsx`,
  `structure.ts`, `.storybook/preview.ts`.
- `AGENTS.md`, `docs/structure.md`, `docs/music.md`, `docs/tiers.md` and the docs that name the
  old paths.
- Links from outside the repo to an `instrument-components-…` story id need the new id.
- Apps: none. `big-red-synth` imports `Knob` and `Fader`, `visuals` imports `Meter`; both names
  stay.

## Validation

**Before merging:** `npm run typecheck`; `npm test`; `npm run build:storybook`; `npm run build:lib`
then `npm run check:lib`; `npm run build`; every `instrument/…` key of the old
`tiers.baseline.json` present under its `music/…` key with the same counts; the snapshot diff
showing only component names; the plays of `Music/Components` (the moved parts and the three
renamed ones, both renderers where converted) and of `Yahaha/Screens` and
`Core/Layouts/Workspace`, which draw them, in a served Storybook, with the same plays failing as
on `main` and no others; `openspec validate merge-music-families --strict`; the PR's required
`checks` job.

**While building:** `npm run typecheck` after the move and after each rename.

**Review:** `look`. Afterwards: open `Music/Components` in the sidebar and read the table at the
top of `docs/music.md`.
