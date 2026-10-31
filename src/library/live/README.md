# Live views

The live looper as Lemur pages: tabs of panes in the `Workspace`, one linked set behind them.
The panes themselves are Music-family components in mix[flow]'s face (`src/library/Music/live/`,
stories under **Music/Live**, `docs/music.md` → "Live"); this folder only composes them.

- `views.ts`: every pane kind the palette can place (`PANE_KINDS`, `PANE_PALETTE`) and the views
  as a document in mix's surface shape (`LIVE_DOCUMENT`): **ONE**, **Follow**, **Track**, **Hands**,
  and **Mine**, a blank page to build on. Each tab is rows of region instance ids and the instances,
  each naming its pane `kind`, `title` and `binding`; `liveScreen(tab)` is its ScreenSpec. The rig
  health strip is every tab's last row.
- `LiveSet.story.tsx`: the stories' stand-in app — one set's state, a running clock (`clock.ts`)
  and the pane for every region instance, by its kind and binding, linked (select a track anywhere and the grid, strips, orbits,
  spine and Push follow; pick a compass wedge and the orbits follow that chord).
- `Views.stories.tsx`: `Live/Views`, React-only (region content is app content); **Mine** opens in
  edit mode with every pane kind in the palette.

| Pane | The idea |
| --- | --- |
| `SetlistRiver` | the night as a timeline by minutes under its tempo contour; the song now opens into scenes |
| `LaunchGrid` | the session grid: songs folded above, tracks as columns in their stem inks, stops under |
| `SectionBar` | the song's sections as Push row 7's cells, each as wide as its bars: playing, queued, ready |
| `TrackStrips` | a deck-style channel per track: sends, fader and meter in a well, M / S / arm; FX returns |
| `StemDeck` | a song's separated stems: a lane each over its measured waveform, route, M; or the D/B/V/O strip |
| `ChordCompass` | the circle of fifths; the progression loop drawn as a path round it, the key a wedge |
| `ProgressionStrip` | the chords the band follows, sized by beats, now and next, the dice |
| `OrbitClock` | one ring per generator, hands at each cycle's own speed: the polyrhythm visible |
| `SignalSpine` | a track as cartridges on one cable; the looper's layers as tree rings |
| `PushTwin` | the controller on screen: scribble strip, banded 8×8 (clips, stop, sections, cuts), scenes |
| `LandingDial` | a transition's countdown ring cut into bars: when it lands, and on what |
| `CutPads` | the transitions as the biggest targets: armed, fired, held |
| `ThrowPads` | named XY throws over the waveform grid, the finger's trail behind the crosshair |
| `RigHealth` | one quiet line: quantize, input signal, controllers, DSP load as a sparkline |
