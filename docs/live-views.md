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

## Two sets of views

There are two generations of views, and both stay:

- **`Design OS/Layout/Workspace`**: the Workspace's own fixtures, built from the zen-styled
  `components/music/` parts (LoopGrid, MixBand, StemLanes, TransitionRow…). Its tabs are My stage,
  Session grid, Arp & follow, Mix & sends and Stem deck. Edit mode frames every region with the six
  structural edits (move, moveRow, split, remove, add, bind).
- **`Live/Views`** (`src/library/live/`): the live looper's pages, built from the Music family's
  live panes in mix[flow]'s face (`src/library/Music/live/`, stories under **Music/Live**). These
  are the views the wireframes asked for.

### `Live/Views`

All tabs share one linked set (`LiveSet.story.tsx`, a story harness: its clock, queue and mutes
are scenario data, not a scheduler or an engine). Select a track anywhere and the grid, strips,
orbits, spine and Push follow; a compass wedge overrides the chord the orbits follow; a section
press queues it; a stem toggle mutes it.

| Tab | Rows (each a row of region instances) | For |
|---|---|---|
| ONE | river · loop + compass · sections + landing · mix + stems · rig | the whole set on one page |
| Follow | compass + orbits · follow · rig | the harmony: place, time and the loop |
| Track | spine · stems · throws + cuts · rig | one column as its signal path |
| Hands | push + orbits · sections + landing · rig | what the hardware is doing |
| Mine | river · rig, edit mode | build a page from the palette |

Each tab is a **document in mix's surface shape** (`views.ts`; mix `src/rig/contract.ts`,
version 1): rows of region instance ids, and the instances, each naming its pane `kind`, its
`title` and a `binding` (`{ mode: 'selected' }`, or `{ mode: 'fixed', target }`). Instance ids are
fresh (`one-region-3`) and name an instance, never a component type: nothing reads a kind out of
an id. `liveScreen(tab)` turns a tab into the ScreenSpec the solver draws. When the Workspace adds
or splits, its `onSpec` names the instance it placed and its kind (`placed`), and the host records
that. The rig's line is an ordinary last row, as mix's Health is, not a footer.

The views are React-only renders, since region content is app content. Their plays are overviews;
what each pane guarantees is held by the pane's own stories (below), not by the pages.

## What each pane guarantees (`Music/Live`)

Every pane is an exported component with React and Svelte bindings and several stories whose
plays run in both renderers (`npm run test:music:stories -- --prefix music-live`). Beyond Default,
Every state, Dense, Empty and Disabled, each has a **Hosted** story: `Music/live/host.story.tsx`
stands in for the app, applying each intent to the pane's props as a host would, so a play presses
the real control (pointer and keyboard where the pane has both) and reads the pane back. A spy call
alone is not taken as evidence. The host can also rebind a pane (**Rebound**) and remove and
remount it (**Remounted**).

| Pane | Guarantees its stories exercise |
|---|---|
| `SetlistRiver` | a song press or Enter asks to cue it; cued and the old cue read back from the host; a scene reads playing |
| `LaunchGrid` | a slot (click or Enter) asks by `{ track, cell }` and reads queued only when the host queues it; a column's stop, a song's fold and the selected track read back |
| `SectionBar` | a section press, Enter or Space asks by id and reads queued only from the host; widths follow bars; an unavailable section is disabled, says why and asks nothing; rebinding to another song; `row` and `chip` forms fit |
| `TrackStrips` | fader drag (the shared parameter gesture) and arrows, send knobs, M/S/● and select read back per track, others untouched; a missing meter draws no meter; a drag cut off by removal asks nothing more |
| `StemDeck` | a toggle asks by stem id and mutes only from the host; no envelope reads "no waveform"; an unavailable stem is disabled with its reason; no playhead without a position; rebinding to another song; remount redraws |
| `ChordCompass` | follow and bass lock read back; a wedge pick only asks: the chord playing and next stay the host's; Empty is an inert reference |
| `ProgressionStrip` | selection (click or Enter) and follow read back; Mutate only asks; Empty has no now or next |
| `OrbitClock` | ring, row or Enter select the track and both marks follow; the dice only ask |
| `SignalSpine` | a knob reads back the host's amount and words; the Out fader's setting is not the meter's measurement (`meter`); no reading says so; rebinding to another track |
| `PushTwin` | a clip pad (click or Enter) reads queued from the host, a stop pad stops its column, a section queues, a scene lights; section cells share `live/sections.ts` with `SectionBar` |
| `LandingDial` | target (click or arrow keys), length and Cancel read back; nothing counts down by itself |
| `CutPads` | a pad reads fired and selected only from the host; a press without a host change reads nothing back; narrow forms fit |
| `ThrowPads` | drag and arrows ask in 0–1 (y up), each arrow stepping from the host's point; rebinding; a drag cut off by removal asks nothing more |
| `RigHealth` | no load sample reads `cpu —` and unreported xruns aren't drawn (never a made-up 0%); a press opens by id; rebinding |

No pane schedules, plays, follows harmony or measures anything: what is playing, queued, muted or
measured is always the host's to say.
