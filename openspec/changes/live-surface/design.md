# Design

## Context

Three things exist and overlap:

- `layout/Workspace`: tabs of `ScreenSpec`s, perform and edit mode, six structural edits that
  return the tab's next `ScreenSpec` through `onSpec`, bindings as a side map through `onBinding`.
- `live/views.ts`: `LiveDocument`, mix's surface document copied by hand, turned into `ScreenSpec`s
  by `liveScreen`, with a closed `PANE_KINDS` map; `LiveSet.story.tsx` stitches the two together.
- mix `src/rig/`: the same document in `contract.ts`, a store with undo, import and export
  (`runtime/`), and its own `SurfaceEditor` and `RegionEditor` drawn beside zen's `Screen` and `Tabs`.

The person's line: **zen ends at the UI layer.** The app owns the document, its history, its
persistence, the readings and the engine. Zen owns only what the app doesn't track: visual state.

## Goals / Non-Goals

**Goals:** one document type; app-supplied pane definitions; every edit as an intent; visual state
that is uncontrolled by default and controllable; a written host contract including a frame reader;
the live views and the Workspace's tabs as reference documents; a mix-shaped story.

**Non-goals:** a document store, persistence or undo in zen; changing mix (a follow-up change);
new panes; new binding modes; changing any Music live pane's look.

## Decisions

### D1. The document is mix's, verbatim

`SurfaceDocument` = `{ version: 1; active: string; tabs: SurfaceTab[] }`, `SurfaceTab` =
`{ id, title, rows: string[][], regions: SurfaceRegion[] }`, `SurfaceRegion` =
`{ id, kind: string, title, binding: SurfaceBinding }`, `SurfaceBinding` = `{ mode: 'selected' } |
{ mode: 'fixed'; target: string }`. These are mix's names and fields, so mix's values are already
assignable (mix's `kind` is a narrower union of strings; `surface.test.ts` holds that at the type
level). They live beside the component that draws them, in `layout/Workspace/Workspace.types.ts`
(framework-free): the surface is generic layout, and a layout file never imports `live/`.
`LiveDocument`, `LiveTab`, `LiveRegion` and `LiveBinding` are gone; zen's own stories were their
only users.

*Rejected:* keeping `ScreenSpec` tabs as the document. A `ScreenSpec` is the solver's input (forms,
priorities, nests); it is derived from the document and the definitions, never stored.

### D2. Pane definitions are data; drawing is a slot

```ts
interface PaneDefinition {
  kind: string; label: string; description?: string;
  forms: Forms; priority?: Rank; plate?: boolean; head?: boolean;
  /** What a fixed binding can point at, in the app's words ('track', 'song'); none: no binding. */
  targets?: string;
}
interface SurfaceTarget { id: string; label: string; kind: string }
```

The surface derives each tab's `ScreenSpec` from the document plus the definitions (today's
`liveScreen`, generalised) and fills each region with a slot keyed by instance id. In React the app
passes `pane={(region, target) => ReactNode}`; in Svelte a `pane` snippet with the same arguments.
A missing definition draws the placeholder (spec: "What the surface doesn't know"). This keeps the
definitions framework-free, which the bindings-only rule needs.

*Rejected:* a `render` function inside the definition. It would tie the registry to one renderer.

### D3. Intents, named after mix's store

```ts
type SurfaceIntent =
  | { type: 'selectTab'; tab: string }
  | { type: 'addTab'; title?: string } | { type: 'renameTab'; tab: string; title: string }
  | { type: 'duplicateTab'; tab: string } | { type: 'removeTab'; tab: string }
  | { type: 'addRegion'; tab: string; kind: string; row: number; index?: number }
  | { type: 'removeRegion'; tab: string; region: string }
  | { type: 'moveRegion'; tab: string; region: string; direction: 'left' | 'right' | 'up' | 'down' }
  | { type: 'retitleRegion'; tab: string; region: string; title: string }
  | { type: 'bindRegion'; tab: string; region: string; binding: SurfaceBinding }
  | { type: 'setEditing'; editing: boolean }
  | { type: 'undo' } | { type: 'redo' };
```

