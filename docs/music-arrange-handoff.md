# Next task: the missing Arrange view

## Goal and current boundary

The user explicitly called out **the Arrange view as missing** after the Music mixer port.
Port that view next, with the same reference fidelity and Zen theme integration. This is
not a request to redesign it or to invent an arrangement editor from the mixer waveform rows.

What is delivered already:

- `src/library/Music/`: controlled four-deck mixer, deck/master strips, transport, controls,
  measured waveforms, frame stores, React and Svelte bindings.
- Public `Music` namespace in `@satoramoto/zen` and `@satoramoto/zen/svelte`.
- `mixflow` pack/facets and integration with the existing Zen theme editor.
- Compact component specimens; organized Music sidebar; all 132 existing story IDs preserved.

**Not delivered:** an Arrange screen/composition, its timeline/ruler/slice/warp interactions,
or migration of the real mix[flow] app to consume Zen. The old `components/music/` remains
intact; consolidation is separately deferred.

The prior request was to merge the mixer work to `main`. Check the PR/branch state before
starting: the existing checkout is `/home/ryan/Projects/satoramoto/zen-music`, branch
`feat/music-port`. Do not discard work or assume that another agent's changes are yours.

## Find the actual reference first

Source checkouts (read-only for this Zen port):

- `/home/ryan/Projects/openflowfm/mix`: the real app. Inspected at
  `670f2828bbd0fe3e855a083b12eac835d10c2302`; verify its current revision before comparing.
- `/home/ryan/Projects/openflowfm/widgets`: shared controls and the original mixer story,
  previously pinned at `7edeedc37e5e4a33315d98ddb93a5a21d6e68eb8`.

**Naming ambiguity to resolve:** the inspected mix checkout calls its views **Prep / Play**,
not Arrange, and has no `ArrangeView` file. The likely reference is the ready-track Prep
timeline (`Lanes`), but that mapping is an assumption. Confirm the intended screen against
the actual app/user reference before implementing a different view. Do not report that an
Arrange source story already exists: none was found in widgets.

Read `mix/README.md` and these source files/docs:

| Reference | What it establishes |
| --- | --- |
| `mix/src/App.tsx` | Header/library/main layout; `playView === false` and `mix.phase === 'ready'` mount `Lanes`. |
| `mix/src/components/Lanes.tsx`, `Lanes.css` | Shared horizontal scale, source lanes and heads, band/summary, zoom/follow, level/mute/solo, optional bass tablature. |
| `mix/src/components/Ruler.tsx` | Musical ruler and section/slice interactions. |
| `mix/src/components/WarpLane.tsx` | Beat/warp lane, markers and editing gestures. |
| `mix/src/components/Waveform.tsx` | The app timeline waveform, grid, overlays and its gesture/rendering contract. This is not automatically equivalent to `Music.Waveform`. |
| `mix/src/components/Tone.tsx` | Per-source tone controls in lane heads. |
| `mix/src/components/BeatGridEditor.tsx`, `suggestions.ts` | Grid-review surface and suggested sections; separate host policy from drawn UI. |
| `mix/src/components/Tablature.tsx` | Optional bass notation adapter; inspect before deciding whether it belongs in the agreed first slice. |
| `mix/src/components/Header.tsx`, `Header.css`, `mix/src/App.css` | Host chrome and layout context, not a reason to alter the existing mixer baseline. |
| `mix/src/zoom.ts`, `grid.ts`, `slices.ts`, `warp.ts`, `state.ts` | Current coordinate systems and command/state semantics. Do not port the audio engine wholesale. |
| `mix/docs/window.md`, `track-review.md`, `playback.md`, `pinned.md` | Intended layout, timeline/grid interaction and ownership. Read source when prose and implementation disagree. |

## Implementation direction

1. Inventory the confirmed view and capture **before** screenshots before changing code.
   Build one deterministic, paused, source-faithful story, not only isolated component demos.
   Establish the scope of app chrome versus the reusable arranging region explicitly.
2. Put reusable arranging UI in `src/library/Music/` (an `arrange/` area is a suggested
   location, not an API already present). App-specific library/analysis/export/engine behavior
   belongs in mix; expose controlled data and semantic callbacks rather than importing `useMix`.
3. Reuse current Music controls, scoped theme vocabulary, parameter stores and waveform
   machinery where they truly match. Preserve ruler/grid/sample/beat coordinates and source
   semantics; do not substitute the mixer's four-deck preview as the missing Arrange view.
4. Follow `AGENTS.md` and `docs/svelte-bindings.md`: shared framework-free view-tree models
   and plain-TS stores, thin React/Svelte `Tree` bindings. Register component/store names in
   both renderers, and expose additions through the two public `Music` namespaces.
