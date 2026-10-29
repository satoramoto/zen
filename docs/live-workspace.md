# The Live Workspace: a set you can lay out

A solo looping performer needs one screen for seven songs and a jam: launch loops, ride sends,
follow a chord, throw a delay, cut to the next part. No single fixed arrangement serves all of
that, so the screen is **tabs of self-assembling regions** — the `Screen` + `assemble()` machinery
zen already has — plus a small editor that adds, removes, resizes and rebinds regions on a tab.

This is the Lemur idea, constrained: you lay out **regions** (blocks), not pixels, so every tab
still steps its forms down on a small window and still reads in every theme pack.

Storybook is the evidence. **No new unit tests**; every behaviour is exercised by a story's `play`.

## What already exists (do not rebuild)

| Piece | Where | Use it as |
|---|---|---|
| `Screen spec={…} regions={…}` | `src/library/layout/Screen` | a tab. A tab **is** a `ScreenSpec`. |
| `assemble()` + `Form`/`RegionSpec` | `src/library/layout/assembly` | every widget declares its forms; the solver picks one. |
| `Tabs` | `src/library/layout/Tabs` | the tab strip (labels → short → menu). |
| `Fader`, `Meter`, `SendReadout`, `Knob`, `Pad`, `Keys` | `components/music/` | inside the new banks, never duplicated. |
| `Surface`, `Text`, `Stack`, `Ring`, `Icon` | `primitives/` | every plate, well, word and glyph. |
| `FaderBank`, `KnobBank`, `PadBank`, `Display`, `SongForm` | `yahaha/` | the Yahaha Stage; leave it alone. |

## The contract every widget shares

`src/library/components/music/live.model.ts` — plain data, no framework, exported from
`components/music/index.ts`. **No lane may change it after wave 1 starts**; propose a change to
the orchestrator instead.

```ts
export const LIVE_CELL_STATES = ['empty', 'stopped', 'queued', 'playing', 'recording'] as const;
export type LiveCellState = (typeof LIVE_CELL_STATES)[number];

/** One loop slot in one track column. */
export interface LiveCell {
  id: string;
  name?: string;
  state: LiveCellState;
  /** 0–1 through the loop (the pie). */
  phase?: number;
  /** Bars captured so far, while recording. */
  bars?: number;
  /** The loop it hands over to (a transition), if any. */
  next?: string;
}

/** One track column: its slots, its level and its two sends. */
export interface LiveTrack {
  id: string;
  name: string;
  hue: HueSlot;
  cells: readonly LiveCell[];
  level: number; // 0–1
  meter?: number; // 0–1
  sends?: readonly [number, number]; // 0–1 each
  armed?: boolean;
  muted?: boolean;
  soloed?: boolean;
  /** Parked: drawn faint, still column-aligned. */
  parked?: boolean;
}

/** One song in the set: a folded header row. */
export interface LiveSong {
  id: string;
  index: number;
  name: string;
  open: boolean;
  /** The folded summary, one glyph per section: `'■■■□'`. */
  summary?: string;
  tempo?: number;
  key?: string;
}

/** The stop row's own loop phase. */
export interface LiveLoop {
  phase: number;
  bars?: number;
  recording?: boolean;
}

export const ARP_MODES = ['up', 'down', 'updown', 'converge', 'random'] as const;
export type ArpMode = (typeof ARP_MODES)[number];

/** The chord degrees a step can fire, in order: `degree` indexes this. */
export const ARP_DEGREES = ['R', '3', '5', '7', '9', '11', '+8', '+15'] as const;

export interface ArpStep {
  on: boolean;
  degree: number; // index into ARP_DEGREES
  velocity?: number; // 0–1
  tie?: boolean;
}

export interface ArpState {
  steps: readonly ArpStep[];
  mode: ArpMode;
  rate: number; // 0–1 of the rate ladder
  octaves: number;
  gate: number; // 0–1
  swing: number; // 0–1
}

export interface LiveChord {
  id: string;
  name: string; // 'Am7'
  notes?: readonly string[]; // 'A C E G'
  beats?: number;
}

export interface LiveSend {
  id: string;
  name: string;
  hue?: HueSlot;
  level: number; // 0–1
}

/** One stem lane: peaks are 0–1, one per bucket. */
export interface LiveStem {
  id: string;
  name: string;
  hue: HueSlot;
  peaks: readonly number[];
  muted?: boolean;
  soloed?: boolean;
}

export interface LiveCue {
  id: string;
  label: string;
  at: number; // 0–1
}
```

### The rules that make an interface "tight"

1. **Props are plain data.** `readonly` arrays, 0–1 fractions, `HueSlot` for colour, string ids.
   No `Date`, no functions in data, no app types.
2. **Callbacks are `on<Verb>`** and take one argument: `onLaunch(cell: LiveCellRef)`.
   `LiveCellRef = { track: string; cell: string }` lives in `live.model.ts`.
3. **Variants are exported const tuples**, and their union is derived (`LIVE_CELL_STATES` →
   `LiveCellState`). Never a bare string union in a prop.
4. **Size is not a prop.** A widget reads its chosen form with `useForm(<NAME>_FORMS)`. Its
   `<Name>.forms.ts` is framework-free and is the only place a length appears.
5. **No `style`, no per-use colour.** `className` stays; that's it.
6. **A state the widget can't draw doesn't exist.** Every value in the model's unions has a
   story.

## Theme conformance (all lanes)

- Only contract variables: `var(--space-N)`, `var(--control-h)`, `--size-*`, `--hue-N`,
  `--role-N`, `--mat-*`, `--layer-*`. No literal colour, radius, font or `light-dark()`.
- Colour is a slot. A widget says `hue={track.hue}`; **meaning is the app's** (`yahaha/hues.ts`
  is the precedent). Recording is not "red" in the component.
