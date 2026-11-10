# The workspace: the surface an app composes its DAW on

A solo set needs different screens at different moments: launching loops, riding sends,
following a chord, throwing a delay. No single fixed arrangement serves all of them. The
workspace is tabs of self-assembling screens (`Screen` + `assemble()`, docs/assembly.md) that an
app lays out from its own pane kinds, plus an edit mode for rearranging them. It is the Lemur
idea, constrained: you lay out **regions** (blocks), never pixels, so every tab still steps its
forms down on a small window and still reads in every theme pack.

## The line between zen and the app

Zen supplies the UI contract, the components and the hooks. The app owns everything else.

| The app owns | Zen keeps (visual only) |
|---|---|
| the document (tabs, rows, region instances, bindings) and which tab is open | edit mode, unless the app passes `editing` |
| its history (undo, redo) and saving it | the region whose tools are open, unless the app passes `editingRegion` |
| the selection a region follows, and the targets it can be bound to | the palette's state, unless the app passes `paletteOpen` |
| the readings every pane draws, and the engine behind them | a title being typed, until it is saved |

The surface never writes the document. Every edit leaves it as one intent through `onIntent`. The
app applies it, with its own store (mix's `SurfaceStore`) or with zen's pure
`applySurfaceIntent`, and passes the next document back. Until then the surface keeps showing the
document it was given.

## The document

```ts
type SurfaceBinding = { mode: 'selected' } | { mode: 'fixed'; target: string };
interface SurfaceRegion { id: string; kind: string; title: string; binding: SurfaceBinding; settings?: Record<string, SettingValue> }
type LayoutNode = string | { id: string; split: 'row' | 'column'; children: { node: LayoutNode; share: number }[] };
interface SurfaceTab { id: string; title: string; layout: LayoutNode | null; regions: readonly SurfaceRegion[]; locked?: boolean }
interface SurfaceDocumentV2 { version: 2; active: string; tabs: readonly SurfaceTab[] }
type SurfaceDocument = SurfaceDocumentV1 | SurfaceDocumentV2;
```

A tab is a **split tree**: a split lays its children side by side (`row`) or stacked (`column`),
each taking its **share** of the split's room, to any depth; a leaf is a region **instance id**.
Shares are relative, so a panel keeps its proportions in any window. A region's kind is read from
`kind`, never from its id, so a tab can hold two instances of one kind. A leaf naming an instance
the tab doesn't hold is skipped. A `kind` the app never defined draws a placeholder that names it
and can still be moved and removed. An `active` id that matches no tab shows the first tab.

**What a document may get wrong.** The surface draws a document as well as it can and never
repairs it: the document is the app's.

- A **version** it doesn't read (any but 1 and 2, `knownVersion`) draws a notice naming it, with
  no tabs or tools, and no intent leaves it; `applySurfaceIntent` returns it as given.
- A leaf the layout names **twice** is drawn once, at its first place. An instance **no leaf
  names** is kept and not drawn.
- **Fields the surface doesn't know**, on the document, a tab or an instance, are carried through
  every reading and edit, so an app can keep its own data there.
- `checkDocument(document)` lists a saved document's problems as plain data (`{ issue, tab?, id? }`:
  `unknown-version`, `duplicate-tab`, `unknown-active`, `duplicate-region`, `dangling-leaf`,
  `repeated-leaf`, `orphan-region`, `bad-share`), for an app loading one. Empty means sound.

**Version 1** is mix[flow]'s rig document field for field (mix `src/rig/contract.ts`: a tab is rows of
instance ids). The surface draws it through its version 2 reading (`readDocument`): a column of
its rows, each row's regions side by side, equal shares. `applySurfaceIntent` returns version 2
whenever it changes a document, so an app that applies layout edits to mix's documents ends up on
version 2 and must be able to store it.

**A missing target.** A region fixed to a target says "bound to a target that is gone" in place
of its pane when its kind can be bound, the app passes `targets`, and none of that kind has the
binding's id. Edit mode's tools still work on it and its bind control shows nothing picked. An
app that passes no `targets` gets the pane with the target as written: the surface can't know.

Each region draws the **richest form its room fits**: the surface measures every leaf and picks
the first of its kind's forms whose least room (`min`) fits (`formForRoom`); a region too small even
for its smallest form draws that form and is marked `data-cramped`. Nothing reflows: a panel sized
by hand keeps its sizes.

## Pane definitions

```ts
interface PaneDefinition {
  kind: string; label: string; description?: string;
  forms: Forms; priority?: Rank; plate?: boolean; head?: boolean;
  targets?: string;            // what a fixed binding can point at, in the app's words ('track')
  settings?: SettingSpec[];    // what a region of this kind can be told
}
type SettingSpec = { key: string; label: string } & (
  | { type: 'choice'; options; default } | { type: 'choices'; options; default }
  | { type: 'toggle'; default } | { type: 'number'; min; max; step?; default }
  | { type: 'targets'; of: string; default: 'all' | string[] }   // a pick of the app's targets
  | { type: 'data'; default: JsonValue }                          // plain data the pane edits itself
);
```

