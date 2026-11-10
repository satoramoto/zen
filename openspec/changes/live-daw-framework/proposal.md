# Proposal

## Why

The Live work is "a UI framework to build your own DAW": zen supplies the contract, the
components and the hooks; the app owns the document, the history and the engine. A review of the
eight `live-*` specs against that premise found three things that blunt it. The specs still read
like their delta history (two applier requirements, two version 1 requirements, version 1 words in
version 2 rules, a stale claim about mix). Things an app author needs are only in the designs or
the code (who names ids, what an unknown version does, what a missing target shows, when a fader
drag starts and ends). And the framework and the Music reference kit are mixed together, so no
spec says what an app gets if it brings its own panes.

## What Changes

**The specs say what is true.**

- The unknown-kind rule speaks of leaves, not rows, and covers a leaf named twice and an instance
  no leaf names. The stale claim that mix lacks only `retitleRegion` is replaced by the edits the
  scenario actually makes.
- The intent list names `setEditing`; the settings list names the multi-choice type; the form rule
  gains the cramped case (a region with less room than its smallest form draws that form and is
  marked).
- **Not merged or moved.** The review asked for duplicated requirements to be merged and the kit's
  requirements to move to their own capability. `story-spec sync` writes only added and modified
  requirements and never removes one, and OpenSpec refuses a modified requirement that drops a
  scenario, so a merge or a move can't be written in this loop. Every existing requirement stays
  where it is, under its name. See design D11.

**The contract an app author hits is written and held.**

- **Parameters are a framework concept** (`live-parameters`): the catalogue an app lists, the
  values it gives, the moves a control asks, and **touch**: a continuous control says when a
  gesture on a parameter begins and ends (`onTouch({ param, down })`), so an app can group a drag
  into one undo step or write automation. `live-host-contract` now says a discrete gesture is one
  intent and a continuous one a stream.
- **Bindings.** A region fixed to a target the app no longer offers says so in place of its pane,
  and can still be moved, rebound and removed.
- **The pane author's contract** in one requirement: the instance, its target, its settings with
  defaults filled in, the surface's mode and the form its room fits.
- **Document integrity.** A version the surface doesn't know draws a notice and sends nothing
  (today it is misread as version 1). An instance the layout omits is kept and not drawn; a leaf
  named twice is drawn once. The applier keeps fields it doesn't know. The last tab can't be
  removed. `checkDocument` lists a saved document's problems for an app loading one.
- **Ids.** The applier names what it adds unless the app gives it a namer.
- **Intents are plain data**, and each is one of four kinds (`intentKind`): an edit, navigation,
  history or mode, so an app knows what belongs in its undo.
- **A failing pane is contained.** A pane that throws is replaced by a note with a retry, and
  every other region plays on.
- **Settings.** A value its setting no longer allows (out of range, an option that is gone) reads
  as the default.
- **Lock.** A locked tab opened while editing shows no edit chrome and can't be renamed or
  removed.

**The premise is shown.**

- `live-reference-kit` (new): whole DAWs composed from the Music live panes alone. Four of them,
  each a surface document, a pack and a stand-in host: a dub desk, a generative orbit lab, a stem
  booth and a pocket remote. Stories under `Music/Live/DAWs`.
- A minimal host (a document, one pane of the app's own, the applier, nothing else), and two
  surfaces drawing one document.

**Not in this change:** learn mode beyond the control panel (the strips' faders name no
parameters yet; it needs them to, which is its own change, and the capability keeps its name
`live-midi-learn` until then); per-target-kind selection; frame-driven hands for the clocks;
changing mix.

## Capabilities

### New Capabilities

- `live-parameters`: the app's parameter catalogue as plain data, and touch around a continuous
  gesture.
- `live-reference-kit`: the whole DAWs composed from the Music live panes.

### Modified Capabilities

- `live-surface-document`: unknown versions; orphan and repeated leaves; unknown fields kept;
  `checkDocument`; the version 1 wording.
- `live-surface-editing`: intents as plain data in four kinds; who names ids; the last tab;
  `setEditing` in the list.
- `live-host-contract`: discrete and continuous gestures; a failing pane is contained; a minimal
  host; two surfaces on one document.
- `live-pane-registry`: the pane author's contract; a missing target.
- `live-pane-settings`: the multi-choice type; values that no longer fit read as the default.
- `live-panel-layout`: the cramped case; a locked tab opened while editing.

## Impact

- `src/library/layout/Workspace/` (`surface.ts`, `Workspace.model.ts`, `Workspace.types.ts`, the
  bindings, the stories); `src/library/view/` (a registered `Contain` component, both renderers).
- `src/library/Music/live/ControlPanel/` (`onTouch`), `src/library/Music/live/touch.bind.ts`;
  `src/library/Music/live/daws/` (new: the showcase documents, their host and stories).
- Public API, additive only: `checkDocument`, `intentKind`, `knownVersion`, `onTouch`. No export
  is removed or renamed. A document of an unknown version stops drawing (it drew wrongly before).
- `docs/workspace.md`, `docs/live-views.md`.

## Validation

**Before merging:** `npm run typecheck`; `npx vitest run src/library/layout src/library/view
src/library/tiers.test.ts src/library/parity.test.tsx src/library/library.test.tsx`;
`npm run build:lib && npm run check:lib`; `npm run build:storybook`; every play under
`Design OS/Layout/Workspace`, `Music/Live` passing; `story-spec sync --change live-daw-framework
--dir src/library/layout --dir src/library/Music/live --check` reporting nothing (the two folders
that hold the Live stories: zen's other stories belong to capabilities planned in the `zen-flow`
store); `openspec validate live-daw-framework --strict`; the PR's required
`checks` job (main is gated: `pull-request`). Each showcase DAW looked at in a browser at its
frame size.

**While building:** after each task group, `npm run typecheck` and
`npx vitest run src/library/layout`.

**Review:** `look`. Once merged, open `Music/Live/DAWs` and play each of the four.
