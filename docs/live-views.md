# The live views: what the DAWs taught us

The widgets are generic; the views are opinions. These opinions were checked against the two
session languages that define the category — Ableton Live's Session View and Bitwig's Launcher —
and kept only where they serve a solo performer with hardware under their hands. (Not the
density: nobody plays a set from a screen that looks like a Bitwig screenshot. The language.)

## What we took from Live

- **Tracks are columns, songs are rows.** The grid reads top to bottom, launches left to right —
  the APC40 orientation. Scenes launch whole rows; our TransitionRow is that gesture made
  thumb-sized.
- **A stop per track, under the grid, plus stop-all.** Live's stop buttons sit in the track status
  field below the clips. Our stop row keeps that geography: one pie per track (tap it to stop
  the track), the set loop, and ■ for everything.
- **The mixer lives below the grid; returns sit right.** Session mixer's volume, pan and sends
  unfold beneath the clips; return tracks and the master hold the right-hand side. MixBand keeps
  that order: strips left to right, FX A / FX B returns after the tracks.
- **Sends are A/B pairs feeding the returns.** Live's Send A / Send B knobs became our two thin
  bars with their unity hinge marked.
- **Select follows launch.** Launching a Live clip selects it. Our cells ask for both `onLaunch`
  and `onSelectTrack`, so the screen and the hardware never disagree about the current track.

## What we took from Bitwig

- **Progress lives inside the clip.** Bitwig's launcher clips carry their own playhead; recent
  versions add loop counts per track. Our pies and bar counts are that reading in set language:
  the wedge is the playhead, the numeral is the loop count.
- **The active clip is marked, not repainted.** Bitwig outlines the active clip and draws its
  playhead. Our playing cells keep their face and take a hue wash plus the pie — the state
  changes the structure, never the circus.
- **Macros are pages.** Bitwig's Remote Controls (eight knobs per device page, switchable) are
  the precedent for MacroPads: named pairs of throws, the finger's trail behind the crosshair.
- **Panels repeat one shape.** Bitwig's device panels share a header strip, a body, one accent.
  Our regions hold the same idea: one faceplate tag, the widget, nothing else.

## What is ours

- **Pies, not playheads.** The set counts loops, not bars; the ring reads at stage distance where
  a 10 px playhead line doesn't.
- **The hinge.** Sends sit at +0 dB most of the night; the 0.75 detent is a target the finger finds
  without looking.
- **Tabs are screens.** A Lemur page is a fixed canvas; our tabs are `ScreenSpec` values, so an
  edited tab re-themes and steps its forms down on a small window. The layout builder stores
  specs, not screenshots.

## The five views (`Design OS/Layout/Workspace`)

All five share one linked dataset: the grid's tracks are the mixer's strips (levels, meters,
sends, lamps), the arp follows the follow strip's progression, the deck's cues sit under the
same bar counter. Each region wears a faceplate tag — the device header strip reduced to a word,
overlaid so the solver's heights stay exact.

| Tab | Regions | For |
|---|---|---|
| My stage | Loop grid over Mix | the set at a glance: launch and levels |
| Session grid | Loop grid over Transitions | running songs: sections and cuts |
| Arp & follow | Follow over Arp beside Throws | the keys tab: harmony and throws |
| Mix & sends | Mix | riding the mix: every level, send and lamp |
| Stem deck | Stems over Transitions | the deck: four lanes, cues, cuts |

Edit mode frames every region with the six structural edits (move, moveRow, split, remove, add,
bind); the Edit story and its plays cover them. The component stories stay the dual-renderer
contract; the views are React-only renders, since region content is app content.
