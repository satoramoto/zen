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
- **Pads**: banks Quick Racks, Chord, Multi Pads, Setup (Sections moves to its own region, see below).
- **Keyboard**: the split, each part's zone, held notes.
- **Status line**: errors and hints.

## Direction

Ask of every element: does a player need it at a glance, mid-song, from a metre away?

1. **One hierarchy.** Now playing (section, chord) and tempo are the loudest things on screen, in that order; then what's next; then the controls. The original gives chord, section and tempo three competing hues; the redesign ranks them by size and weight, in neutral text, with `--selected` only on the live element.
2. **Colour has one meaning** (`hues.ts`): the four hues are the four parts, everywhere, so the mixer, the keyboard zones and the sound names agree. Sections never take a hue.
3. **One place per job.** The original has transport in three places (the top row, the pad icons, the Start/Stop pad) and Tap twice. The redesign has one transport cluster and one Tap.
4. **Sections read as the song's form**: Intro → Main A–D → Ending in order, with now and next marked on it, rather than a grid of coloured pads.
5. Work under every theme pack, from the board's 1440×900 down to 1217×752.

## Regions and who owns them

Each region is one folder under `src/library/yahaha/`, with its own fixtures ported from the original's, and a story under `Library/Yahaha/Components/<Name>`.

| Region | Folder | Re-expresses (originals) |
|---|---|---|
| Top bar | `AppBar/` | AppBar, MetronomePopover, the global switches of SectionRow |
| Hero | `Display/` | Display (style header, chord, section now/next, tempo, beat) |
| Song form and transport | `SongForm/` | PadBank's Sections page, SectionRow's transport, TransportColumn |
| Mixer | `FaderBank/` | FaderBank |
| Knobs and pads | `KnobBank/`, `PadBank/` | KnobBank, PadBank's other banks |
| The screen | `Stage/` | Stage, StageGolden, tapTempo: lays the regions out with Keys and StatusLine; built last, from the merged regions |

The Stage is a library `Screen` (`src/library/layout/`): a few high-level regions that stay put. Its fixed header is the AppBar; its fixed footer is the Keyboard region and the status line; between them a named grid (`areas`) holds Hero, Transport, Song form, Mixer, Knobs and Pads. Only the grid fits or zooms, never the header or footer. Each region is a library `Region` on the theme's `plate` material: the material decides how a region looks, the room inside it (`--mat-plate-inset`) and the space between regions (`--mat-plate-gap`).

Tabs live in the region, so content swaps inside a fixed frame: the pad banks are the Pads region's views, the knob pages the Knobs region's, the fader pages the Mixer's, with the layer switch (Vol … Delay) as `Tabs` in its `aside`. Each bank folder exports its region (`PadBankRegion`, `KnobBankRegion`, `FaderBankRegion`); the bank component itself draws no tabs or title and renders the chosen page's body. A region component never paints its own panel and never nests a region; it fills the Region it is given, and labelled clusters inside it are `Group`s.

A region lane edits only its folders. It may import merged primitives, `hues.ts` and `../components`, never another region.
