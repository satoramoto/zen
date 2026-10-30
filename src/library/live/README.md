# Live concept panes

Sketches toward a Lemur-style surface for the live looper: each pane is one idea from the
live-looper wireframes ("Live Looper Wireframes" canvas: ONE, Setlist, Push, Mixer, Track, Rig,
Follow, Stems), drawn a new way and sized by its own `forms`, so a Workspace tab can place it
anywhere and the solver picks how it draws.

Stories: `Live/Panes` (each pane in every form) and `Live/Views` (tabs composed from the panes and
the live widgets in `components/music/`, linked to one set state; **Mine** is edit mode with every
pane kind in the palette).

| Pane | The idea | Forms |
| --- | --- | --- |
| `ChordCompass` | the circle of fifths; the progression loop drawn as a path round it, the key a wedge | `wheel` → `dial` |
| `OrbitClock` | one ring per generator, beads for steps, hands at each cycle's own speed: the polyrhythm visible | `full` → `orbits` |
| `SetlistRiver` | the night as a timeline by minutes, under its tempo contour; the song now opens into scenes | `river` → `strip` |
| `SignalSpine` | a track as cartridges on one cable; the looper's layers as tree rings | `chain` → `column` |
| `PushTwin` | the controller on screen: scribble strip, banded 8×8 (clips, stop, sections, cuts), scenes | `full` → `grid` |
| `LandingDial` | a transition's countdown ring cut into bars: when it lands, and on what | `dial` → `chip` |
| `RigHealth` | one quiet line: quantize, input signal, controllers, DSP load as a sparkline | `strip` → `dots` |

## What these are, and aren't

- **React-only sketches**, outside the tier folders: no model/view tree, no Svelte twin, no
  fixtures file. They read only contract variables, type through `Text` (except SVG `<text>`), and
  hold no state (`on<Verb>` callbacks, `beat` as a prop), so a pane that survives review can be
  promoted into `components/music/<Name>/` with the full lane checklist (docs/live-workspace.md).
- `set.ts` is stand-in data matching the live widgets' fixtures; `LiveSet.story.tsx` is the
  stories' stand-in app (state, a clock, content per region id). Neither is a production API.
- The Workspace fills body regions only, so the rig strip is a last body row, not a `footer`.
