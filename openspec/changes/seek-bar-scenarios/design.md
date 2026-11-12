# Design

## Context

See proposal.md for why. What shapes the approach:

- Today the six SeekBar stories each run several checks in one play. `Default` alone presses,
  drags, releases, uses the keys, cancels with Escape, and ends a press without a pointerup.
- The pointer checks compute where to press from the slider's box. On zen-stories' virtual DOM
  that box is empty, so those stories are tagged `browser`.
- The 2026-11-07 trial (commit 49d0836, dropped from `main` in dc3ded6) already split these
  checks into thirteen scenarios. Their words were reviewed then and are in the old delta in the
  zen-flow store.
- zen plans in its own `openspec/`, and `story-spec sync` writes under the root that
  `openspec context` reports. Run from zen, that is zen's root, not the store.

## Goals / Non-Goals

**Goals:**

- Every assertion in today's stories is still made by some scenario.
- Each scenario's Given is real work done in its play, not just words in it.

**Non-Goals:**

- Changing the component, its CSS or the Svelte host story.
- Covering behaviour that no story checks today, such as a duration change cancelling a drag.

## Decisions

**Start from the trial's scenarios and words.** The thirteen scenarios and their two
requirements are kept as reviewed. Paths and imports follow the current layout
(`music/components/SeekBar`, `foundation/stories/story`, `preview.story`). Rejected: writing new
words, which would discard a review for no gain.

**A Given is done in `act`, before the When.** A scenario such as "a press at the middle", then
"the pointer drags to the right edge" presses inside `act`, then drags. The base story keeps no
play of its own. Rejected: giving each base story a play for its Given, which needs a factory per
Given for one line of setup.

**Tag per story, not on the meta.** Scenarios that press or drag at a position get
`tags: ['browser']` on their base story. `scenario()` keeps the base's tags. Keys, the inert
states and the out-of-range reading need no layout, so they play on the virtual DOM in pull
requests. Rejected: tagging the whole file `browser`, which plays four stories in a browser for
no reason.

**The plan moves to zen.** The store's copy is deleted once zen's copy is on `main`. The old
words survive in the store's history and in this design.

## Risks / Trade-offs

- [A scenario that only rereads what an earlier step set passes without testing anything] → each
  check reads the slider's attributes or `onSeek`'s calls after its own When.
- [The Svelte play differs from the React one] → `scripts/music-stories.mjs` plays both
  renderers before the merge.