5. Use the enclosing Zen theme scope. No second ThemeRoot, fixed inner mixflow theme,
   hardcoded component palette, or production dependency on another checkout. Source colours
   and geometry belong in facets/tokens; other Zen packs and mixed facets must actually work.
6. Add a shallow **Music / Arrange / …** catalog group if that is the confirmed view. Keep
   existing Mixer/Controls/Displays/Overlays/Themes/Foundations groups and explicit meta IDs.
   Full assembled references may be fullscreen; individual parts stay compact specimens on
   the gentle backdrop with Storybook Controls visible.

The host owns audio, analysis, file access, persistence, beat maps and musical policy. UI
fixtures can simulate host responses without audio/IPC or modifying the person's library.
Verify zoom/pan/seek/snap/loop/slice/warp behavior only where it exists in the agreed source
scope; do not silently implement new editing policy under a fidelity claim.

## Non-negotiable lessons from the mixer port

- Periodically compare with the original **during** development, not only at the end.
- Under mixflow, preserve DOM anatomy, typography/Recursive variable-font axes, geometry,
  spacing, responsive overflow, colours and open interaction states. No redesign or arbitrary
  scaling to make a screenshot fit.
- Keep source HSL precision: rounding to 8-bit hex before `color-mix()` produced visible
  waveform differences. The current contract/editor retains exact untouched source paint.
- Native form control `color-scheme` matters. Mixflow preserves the reference scheme through
  its material facet; do not globally change the browser scheme to fix one checkbox.
- Do not repaint cached waveforms for every ancestor transform/playhead frame. Paused theme
  edits must still repaint without audio analysis or remounting the canvas.
- Flattened tree siblings need unique keys for Svelte. Test actual renderer selection;
  a React-only story harness is not Svelte coverage.
- Do not regress `Music/preview.tsx` / `preview.css`: small parts hug content and larger
  specimens scroll locally. Fullscreen mixer composition is separately preserved.
- The stable desktop wrapper in `src/library/storybook.tsx` prevents theme changes from
  remounting stateful stories. Preserve edited state and mounted canvas identities on swaps.

## Preview and verification

Previously running ports (check availability/ownership; do not kill unrelated processes):

- Zen Music: Storybook `http://localhost:6023/`, app `4192`.
- Original Zen: `6022/4191`.
- Original widgets: `6024`, **mixer/control reference only**, not an Arrange reference.

Zen's unified launcher owns both children:

```sh
PREVIEW_LABEL="Zen Music" PREVIEW_PORT=4192 STORYBOOK_PORT=6023 npm run dev
```

Keep hot reload available. Do not start a replacement child independently. Follow repository
worktree rules for a new task; an isolated worktree needs its own free ports. If the real
source app needs starting, read its own launch instructions first and use non-conflicting ports.

Use **story interaction/visual comparisons plus narrowly scoped hook/lifecycle tests**.
Do not add new helper/model/snapshot unit suites for Arrange. Existing CI still runs the
repository's required checks; builds alone are never browser evidence.

Existing commands to preserve/extend:

```sh
npm run typecheck
npm run test:music:stories
npm run test:music:hooks
npm run test:music:themes
npm run test:music:visual
npm run build:storybook
npm run build:lib
npm run check:lib
```

`scripts/music-stories.mjs` discovers `Music/…` stories, supports ID/title prefixes and both
renderers, and records actual play errors. `scripts/music-visual.mjs` currently targets the
**mixer**; add a distinct Arrange source/target fixture and interaction captures rather than
renaming the mixer baseline or pretending its comparison covers Arrange.

Acceptance evidence should include source/port comparisons at **1440×900, 1280×720 and
900×700**, matching open/selected states, narrow overflow, actual interactions in both
renderers, live pack/facet/editor changes without lost state, and the built public entries.
Record the exact input fixtures, source revision, results and remaining gaps. Do not weaken
tolerances, alter reference data, or claim visual fidelity from a compile/test pass.

## Current baseline to keep green

- Latest catalog run: **258/258 browser checks**, 132 stories; no failures, flakiness or HMR
  recoveries. `.shots/music-catalog/stories/stories-2026-10-29T23-00-49-712Z.json`.
- **27 hook/lifecycle tests**, **39 live pack/facet swaps** passed at the port checkpoint.
- Mixer baseline, FX menu and waveform-settings popup matched the original with **zero
  differing pixels** at all three sizes in React/Svelte; built public entries matched too.
- Original legacy Knob/Fader/Meter/Yahaha Show samples remained pixel-identical. No old
  `components/music/` files were changed.

Read `docs/music.md`, `docs/music-story-evidence.md`, `docs/music-layout-reference.md`, and
the relevant `Music/**/PORT*.md` notes. `.shots/` and temporary browser evidence are ignored,
local artifacts, not assets guaranteed to exist in a fresh clone. Re-run evidence as needed.