One `onIntent(intent)` prop. Mix maps each to one store method (`retitleRegion` and the `row`/`index`
of `addRegion` are the two things mix's store lacks today; the follow-up adds them).
`applySurfaceIntent(doc, intent, { newId })` returns the next document, unchanged for unknown
targets; `undo`, `redo` and `setEditing` return it unchanged (they are not document edits). The
Workspace's `split` edit goes: a split is an add beside a region, so it becomes `addRegion` at that
region's index.

### D4. Visual state: uncontrolled, then controllable

`editing`, `editingRegion`, `paletteOpen` and the drag in progress are held by a framework-free
store (`bindSurfaceUi`, registered in `view/stores.ts` like the other stores) unless the matching
prop is passed. A passed prop wins and a change asks through `onIntent({ type: 'setEditing' })` or
`onUiChange`. The drag state is never controllable (it lives for one gesture).

### D5. Readings, intents, frame

A pane's props are readings plus `on<Verb>` callbacks (already true of all sixteen). The new part
is `readFrame?: () => LiveFrame` (`{ beat?, position?, levels? }`, in `Music/live/live.model.ts`),
mix's `readFrame`. The Music family already samples frames in its mixer (`mixer/frames.bind.ts`:
`frameLoop`, `bindFrameMeter`), so the live panes reuse that. `TrackStrips` draws each meter with
the frame meter store, sampling `levels[track.id]`. `StemDeck` draws its playhead with a small new
store, `liveFrameVar`, which writes `position` to a custom property and hides the playhead while
there is none. Neither pane's tree is rebuilt per frame. Panes that take `beat` as a prop
(`OrbitClock`, `LandingDial`, `ProgressionStrip`) keep it in this change: their hands are SVG
geometry computed in the model, and moving them to the frame is its own piece of work.

### D6. Where things live

- `layout/Workspace/`: `Workspace.types.ts` (the document, `PaneDefinition`, `SurfaceIntent`,
  `SurfaceUi`) and `surface.ts` (`openTab`, `surfaceScreen`, `applySurfaceIntent`…), framework-free
  and unit-tested; the component stays `Workspace` (it is the surface; renaming it would churn every
  story title for nothing) and takes `document`, `panes`, `targets`, `selected`, `canUndo`,
  `canRedo`, `onIntent` and `pane`.
- `Music/live/panes.ts`: `LIVE_PANES` and `livePanes`, the sixteen definitions that were
  `PANE_KINDS`, exported as `Music.livePanes` from both entries. `Music/live/live.model.ts` gains
  the frame type (D5).
- `live/views.ts` keeps the reference documents only; `Live/Views` applies intents through
  `applySurfaceIntent` in a story host with its own undo history (`layout/Workspace/host.story.ts`).
- `live/stories/MixRig.stories.tsx`: a fixture in mix's document shape and kinds (copied as data;
  nothing imports across repos) with stand-in panes, edited through a mix-shaped store stand-in.

## Risks / Trade-offs

- **The Workspace's tree snapshot and tiers baseline move.** It is a converted component; its
  fixtures change shape. Mitigation: land the model and fixtures together, re-record the snapshot
  once, and check the tiers counts only go down.
- **Frame writes outside the tree.** A store writing CSS variables per frame bypasses both
  renderers. That is what the stores are for (size observation does the same), and the parity
  test covers the static DOM.
- **Mix lags.** Until the follow-up lands, mix keeps its own editor. The mix-shaped story is the
  evidence the contract fits before mix pays for the move.

## Open Questions

- Should region titles be editable in perform mode (a long-press), or only in edit mode? This
  change: edit mode only.
- Frame-driven hands for `OrbitClock`, `LandingDial` and `ProgressionStrip` (D5).
