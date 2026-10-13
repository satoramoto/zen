# The Stage, redesigned

The Stage is the whole app on one screen: what a player looks at while playing live. The original is `yahaha/src/ui/Stage/` (Storybook: Yahaha baseline → Screens → Stage). The redesign keeps every concept below and is free to rearrange them. It is built from the primitives already in `src/library/yahaha/`.

## Concepts that must survive

- **Pages**: Stage, Channel, Effects, Quick Racks, Multi Pads, Looper, Harm/Arp, Library, Settings.
- **Global switches**: Metronome (with its settings), Unison, Help, Panic; Launchkey and Audio health.
- **The style**: its name with previous/next and browse, genre · meter, One Touch 1–4.
- **Chord**: the chord, its notes, the fingering mode.
- **Section**: what plays now, what is queued next, a pending fill ("fill after bar 4").
- **Tempo**: BPM, −, Tap, +, reset to the style's tempo.
- **Beat**: where the bar is (four beats).
- **Transport**: Start/Stop, Sync Start, Sync Stop, Auto Fill, Break, fill up/down, fade, reset, accompaniment on/off.
- **Sections**: Intro I–III, Main A–D, Ending I–III (absent ones shown as absent).
- **Mixer**: Right 1, Right 2, Right 3, Left with their sound names, levels and on/off; Style, Multi Pad, Master; fader pages (Panel, Style) and layers (Vol, Pan, Reverb, Chorus, Delay); soft takeover; the page buttons (Harm/Arp, Sound, L Hold, Looper, Panel).
- **Knobs**: eight, with pages (Style, Rack, Pan, Reverb, Chorus, Delay).
- **Pads**: banks Sections (the default view: the sections live here, as the Launchkey's pads play them), Quick Racks, Chord, Multi Pads, Setup.
- **Keyboard**: the split, each part's zone, held notes, shown on the keys alone (held keys in their part's hue; no readout above them).
- **Status line**: errors and hints.

## Direction

Ask of every element: does a player need it at a glance, mid-song, from a metre away?

1. **One hierarchy.** Now playing (section, chord) and tempo are the loudest things on screen, in that order; then what's next; then the controls. The original gives chord, section and tempo three competing hues; the redesign ranks them by size and weight, in neutral text, with `--selected` only on the live element.
2. **Colour has one meaning** (`hues.ts`): the four hues are the four parts, everywhere, so the mixer, the keyboard zones and the sound names agree. Sections never take a hue.
3. **One place per job.** The original has transport in three places (the top row, the pad icons, the Start/Stop pad) and Tap twice. The redesign has one transport cluster and one Tap.
4. **Sections read as the song's form**, on the Pads region's Sections bank (there is no separate song form strip): Intro → Main A–D → Ending in order, with now and next marked on them.
5. Work under every theme pack, from the 1920×1080 board down to 1217×752. The Stage is 16:9: any window gives it the largest 16:9 room inside it, centred, and the rest is ground (`aspect` in `Stage.spec.ts`).

## Regions and who owns them

Each region is one folder under `src/library/yahaha/`, with its own fixtures ported from the original's, and a story under `Library/Yahaha/Components/<Name>`.

| Region | Folder | Re-expresses (originals) |
|---|---|---|
| Top bar | `AppBar/` | AppBar, MetronomePopover, the global switches of SectionRow |
| Hero | `Display/` | Display (style header, chord, section now/next, tempo, beat) |
| Transport | `SongForm/` (`part="transport"`) | SectionRow's transport, TransportColumn (its song form strip is not on the Stage: the Sections pad bank is) |
| Mixer | `FaderBank/` | FaderBank |
| Knobs and pads | `KnobBank/`, `PadBank/` | KnobBank, PadBank's other banks |
| The screen | `Stage/` | Stage, StageGolden, tapTempo: lays the regions out with Keys and StatusLine; built last, from the merged regions |

The Stage is an assembled library `Screen` (`src/library/layout/`, `Stage/Stage.spec.ts`): a few high-level regions that stay put. Its fixed header is the AppBar; its fixed footer is the Keyboard region and the status line; between them the body holds Hero, Transport, Mixer, Knobs and Pads (opening on the Sections bank), placed by the solver from their forms. Only the body steps down or zooms, never the header or footer. Each region is a library `Region` on the theme's `plate` material: the material decides how a region looks, the room inside it (`--mat-plate-inset`) and the space between regions (`--mat-plate-gap`).

Tabs live in the region, so content swaps inside a fixed frame: the pad banks are the Pads region's views, the knob pages the Knobs region's, the fader pages the Mixer's, with the layer switch (Vol … Delay) as `Tabs` in its `aside`. Each bank folder exports its region (`PadBankRegion`, `KnobBankRegion`, `FaderBankRegion`); the bank component itself draws no tabs or title and renders the chosen page's body. A region component never paints its own panel and never nests a region; it fills the Region it is given, and labelled clusters inside it are `Group`s.

A region lane edits only its folders. It may import merged primitives, `hues.ts` and `../components`, never another region.

## Assembly: priorities and principles

The Stage is moving onto an assembled `Screen` ([`docs/assembly.md`](../../../docs/assembly.md)): its regions declare forms, the screen declares intent, and the pack's principles (`themes/principles/index.ts`, `yahaha`) settle the rest. The direction above maps onto the solver like this:

| Direction | In the spec / principles |
|---|---|
| 1. Now playing (section, chord), then tempo, are loudest | Hero is `priority: 'now'`, so it steps down last; its forms are Display's `full → compact → minimal` |
| What's next | The hero's next section, and the Sections pad bank's next ring (the Pads region, `controls`) |
| The controls | Transport, Mixer, Knobs and Pads are `priority: 'controls'` (Pads `two-rows → one-row`, faders `tall → short`) |
| The page bar, keys and status line never move | AppBar is the `header`; Keyboard and the status line are the `footer`: fixed, never stepped or zoomed |
| One column seam from the bar to the keys | `pairs: [['hero', 'mixer']]` |
| 5. Every concept on one screen, 1920 × 1080 down to 1217 × 752, always 16:9 | `aspect: { ratio: 16 / 9, fit: 'contain' }` (the rest of the window is ground); `density: 'dense'` (keep the richest form that fits at its least); zoom only when every useful step is taken, never below the 24 px `minTarget` |
