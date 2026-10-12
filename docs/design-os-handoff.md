# Design OS: handoff

Where the Yahaha redesign stands on 2026-10-12, and the ideas behind it. Everything is on `main` of [satoramoto/zen](https://github.com/satoramoto/zen) (checkout `~/Code/satoramoto/zen`), together with the field guide.

## The spirit

The design OS is a way of building interface where **every visual decision is a named, shared choice** and every widget is rebuilt **from what a player needs**. It has two halves.

**1. A token contract with mixable facets** (`src/library/contract.ts`, `themes/`). A theme is four independent facets:
- palette: colour roles;
- type: faces, weights, sizes and label case;
- chrome: radius, borders and how fields and cards are drawn;
- density: the spacing unit and control height.

Any palette can be worn with any type, chrome and density. Components read only the contract's CSS variables, never a literal colour or radius, and `library.test.tsx` enforces this. Six theme packs ship: `yahaha-push`, `yahaha-elektron`, `yahaha-ableton-light`, `elektron`, `ableton` and `linear`. The Storybook toolbar mixes them. A widget isn't done until it reads well under every pack.

**2. First-principles redesign.** Each widget, and then the whole Stage, was rebuilt by asking: *what does a player need from this at a glance, mid-song, from a metre away?* Every component's doc comment records three things:
- **Job**: what it's for;
- **Changed**: what differs and why, naming the principle;
- **Kept**: what the original already got right.

Behaviour, keyboard handling and accessibility names carry over from the original. Only the look and the layout change.

The rules that came out of it:
- **One hierarchy.** What's playing now (section, chord) and the tempo are the loudest things on screen, ranked by size and weight in neutral text. Only the live element is highlighted (`--selected`).
- **Colour has one meaning** (`src/library/yahaha/hues.ts`).
  - **Part hues:** the four categorical hues are the four keyboard parts (Right 1, Right 2, Right 3, Left), everywhere: fader, keyboard zone, sound name, part knob. Nothing else takes a categorical hue.
  - **Role hues:** two role hues each name one thing: `--style` (the current style) and `--transport` (the controls that move time).
  - **Running is a state:** a running Start/Stop is `--success`.
  - **Sections:** song sections are playing (`--selected`), next (`--accent`) or plain.
  - **All distinct:** the contract test holds every pair of the four part hues, success, warning, danger, style, transport, accent and selected at least 0.12 apart in OKLab, in every palette, with no exemptions.
- **One place per job.** Transport lives only in the song form, Tap only in the hero, and global switches only in the top bar. Hardware mirrors are the one exception, for example OTS 1–4 on the Quick Racks pads, because Yahaha's rule is that every hardware function has an app control.
- **Sections read as the song's form**: Intro → Main A–D → Ending, with now and next marked, not a grid of coloured pads.
- **Meaning never rests on colour alone.** Off, absent, armed and trouble states also show by shape, words or a dashed outline.
- **Numerals don't jitter**: tabular figures in fixed-width slots.

## What exists

| Layer | Where | State |
|---|---|---|
| The originals (Svelte, untouched) | `yahaha/`, for reference (`npm --prefix yahaha run storybook` to see them) | copied from yahaha `develop` at b426bcb3 |
| 33 primitives (React) | `src/library/yahaha/<Name>/` | merged; on the full token contract (no local colour stand-ins left) |
| 6 regions | `AppBar`, `Display`, `SongForm` (new), `FaderBank`, `KnobBank`, `PadBank` | merged |
| The Stage screen | `src/library/yahaha/Stage/` (layout, `StagePlayground`, `tapTempo`, per-pack shots in `shots/`) | merged, rebalanced (#4) |
| Rules | `src/library/yahaha/README.md` (widget convention), `STAGE.md` (Stage brief and concepts that must survive), `hues.ts`, `AGENTS.md` | current |

Checks: see `AGENTS.md`. CI (`.github/workflows/checks.yml`) runs them on every PR, and `main` only takes a PR once `checks` passes.

**To look at it:** `npm run dev` starts the Yahaha Storybook at http://127.0.0.1:6022 (set `YAHAHA_STORYBOOK_PORT` to move it). It holds only **Library → Yahaha**: Screens → Stage → Playground is the live screen. Switch packs with the **Theme** toolbar. The main Storybook (:6021) holds the field guide and the library's own components.

## Done in the 2026-10-12 round

- **CI and merge flow (#2):** a `checks` job runs typecheck, tests, the app build and both Storybook builds. `main` is protected, and PRs auto-merge once `checks` passes.
- **Stage rebalance (#4):**
  - **Fit:** the Stage lays out at the frame's own size. The hero tries Display `full`, then `compact` with tighter gaps, and only then zooms the whole screen. It retries `full` when the frame grows or the content shrinks.
  - **Result:** at 1217×752, five packs render at 100%.
  - **Status line:** it closes the knobs-and-pads column, so there's no empty band above the keys.
  - **Playground:** OTS pads apply One Touch, and the style-step edge case is fixed.
  - **PadBank:** the duplicate NEXT/ARMED padding is gone.
- **Token contract (#3):**
  - `--key-white` and `--key-black`;
  - `--success-text`, `--warning-text` and `--danger-text` (AA-checked per pack);
  - `--style` / `--style-text` and `--transport` / `--transport-text`;
  - `--scheme-light` (1 light, 0 dark, for `calc()`). It works as a plain number inside `color-mix()`; this was checked in a browser.
  - No fifth hue.
- **Widget migrations:**
  - **#5:** OneTouchPicker, WaitingChip and AccentBlock wear `--style`, and the TempoReadout steps wear `--transport`.
  - **#6:** Keys and DisplayArt. Light packs draw a day scene.
  - **#7:** Pad, Button, LampButton, SongForm and AppBar. State ink, plus a `transport` tone that replaces Pad's `action` tone. Lit section keys were black on black in `ableton`; they now use `--surface-0` ink.
- **Colour distance (#8):** 16 values changed so every meaning-bearing pair is distinct, each commented in `themes/palettes.ts`.
  - **Push dark:** style is magenta `#f57aff`; warning is `#ffd60a`.
  - **Elektron:** Left is lime `#aaff1b`, warning orange `#ff8c1a` and transport teal `#0a9e9e`.
  - **Linear:** Right 1 is `#99bfff` and success `#86e08a`.

## Next

1. **The remaining 36 components and 9 screens** (Channel, Effects, Library, Settings, Looper and the rest), on the same pattern: contract first, lanes by folder, review, then a PR with auto-merge.
2. **Stage leftovers:**
   - `ableton` still zooms at 1217×752 (0.839), because its regions need about 896px of height;
   - the style name gets cut off at 1217 ("Sunday Drive P…").
3. **Colour leftovers:**
   - an `--accent-text` token, because Pad's `accentNext` ring puts `--surface-0` on `--accent` unchecked;
   - should a lit LampButton `lamp` be a state (`--success`), or the original's distinct lime?
   - in `elektron`, the teal transport outline next to the green running Stop reads close at a glance;
   - borderline pairs just over 0.12: Push dark accent vs Right 1 (0.1204), Linear Left vs style (0.124), Linear danger vs transport and Push light success vs Left (0.127).
   - Button Faces has no style or warning row.
   - The Style fader strip could wear `--style`; it is neutral today.

Smaller follow-ups:
- mixer strip names lost their hover text;
- the hero's breakpoints are in px, not control heights;
- SongForm's waiting keys don't flash, and stop-with-fade isn't reachable from the keyboard;
- the Style page's coloured lamps sit under neutral faders;
- the new BarBeat resting tint needs a contrast check per pack;
- TempoReadout's `:disabled` style is unused, because its step buttons never disable.

## How it was built (process notes)

- **Contract first, then lanes by folder.**
  - Each lane owns whole widget folders. Shared files (`contract.ts`, `themes/`, `library.test.tsx`, `hues.ts`, `STAGE.md`) change only in their own small PR.
  - Each lane pushes its branch. A separate Sonnet reviewer reads the diff, only accepted findings get fixed, and then the orchestrator opens the PR with auto-merge.
  - CI on the PR is the final check.
- **Lessons**:
  - Run the tests on the merged result, not only on the lane's branch. A primitive gaining `data-state` broke a region's unscoped test selector on merge.
  - Keep test selectors scoped to the widget.
  - Look at the built Storybook, not just jsdom. The invisible keyboard passed every test, and so did black-on-black section keys.
  - Lanes keep screenshots in an untracked `.shots/` inside their worktree, and never `git add` them.
  - A distance test is only as good as its pair list. The first one skipped `--accent` and found 5 clashes; the full 55-pair test found about twice that.

## Related, outside this repo

- `awesome-claude` PR #27: the `launcher` mod (`/launcher`, `/preview`). It manages the project's `.claude/launch.json` dev servers from the terminal. Merged.