- Type only through `<Text role=…>`; numerals `role="numeral" tabular`; no `font-*` in CSS.
- Plates and wells through `<Surface>` (`layer`, `material`, `radius`), presses through `Ring`.
- A local custom property is a **tuning knob**: name it `--yh-<widget>-<what>` and list it in the
  component's doc comment, or `tiers.test.ts` counts it as a breach.
- The proof is the story toolbar: every widget's *Default* story is read in **each pack**
  (`visuals`, `yahaha-elektron`, `yahaha-classic`, `yahaha-push`, and the rest) and both modes,
  and in a 900 px-wide frame.

## Lanes

Each lane is one worktree, one branch, **one folder**, and its own ports. A lane never edits
`components/music/index.ts`, `layout/index.ts`, `src/library/index.ts`, `tiers.baseline.json`,
`view/*`, or another lane's folder. The orchestrator lands the shared files first and adds the
exports at merge.

| Lane | Owns | Builds |
|---|---|---|
| **0 · contract** (orchestrator) | `components/music/live.model.ts`, `docs/live-workspace.md` | the types above, the export line, the fixtures every lane copies |
| **1 · grid** | `components/music/LoopPie/`, `LoopGrid/` | the 20 fps pie (SVG arc, one form), the folded song header + 8 track columns + cells + stop row. Forms: `full` (songs, tracks, stop) → `rows` (no song headers) |
| **2 · mix** | `components/music/SendBars/`, `MixBand/` | two horizontal send bars per strip (0–1, unity hinge at 0.75) and the column-aligned band of `Meter` + `Fader` + `SendBars` + `A/S/Arm`. Forms: `tall` → `short` (match `FaderBank`) |
| **3 · harmony** | `components/music/ChordStrip/`, `ArpSequencer/` | the progression strip (`LiveChord[]`, now/next, `MUTATE/KEEP/REVERT` as slots) and the 16-step chord-degree arp (`ARP_DEGREES` rows × 16 columns, `ARP_MODES`, rate/oct/gate/swing). Forms: `full` → `compact` (no degree labels) |
| **4 · pads** | `components/music/XYPad/`, `MacroPads/` | the XY pad (0–1 both axes, crosshair, trails as state, two axis labels) and a two-up macro pair. Forms: `square` → `wide` |
| **5 · stems** | `components/music/StemLanes/` | four peak lanes + cue flags + a loop window (`LiveStem[]`, `LiveCue[]`). Forms: `four` → `stacked` → `one` |
| **6 · transitions** | `components/music/TransitionRow/` | six armed pads (`RISER/DROP/CRASH/HOLD A/HOLD B/CUT`) with `armed`/`fired` states. Forms: `row` → `grid` |
| **7 · workspace** | `layout/Workspace/` + `docs/workspace.md` | `WorkspaceSpec` (tabs of `ScreenSpec`), the tab strip, perform mode, and edit mode: palette of region kinds, add/remove/reorder/re-split rows, bind a region to a track, snap to the spec's own rows — **never pixels** |
| **8 · show** | `yahaha/Show/` (or an app screen) | the composition: 7 songs, JAM, transitions, a `Show.spec.ts`, stories at 16:9 in every pack |

Waves: **0 → (1,2,3,4,5,6 in parallel) → 7 → 8.**

### Lane 7's shape (the part worth pinning down now)

```ts
export interface WorkspaceTab {
  id: string;
  title: string;
  /** A tab is a screen. Editing rewrites this value, never a grid. */
  spec: ScreenSpec;
}

export interface WorkspaceSpec {
  tabs: readonly WorkspaceTab[];
  start?: string;
}

/** One kind of region the palette can place. */
export interface WorkspaceRegion {
  /** The name the app knows it by: `'loopGrid'`, `'arp'`, `'sends'`. */
  kind: string;
  label: string;
  forms: Forms;
  /** The region's `priority` and plate defaults when it is first placed. */
  priority?: Rank;
  plate?: boolean;
  head?: boolean;
}
```

- **Perform**: `Tabs` + `<Screen spec={tab.spec} regions={…} />`. The app fills `regions`.
- **Edit**: the same `Screen`, plus an overlay per region: a drag handle that moves a region
  within its row, a split that turns a row into a `Nest`, a menu of `WorkspaceRegion`s to add,
  and a binding panel (`kind` → `track` id / `param`). Every action returns a new `ScreenSpec`;
  the component never writes CSS, so the result still assembles and still re-themes.

## Definition of done, per lane

- `npm run typecheck` and `npm run build:storybook` exit 0.
- `<Name>.model.ts` + `<Name>.tsx` + `<Name>.svelte` (each one `<Tree …/>`), `<Name>.css`,
  `<Name>.forms.ts`, `<Name>.fixtures.ts`, `<Name>.stories.tsx`.
- Stories: `Design OS/Components/Music/<Name>` — *Default*, *Every state*, *Dense* (the `short`
  form at 900 px), *Empty*, *Disabled*. Layout lane: `Design OS/Layout/Workspace`.
- Read in a browser in three packs and both modes. Say which pack and which story you checked.
- No `.test.tsx`, no new baseline lines, no edit outside the lane's folders.

## Open decisions (orchestrator)

- `LoopGrid`'s cell count: fixed 8 per track, or the widest `cells.length`? (Default: the widest,
  never fewer than 8, so columns stay aligned.)
- Does a tab own its own header/footer, or does the workspace own one persistent bar? (Default:
  persistent `Tabs` bar + per-tab `spec.header`, so the bar counter is always in the same place.)
- Does edit mode ship in the app, or Storybook-only first? (Default: Storybook-only until the
  regions are settled.)
