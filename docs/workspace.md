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
interface SurfaceRegion { id: string; kind: string; title: string; binding: SurfaceBinding }
interface SurfaceTab { id: string; title: string; rows: readonly (readonly string[])[]; regions: readonly SurfaceRegion[] }
interface SurfaceDocument { version: 1; active: string; tabs: readonly SurfaceTab[] }
```

This is mix[flow]'s rig document field for field (mix `src/rig/contract.ts`, version 1), so mix's
values are zen's as they are. A tab is rows of region **instance ids**, top to bottom, and the
instances they name. A region's kind is read from `kind`, never from its id, so a tab can hold
two instances of one kind. A row entry naming an instance the tab doesn't hold is skipped. A
`kind` the app never defined draws a placeholder that names it and can still be moved and
removed. An `active` id that matches no tab shows the first tab.

## Pane definitions

```ts
interface PaneDefinition {
  kind: string; label: string; description?: string;
  forms: Forms; priority?: Rank; plate?: boolean; head?: boolean;
  targets?: string; // what a fixed binding can point at, in the app's words ('track')
}
```

Definitions are plain data, so they import no renderer. The surface lays each region out by its
kind's forms (`surfaceScreen(tab, panes)` is the ScreenSpec the solver draws) and asks the app to
draw the instance: `pane={(region, target) => …}` in React, or a `pane` snippet with the same two
arguments in Svelte. `target` is the region's fixed target, or else the app's `selected`. The
palette lists exactly the definitions, in order, by label and description.
`Music.livePanes` is a ready-made set: the sixteen live panes (`Music/live/panes.ts`).

## The intents

| Intent | From |
|---|---|
| `selectTab { tab }` | the tab strip |
| `addTab { title? }`, `renameTab { tab, title }`, `duplicateTab { tab }`, `removeTab { tab }` | the head's tools while editing |
| `addRegion { tab, kind, row, index? }` | the palette: beside the open region, else on the last row (the app picks the id) |
| `removeRegion`, `moveRegion { direction }`, `retitleRegion { title }`, `bindRegion { binding }` | the open region's tools |
| `setEditing { editing }` | Edit / Done |
| `undo`, `redo` | shown only when the app passes `canUndo` / `canRedo` |

They are named after mix's `SurfaceStore` methods. Mix's store has no `retitleRegion` yet, and
its `addRegion` takes no position. In edit mode a region's frame carries only its tag. Pressing
the tag opens that region's tools in a row under the head, so a narrow pane never cuts them off.
Regions move one step at a time: left and right within the row, or up and down into the
neighbouring row. A region that shares the top or bottom row leaves it for a new row of its own.

## What the workspace does not do

- No sizes, ever. A region's forms are its kind's; the solver picks one per placement.
- No per-use colour. Frames are plates, tags and tools are buttons, the field is a well.
- No document state, no history, no saving: those are the app's (above).
- No nesting. Mix's documents are flat rows; a split that stacks two regions in one column is not
  offered.
