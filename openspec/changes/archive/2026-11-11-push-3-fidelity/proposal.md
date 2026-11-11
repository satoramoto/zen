# Proposal

## Why

`push-3-surface` shipped the whole device, and its own doc lists where it still differs from the
unit (`docs/push.md`, Known gaps). Two of those are requirements the main specs already state and
nothing shows: a lesson's code image (`push-setup`) and Map on a held switch (`push-device-view`).
Nine of the display's renders were also never laid beside a manual figure, so their layout is
unproven. An emulator a developer trusts has to agree with the unit in these places too.

## What Changes

- **A code image.** The display draws an address as a scannable code. A lesson that links to
  further material shows it, as the unit does (manual, 17: "using the QR code"). Today the
  address is text.
- **Map on a held switch.** Holding the upper display button of a device offers Map for its
  on/off switch (manual 4.3.1.1). Today only an encoder's parameter can be mapped.
- **Simpler's first bank follows the unit.** Mode sits on the eighth encoder in every mode.
  Slicing has Nudge on the fourth. One-Shot has Gain in the first bank, with Trigger and Gate as
  a pair of options on the display buttons. Today Mode is fourth, and Nudge and Gain are in the
  second bank. **BREAKING** for a page that relies on the sample Set's Simpler bank order; the
  banks stay the app's to give.
- **A choice shows its neighbours.** A touched parameter that takes one of a list shows the
  current choice large and the others dim beneath it. Today the current one is a solid block in
  a row.
- **Small pictures under Setup values.** In Tune Location shows a finger or a pad, and a MIDI
  port shows whether it is an input or an output.
- **The theme scenario says what is shown where.** "The pack is offered" claimed the picker
  shows the pack's source and rules. The picker lists the pack; the theme inspector shows its
  source and rules. The scenario is split in two and each is checked in its own UI.
- **The remaining renders are compared with their figures**: Pedals & CV, Preferences, 64 Notes,
  64 Pads, the unfolded Rack, Mix, Clip (MIDI and audio), Session and the browser. A render that
  disagrees with its figure in what is in which column, or how a thing is set out, is changed
  until it agrees, and `docs/push.md` records each one.
- **The story generator no longer points at a folder that is gone.** `scripts/push-stories.ts`
  defaults to the archived change's specs.

Not in this change: sound, MIDI in or out, and a bridge from the model to a real host. Those are
the emulator proper and want their own proposal and decisions.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `push-display`: three requirements added (a choice shows its neighbours, a code image, a small
  picture under a value).
- `push-setup`: Learn gains the code image's scenario; Expression and MIDI gain their pictures.
- `push-device-view`: mapping to a macro gains the held switch's scenario.
- `push-sampling`: where Mode, Nudge, Gain, Trigger and Gate sit.
- `push-theme`: "The pack is offered" becomes two scenarios.

## Impact

- `src/library/push/model/` (`sample.ts`, `layers/` for Device View, Setup and Learn, `host.ts`,
  `types.ts` for a value's picture and a dialog's code), with unit tests.
- `src/library/push/layouts/Display/` (the choice list, the picture, the code image's place).
- One new generic part, `components/CodeImage/` (see design D1), exported from the package root
  in its own commit, and one dev dependency to decode it in a test.
- `src/library/push/screens/` stories and plays for the new and changed scenarios; `docs/push.md`
  and `docs/push/` renders.
- `scripts/push-stories.ts`.
- No change to the contract, the packs or the lamp table.

## Validation

**Before merging:**

- Every new and changed scenario is a story that plays in both renderers:
  `node scripts/push-stories.mjs --renderer both` passes whole (it was 924 of 924 before this
  change), and `npx story-spec sync --change push-3-fidelity --dir src/library/push --check`
  reports nothing.
- `npm run typecheck`, `npx vitest run src/library`, `npm run build:storybook`,
  `npm run build:lib` then `npm run check:lib`.
- `openspec validate push-3-fidelity --strict`.
- Browser evidence: each of the nine renders named above beside its manual figure, read for what
  is in which column, in `push-3` dark; the code image scanned from the screen by a phone or
  decoded from a screenshot, in `push-3` dark and one light pack.
- CI's `checks` job on the pull request.

**While building:** after each task group, `npm run typecheck`, `npx vitest run
src/library/push` and that group's plays.

**Review:** `look`
