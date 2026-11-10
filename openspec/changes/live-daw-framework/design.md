# Design

## Context

Three changes built the Live surface on 2026-11-09 (`live-surface`, `live-panel-layout`,
`live-control-panels`). The code is ahead of the specs in places (the applier already mints ids
and refuses to remove the last tab) and behind the premise in others (an unknown version is read
as version 1; one throwing pane takes the surface down; a fader drag has no start or end). This
change closes both gaps and proves the premise with whole DAWs.

It is one change, not the three first suggested: the stories own the deltas, and
`story-spec sync --change` writes every capability whose stories differ from the main specs, so
three changes over the same eight capabilities could not be synced apart.

## Goals / Non-Goals

**Goals:** specs that state each rule once; the app author's contract written and enforced;
parameters and touch as a framework concept; a contained pane failure; a kit capability apart
from the framework; four showcase DAWs.

**Non-goals:** a store, persistence or undo in zen; MIDI or OSC I/O; learn mode outside the
control panel; per-target-kind selection; frame-driven clock hands; changing mix; renaming
`live-midi-learn`.

## Decisions

### D1. Versions the surface knows

`knownVersion(doc)` is true for 1 and 2. For any other version the Workspace draws its head
without tabs or tools and a notice (`data-part="unknown-version"`, "This surface was saved by a
newer version (3)"), registers no handlers, and `applySurfaceIntent` returns the document as
given. Reading an unknown version as version 1 (today) can throw on a missing `rows`.

### D2. What a tab's layout may get wrong

- A leaf naming no instance: skipped (as today).
- An instance no leaf names (an orphan): kept in the document, not drawn. `removeRegion` still
  removes it.
- A leaf named twice: drawn at its first place only. `tabRegions` and the layout walk dedupe.

`checkDocument(doc): SurfaceIssue[]` reports these for an app loading a saved document: unknown
version, duplicate tab or instance ids, a dangling leaf, an orphan instance, a repeated leaf, a
share that isn't positive, an `active` no tab has. It returns plain data (`{ issue, tab?, id? }`)
and repairs nothing: the document is the app's.

### D3. Unknown fields survive

The applier spreads what it changes, so a tab's or an instance's extra fields already survive
most intents. Two places rebuild objects and drop them: `readTab` on a version 1 tab and
`duplicateTab`. Both now spread the source first. A version 1 document's extra top-level fields
are carried into its version 2 reading the same way.

### D4. Kinds of intent

```ts
type IntentKind = 'edit' | 'navigation' | 'history' | 'mode';
intentKind(intent): IntentKind   // selectTab: navigation; undo, redo: history; setEditing: mode; the rest: edit
```

Every intent is JSON: no functions, no class instances, no `undefined` that matters. A scenario
round-trips each through `JSON.stringify` and applies it. The story host uses `intentKind` in
place of its own `selectTab` special case, which is the rule an app's store wants.

### D5. A missing target

A region is **unbound** when its binding is fixed, its kind declares `targets`, the app passes
`targets`, and none of that kind has the binding's id. The leaf draws a placeholder in place of
the pane ("Hi-hat is bound to a target that is gone"), marked `data-unbound`. Edit mode's tools
still work on it, and its bind control shows no target picked. When the app passes no `targets`
the surface can't know, and draws the pane with the target as written.

### D6. A failing pane is contained

A registered `Contain` component (`view/Contain.tsx`, `view/Contain.svelte`, one line each in the
component registries) wraps each region's content slot. React: an error boundary class. Svelte:
`<svelte:boundary>` with a `failed` snippet. Both draw the same note (`data-part="failed"`,
`role="alert"`, the region's title and "stopped") and a Retry button that mounts the pane again.
`onPaneError?({ region, message })` tells the app. It is a view-layer component, not markup in a
binding, so the bindings-only rule holds.

### D7. Parameters and touch

The catalogue types stay where they are (`ControlParam` in `Music/live/ControlPanel`, built on
Music's `Param`); the capability is what moves. `ControlPanel` gains

```ts
onTouch?(touch: { param: string; down: boolean }): void
```

shaped like `onTrigger`. A fader, knob or XY sends `down: true` before its first `onParam` of a
gesture and `down: false` after its last (an XY for both of its parameters). A keyboard step is a
whole gesture: down, the move, up. A toggle, button and pad send no touch (a switch is one move; a
trigger already has down and up). The bracket comes from pointer and key events on the control's
cell, captured in the model's handlers, so the Music controls themselves don't change. If the
control is removed mid-gesture, the up is still sent.

### D8. Settings that no longer fit

`resolveSettings` returns the default for a `choice` whose value isn't an option, a `toggle` that
isn't a boolean, and a `number` that isn't finite; a finite `number` is clamped to its range; a
`choices` value keeps only values that are options. The document keeps what it holds: only the
resolved value changes.

### D9. The reference kit and the showcase DAWs

`live-reference-kit` owns the two Music requirements that sat in the registry and settings specs,
and a third: whole DAWs are composed from the kit. `Music/live/daws/` holds, per DAW, a surface
document built by intents (as the looper board is), its pack and its frame size:

| DAW | What it is | Pack | Frame |
|---|---|---|---|
| Dub desk | strips, a wide control panel of sends and filters, throws and cuts under the hands | a dark console pack | 1440 × 900 |
| Orbit lab | two orbit clocks fixed to different tracks, the compass, the progression, dice, a landing | a light pack | 1440 × 900 |
| Stem booth | the stem deck, sections, cuts, four strips and a crossfade panel | a high-contrast pack | 1280 × 800 |
| Pocket | song card, cut pads and four macro pads on a phone | any | 390 × 780 |

They share the live views' stand-in host (`useLiveSet`), so each is linked and running. One play
per DAW checks every region draws a pane of the kit and none is cramped. The packs are picked
from `themes/packs.ts` when building; no new pack is added.

### D10. The proof scenarios

- **A minimal host:** `<Workspace name document panes pane onIntent>` with one kind of the story's
  own, `applySurfaceIntent` in a `useState`, and nothing else (no targets, selection, undo, frame
  or settings). A person adds a second pane and docks it.
- **Two surfaces, one document:** two Workspaces on one host. An edit in the first appears in the
  second; edit mode in one leaves the other playing.

## Risks / Trade-offs

- **`Contain` hides bugs.** A thrown error becomes a small note. `onPaneError` and the console
  still carry it, and stories that expect no failure assert no `failed` part.
- **Touch from DOM events.** Bracketing by pointer and key events on the cell could miss a
  gesture a control ends another way. The scenarios cover pointer drag, keyboard step and removal
  mid-gesture.
- **Moving requirements between capabilities** shows as removed in one delta and added in
  another. The scenarios and their plays are the same stories.

## Open Questions

- Should `checkDocument` also offer a repair? This change: no; it only reports.
