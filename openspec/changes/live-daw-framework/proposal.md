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

**The specs say what is already true, once.**

- The two applier requirements become one; the two version 1 requirements become one, stated as
  "a version 1 document draws" with mix's default document as its example, not as the definition.
- The form-picking rule lives in `live-panel-layout` only, and gains the cramped case (a region
  with less room than its smallest form draws that form and is marked).
- The intent list names `setEditing`; the settings list names the multi-choice type; the
  unknown-kind rule speaks of leaves, not rows.

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

**The framework and the reference kit are separate.**

- `live-reference-kit` (new) takes the Music live set, its declared settings, and what is built
  from it. The framework specs name no particular pane.
- **Proof of the premise:** a minimal host (a document, one pane of the app's own, the applier,
  nothing else), and two surfaces drawing one document.
- **Showcase DAWs.** Four whole DAWs composed on the framework, each a surface document, a pack
  and a stand-in host: a dub desk, a generative orbit lab, a stem booth and a pocket remote.
  Stories under `Music/Live/DAWs`.

**Not in this change:** learn mode beyond the control panel (the strips' faders name no
parameters yet; it needs them to, which is its own change, and the capability keeps its name
`live-midi-learn` until then); per-target-kind selection; frame-driven hands for the clocks;
changing mix.

## Capabilities

### New Capabilities

- `live-parameters`: the app's parameter catalogue, values as readings, moves and triggers as
  asks, and touch on a continuous gesture.
- `live-reference-kit`: the Music live panes as a ready-made set, their settings, and the whole
  DAWs composed from them.

### Modified Capabilities

- `live-surface-document`: version 1 as one requirement; unknown versions; orphan and repeated
  leaves; unknown fields kept; `checkDocument`.
- `live-surface-editing`: one applier requirement; intents as plain data in four kinds; who names
  ids; the last tab; `setEditing` in the list.
- `live-host-contract`: discrete and continuous gestures; a failing pane is contained; a minimal
  host; two surfaces on one document.
- `live-pane-registry`: the pane author's contract; a missing target; the reference kit and the
  form rule move out.
- `live-pane-settings`: the multi-choice type; invalid values read as the default; the kit's
  settings move out.
- `live-panel-layout`: the cramped case; a locked tab while editing.
- `live-control-panels`: the parameter requirements move to `live-parameters`.

## Impact

- `src/library/layout/Workspace/` (`surface.ts`, `Workspace.model.ts`, `Workspace.types.ts`, the
  bindings, the stories); `src/library/view/` (a registered `Contain` component, both renderers).
- `src/library/Music/live/ControlPanel/` (`onTouch`); `src/library/Music/live/daws/` (new: the
  showcase documents, their host and stories).
- Public API, additive only: `checkDocument`, `intentKind`, `knownVersion`, `onTouch`. No export
  is removed or renamed. A document of an unknown version stops drawing (it drew wrongly before).
- `docs/workspace.md`, `docs/live-views.md`.

## Validation

**Before merging:** `npm run typecheck`; `npx vitest run src/library/layout src/library/view
src/library/tiers.test.ts src/library/parity.test.tsx src/library/library.test.tsx`;
`npm run build:lib && npm run check:lib`; `npm run build:storybook`; every play under
`Design OS/Layout/Workspace`, `Music/Live` passing; `story-spec sync --change live-daw-framework
--check` reporting nothing; `openspec validate live-daw-framework --strict`; the PR's required
`checks` job (main is gated: `pull-request`). Each showcase DAW looked at in a browser at its
frame size.

**While building:** after each task group, `npm run typecheck` and
`npx vitest run src/library/layout`.

**Review:** `look`. Once merged, open `Music/Live/DAWs` and play each of the four.
