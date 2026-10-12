# Design OS: handoff

Where the Yahaha redesign stands on 2026-10-11, and the ideas behind it. The work lives on the local branch `design-os` (worktree `~/Code/satoramoto/awesome-design-os`). `main` is untouched. The repo has no GitHub remote, so nothing has been pushed and nothing has run in CI.

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
- **Colour has one meaning** (`src/library/yahaha/hues.ts`). The four categorical hues are the four keyboard parts (Right 1, Right 2, Right 3, Left), everywhere: fader, keyboard zone, sound name, part knob. Nothing else takes a hue. Song sections are playing (`--selected`), next (`--accent`) or plain.
- **One place per job.** Transport lives only in the song form, Tap only in the hero, and global switches only in the top bar. Hardware mirrors are the one exception, for example OTS 1–4 on the Quick Racks pads, because Yahaha's rule is that every hardware function has an app control.
- **Sections read as the song's form**: Intro → Main A–D → Ending, with now and next marked, not a grid of coloured pads.
- **Meaning never rests on colour alone.** Off, absent, armed and trouble states also show by shape, words or a dashed outline.
- **Numerals don't jitter**: tabular figures in fixed-width slots.

## What exists

| Layer | Where | State |
|---|---|---|
| The originals (Svelte, untouched) | `yahaha/`, shown in Storybook as "Yahaha baseline" | copied from yahaha `develop` at b426bcb3 |
| 33 primitives (React) | `src/library/yahaha/<Name>/` | merged; follow `hues.ts`; tooltip hook, sizes and states added in a polish pass |
| 6 regions | `AppBar`, `Display`, `SongForm` (new), `FaderBank`, `KnobBank`, `PadBank` | merged, with a fix round |
| The Stage screen | `src/library/yahaha/Stage/` (layout, `StagePlayground`, `tapTempo`, per-pack shots in `shots/`) | merged; rebalance pending (below) |
| Rules | `src/library/yahaha/README.md` (widget convention), `STAGE.md` (Stage brief and concepts that must survive), `hues.ts`, `AGENTS.md` | current |

Checks on `design-os`: `npm run typecheck` and `npx vitest run src/library` (469 tests) pass. `npm run build:storybook` also builds the composed baseline.

**To look at it:** run `npm run dev` in the worktree. Storybook is at :6021, or set `STORYBOOK_PORT`. A preview from this session may still be running at http://127.0.0.1:6031. Open **Library → Yahaha** for the redesigns, with **Screens → Stage → Playground** for the live screen, and **Yahaha baseline** for the originals. Switch packs with the **Theme** toolbar.

## In flight and next

1. **Done:** `yh-keys-pad` is merged. Keys draws a real keyboard, and Pad's NEXT tag no longer covers the label.
   - Why the keys were invisible: the build rewrote `light-dark()` into variables that only a literal `color-scheme` sets. The colours are now relative colours from `--surface-0`, and `library.test.tsx` now rejects `light-dark()`.
   - `PadBank.css` still carries a copy of Pad's NEXT/ARMED padding. Delete it.
2. **Next, not started: the Stage rebalance lane.**
   - give the hero back its height and remove the empty space above the keys;
   - drop the 84.5% fit-zoom at 1217×752: let the hero column shrink to about 436px and use Display's `density`;
   - fold in the review notes: OTS pads in the Playground should apply One Touch; `useFit` should also observe the inner frame; the stale comment in `Stage.css`; the Playground style-step edge case;
   - send fresh screenshots under all six packs to the owner.
3. **Token additions**, held back: key faces, ink on solid success/warning/danger fills, a style hue, a transport hue, a scheme flag that CSS can read (DisplayArt's light-pack hills), and maybe a fifth hue. Each widget derives a local stand-in for now. Batch them into one contract change that also fills every pack.
4. **Then**: the remaining 36 components and 9 screens (Channel, Effects, Library, Settings, Looper, and the rest) on the same pattern: contract first, lanes by folder, review, integrate.

Smaller follow-ups:
- mixer strip names lost their hover text;
- the hero's breakpoints are in px, not control heights;
- SongForm's waiting keys don't flash, and stop-with-fade isn't reachable from the keyboard;
- the Style page's coloured lamps sit under neutral faders;
- the new BarBeat resting tint needs a contrast check per pack.

Each lane's report and review is summarised in the session.

## How it was built (process notes)

- **Contract first, then lanes by folder.** Each lane owns whole widget folders; shared files (`contract.ts`, `themes/`, `library.test.tsx`, `hues.ts`, `STAGE.md`) change only in small orchestrator commits. Each branch gets a separate Sonnet reviewer, and only accepted findings get fixed. Merges into `design-os` are `--no-ff`, and the full library tests run on the merged result every time.
- **Lessons**:
  - Run the tests on the merged base, not only on the lane's branch. A primitive gaining `data-state` broke a region's unscoped test selector on merge.
  - Keep test selectors scoped to the widget.
  - Look at the built Storybook, not just jsdom. The invisible keyboard passed every test.
  - Lanes can't `rm` outside their worktree here, so keep screenshots and scratch files inside it.
- **Leftovers to delete by hand**: `/tmp/claude-501/sb-*`, `/tmp/sf-shots*`, `/tmp/yh-display-shots/`, `/tmp/yh-display-build.txt`, `/tmp/yh-banks-shots*` and `/tmp/yh-stage-measure` (about 144 MB). A permission guard blocked the agents' cleanup.

## Related, outside this repo

- `awesome-claude` PR #27: the `launcher` mod (`/launcher`, `/preview`). It manages the project's `.claude/launch.json` dev servers from the terminal. Merged.