Definitions are plain data, so they import no renderer. The app draws each instance:
`pane={(region, target, settings) => …}` in React, or a `pane` snippet with the same three
arguments in Svelte. `target` is the region's fixed target, or else the app's `selected`;
`settings` are the region's values with every default filled in (`resolveSettings`; `'all'`
targets expanded). The palette lists exactly the definitions, in order, by label and description.
`Music.livePanes` is a ready-made set: the live panes (`Music/live/panes.ts`); the launch grid and
the strips pick their tracks, the cut pads their cuts, the dice pad its moves, the control panel
its grid and its cells.

A `data` setting is plain JSON the pane edits itself (a control panel's cells): it reaches `pane`
with the others and is never listed in the settings sheet. The pane asks for a change and the app
sends it on as `configureRegion` with the region's whole next settings.

**What a pane is told.** For each instance: the instance, its resolved target, its settings with
defaults filled in, the surface's mode and the form its room fits (`useForm`). A value its setting
no longer allows reads as the default (a choice that is gone, a toggle that isn't one, a number
that isn't one), a number is held to its range, and a pick of several keeps only what is still
offered; the document keeps what it holds.

**A pane that fails.** Each pane is drawn inside `Contain` (`view/Contain.tsx`, `.svelte`): if
drawing it throws, a note takes its place ("Loudness stopped", with Retry), `onPaneError({ region,
message })` tells the app, and every other region plays on.

**Surface mode.** Each pane is drawn inside the surface's mode, `{ editing, locked }`:
`useSurfaceMode()` in React, `getSurfaceMode()` in Svelte (`building(mode)` is `editing && !locked`).
A pane with building tools of its own shows them only while the surface is building, so one edit
mode and one lock govern the whole panel.

## Edit mode

- **Resize.** A handle sits between every two siblings of a split, a finger wide. Dragging it
  previews the two shares (visual state) and sends one `resizeSplit` on release; the arrow keys on
  a focused handle send one per step (5% of the pair). Neither gives a region less room than its
  smallest form.
- **Dock.** A region's tag is its grip: dragged past 6 px onto another region it shows the zone
  under the pointer (an outer quarter of an edge: left, right, above, below; else swap) and sends
  one `dockRegion` on release; a drop outside every region sends nothing. Pressed, the tag opens
  the region's tools in a row under the head: step moves (left and right within the nearest row,
  up and down within the nearest column), rename, settings, remove, bind.
- **Settings.** The sheet lists the kind's settings with their values; each change sends one
  `configureRegion` with the region's whole next settings (values the kind no longer declares are
  kept).
- **Lock.** Lock sends `lockTab` and leaves edit mode. A locked tab shows only "Locked · hold to
  unlock" in the head: no Edit, frames, handles or tags, and every pane takes every touch. A hold
  (the system's long press) or Enter unlocks it; a brief press does nothing. Tabs still switch.

Every tool is at least the minimum target, nothing appears only on hover, and every step works
from the keyboard alone.

## The intents

| Intent | From |
|---|---|
| `selectTab { tab }` | the tab strip |
| `addTab`, `renameTab`, `duplicateTab`, `removeTab`, `lockTab { tab, locked }` | the head's tools |
| `addRegion { tab, kind, beside?, zone? }` | the palette: beside the open region, else at the end of the tab (the app picks the id) |
| `removeRegion`, `moveRegion { direction }`, `retitleRegion`, `bindRegion`, `configureRegion { settings }` | the open region's tools and sheet |
| `dockRegion { region, target, zone }` | dragging a tag |
| `resizeSplit { split, shares }` | a handle |
| `setEditing { editing }` | Edit / Done |
| `undo`, `redo` | shown only when the app passes `canUndo` / `canRedo` |

Every intent is plain data: it reads back the same after `JSON.stringify`, so an app can log it,
replay it or send it to another process. `intentKind(intent)` says what to do with one: an `edit`
changes the document and belongs in the app's history; `navigation` (`selectTab`) changes which
tab is open and doesn't; `history` is undo and redo; `mode` is `setEditing`, never in the
document. The applier names each tab, region and split it adds (`freshId`) unless the app passes
`newId`, returns the document as given for an intent it can't apply, and never removes the last
tab.

They are named after mix's `SurfaceStore` methods. Mix's store has no `retitleRegion`,
`configureRegion`, `dockRegion`, `resizeSplit` or `lockTab` yet; its follow-up adds them with
version 2.

## The least a host gives

A document, one pane kind, a `pane` and a way to apply intents (`applySurfaceIntent` in a
`useState` will do). Everything else is offered only when the host gives it: no `targets`, no bind
control; no `canUndo`, no undo; no `settings`, no sheet; no `panes`, no palette. `Design
OS/Layout/Workspace/Host` plays that host, and two surfaces on one document: an edit in one
appears in the other, and each keeps its own edit mode.

## What the workspace does not do

- No pixels. Shares and forms, never coordinates, so a panel re-themes and fits another window.
- No per-use colour. Frames, the sheet and the handles' nubs are plates; tags and tools are buttons.
- No document state, no history, no saving: those are the app's (above).
