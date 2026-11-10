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

**Goals:** the app author's contract written and enforced; touch around a continuous gesture; a
contained pane failure; document integrity; four showcase DAWs.

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
trigger already has down and up). The bracket is a framework-free store on the control's cell
(`Music/live/touch.bind.ts`, registered as `liveTouch`): it listens in the capture phase so the
down precedes the control's first move, and tells the up a task after the lift so the control's
last move comes first. The Music controls themselves don't change. If the control is removed
mid-gesture, the up is still sent.

### D8. Settings that no longer fit

`resolveSettings` returns the default for a `choice` whose value isn't an option, a `toggle` that
isn't a boolean, and a `number` that isn't finite; a finite `number` is clamped to its range; a
`choices` value keeps only values that are options. The document keeps what it holds: only the
resolved value changes.

### D9. The showcase DAWs

`live-reference-kit` holds one requirement: whole DAWs are composed from the kit. `Music/live/daws/`
holds, per DAW, a surface document built by intents (as the looper board is), its pack and its
window:

| DAW | What it is | Pack | Window |
|---|---|---|---|
| Dub desk | channels, a wide bank of sends and filter with an XY, echo throws and drops under the hands | `yahaha-elektron`, dark | 1440 × 900 |
| Orbit lab | two orbit clocks fixed to different tracks either side of the compass, dice, the landing, the progression | `linear`, light | 1440 × 900 |
| Stem booth | the song now and its sections, the stem deck wide, cuts and a blend panel, four strips | `big-red`, dark | 1440 × 900 |
| Pocket | song card, cut pads, four pads and two faders on a phone | `mixflow`, dark | 390 × 780 |

They share the live views' stand-in host (`useLiveSet`), so each is linked and running. A story
sets its pack through Storybook's `globals`. One scenario per DAW checks every region draws a pane
of the kit, none cramped, and plays one thing on it. No pack and no component is added.

### D10. The proof scenarios

- **A minimal host:** `<Workspace name document panes pane onIntent>` with one kind of the story's
  own, `applySurfaceIntent` in a `useState`, and nothing else (no targets, selection, undo, frame
  or settings). A person adds a second pane and docks it.
- **Two surfaces, one document:** two Workspaces on one host. An edit in the first appears in the
  second; edit mode in one leaves the other playing.

### D11. What the loop can't write: removing, renaming or moving a requirement

The review proposed merging the two applier requirements and the two version 1 requirements,
renaming "A pane asks with one intent per gesture", dropping the form-step scenario from the
registry, and moving the kit's and the parameters' requirements to their own capabilities. None of
that can be written here:

- `story-spec sync --change` renders a delta with ADDED and MODIFIED sections only, and rewrites
  the file whole; a requirement no story covers is reported "not removed". A hand-written REMOVED
  or RENAMED section would make `--check` fail.
- `openspec validate --strict` refuses a MODIFIED requirement that omits a scenario the spec has.

So every existing requirement keeps its name, its capability and its scenarios' names; their texts
are sharpened in place (MODIFIED), and new rules are ADDED beside them. `live-reference-kit` and
`live-parameters` hold only what is new. A capability's Purpose can't change either: sync takes it
from the main spec. Closing this needs story-spec to carry removals a person has decided (for
example a `removes` list on a file's `parameters.spec`), which is a change to story-spec, not to
zen.

## Risks / Trade-offs

- **`Contain` hides bugs.** A thrown error becomes a small note. `onPaneError` and the console
  still carry it, and stories that expect no failure assert no `failed` part.
- **Touch from DOM events.** Bracketing by pointer and key events on the cell could miss a
  gesture a control ends another way. The scenarios cover pointer drag, keyboard step and removal
  mid-gesture.
- **Duplicated requirements stay** (D11) until story-spec can remove one.

## Open Questions

- Should `checkDocument` also offer a repair? This change: no; it only reports.
