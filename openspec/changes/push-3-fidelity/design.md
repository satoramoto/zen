# Design

## Context

The Push area follows "existing components first" (`docs/push.md`, The fit review): a part is an
existing component under the pack, then that component with one more generic prop, and a new
component only for a large difference of function. The stories own the specs: a scenario is added
by writing its `scenario()` story, and `story-spec sync --change` writes the delta. The deltas in
this change were written first, by hand, as the plan; after the stories exist the sync must
reproduce them.

The manual's figures are Ableton's and are not committed. They are fetched into the session's
scratch folder, compared, and discarded.

## Goals / Non-Goals

**Goals:**

- The six known gaps closed, each as scenarios that play.
- Every display render compared with a figure, or named in the doc as having no figure.

**Non-Goals:**

- Sound, MIDI, a host bridge.
- Type-checking `.svelte` files (the project's standing limit).
- Any new pack, token or lamp colour.

## Decisions

### D1. The code image is a new generic component, `CodeImage`

Nothing in the library draws a matrix of modules, and no existing part can be given one with a
prop: this is the large difference of function the rule allows a new component for. It lives in
`src/library/components/CodeImage/` because a scannable code is generic (a share link, a pairing
address), not the Push's. Its model takes text and returns a view tree of one SVG path; its two
renderers are `<Tree/>`.

The encoder is written here, in the component's model: byte mode, error correction level M,
versions 1 to 10 (up to 213 bytes, enough for any address a lesson gives), about 250 lines with
no dependency. The alternative, a runtime dependency such as `qrcode-generator`, would reach
every app that installs zen for one small function. A text too long for version 10 draws
nothing and the display falls back to the address in text.

It is tested by decoding: a dev dependency (`jsqr`) reads the model's matrix back in a unit test
for a short, a long and a non-ASCII address.

Its colours are the one place the display's "coloured type on a dark ground" is reversed: the
modules are `--surface-0` on a `--text-1` ground with a four-module quiet zone, in every pack and
mode, because a scanner needs dark on light.

### D2. A choice list is `Text` in the cell, not a changed `Segmented`

The unit sets the current choice at the large size with the others dim under it. `Segmented` is
a row of buttons with one filled; making it a vertical, unframed list at two sizes is more than
one prop. The display already draws its tab row and track row as `Text` in its own cells, and
the choice list is the same: the display's layout, no new component. `Segmented` stays for a
choice that is not touched (the two-option pairs on display buttons).

### D3. Map on a held switch: a bank's switches over the upper display buttons

*Changed while building.* This said the held switch was a device's on/off, from the manual's
text alone. The manual's figure of mapping a toggle (a Hybrid Reverb with Freeze In, Freeze and
Pre Algo over the upper display buttons, Map at the lower right) shows otherwise: while a
device's banks are shown, the top row is the device and then the bank's own switches, and those
are what a hold maps. So a bank carries its switches (`Bank.switches`), a press switches one and
a hold offers Map; Map sits on the last lower display button for a held switch and for a touched
parameter alike, as both of the manual's Map figures have it. A device's on/off is still switched
with Mute and its button. The stories' new requirement, "A bank's switches sit over the upper
display buttons", holds this.

### D4. Simpler's order, and Trigger and Gate as options

From the manual's Slicing figure and its text (11.1 to 11.4): Zoom, Start, End first, Mode on
the last encoder. The mode's own parameters sit between:

| Mode | Encoders 4 to 7 | Options on the display buttons |
|---|---|---|
| Classic | S Start, S Length, Loop Length, Loop Fade | |
| One-Shot | Fade In, Fade Out, Transpose, Gain | Trigger, Gate |
| Slicing | Nudge, Playback, Slice By, its companion | Trigger, Gate |

The manual calls Trigger and Gate "options", and nine parameters do not fit eight encoders, so
they become a pair on two upper display buttons, as the figure shows options elsewhere. The first
task of the group lays the One-Shot and Classic figures beside this table; where a figure
disagrees, the figure wins and the delta's scenario is corrected before the stories are written.

### D5. A value's picture is a named icon

A setting's value may name a picture (`finger`, `pad`, `input`, `output`). The display draws it
with `Icon` under the value. No drawing is passed as data.

### D6. New scenarios are added to the stories by hand

`scripts/push-stories.ts` writes a capability's whole stories file from a specs folder, so
pointing it at this change's deltas would drop every scenario the delta does not repeat. The new
stories are added to the existing files. The script's default folder becomes `openspec/specs`,
and it refuses to overwrite a stories file unless told to.

## Risks / Trade-offs

- [A hand-written encoder is wrong in a way the decoder forgives] → the unit test decodes three
  texts at three versions, and the evidence step scans the screen with a phone.
- [A figure shows a layout the model cannot give without a wider change] → that render is
  recorded as a gap in `docs/push.md` with what differs; it does not grow this change.
- [The Simpler order breaks a page built on the sample Set] → the banks are the app's to give;
  the change is marked breaking and the doc says so.
