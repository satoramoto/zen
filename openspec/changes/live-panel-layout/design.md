# Design

## Context

`live-surface` gave zen a surface an app composes from: the app's document (mix's version 1, rows
of region ids), the app's pane definitions, every edit as an intent, and visual state only.
Layout today goes through `Screen`, whose solver sizes every region from its forms and rank. The
person can't size anything. The person wants panels they will actually play: built, tuned and
locked, on a touchscreen, a laptop or beside controllers, starting with the looper board. The
boundary holds: zen ends at the UI layer, and the document and its history stay the app's.

## Goals / Non-Goals

**Goals:** a layout tree with shares, resizing, docking, lock, per-pane settings, forms picked by
room, edit mode by touch, mouse and keyboard, version 1 still drawn, the looper board built
through intents.

**Non-goals:** custom control panels, parameter catalogues and MIDI learn (`live-control-panels`);
free pixel placement (a panel is still regions, so it re-themes and fits other windows); changing
mix (its follow-up adopts version 2); saving.

## Decisions

### D1. Document version 2: a split tree with shares

```ts
type LayoutNode = string | SplitNode;               // a leaf is a region instance id
interface SplitNode { id: string; split: 'row' | 'column'; children: readonly { node: LayoutNode; share: number }[] }
interface SurfaceTabV2 { id: string; title: string; layout: LayoutNode | null; regions: readonly SurfaceRegion[]; locked?: boolean }
interface SurfaceRegion { id; kind; title; binding; settings?: Readonly<Record<string, SettingValue>> }
interface SurfaceDocumentV2 { version: 2; active: string; tabs: readonly SurfaceTabV2[] }
type SurfaceDocument = SurfaceDocumentV1 | SurfaceDocumentV2;
```

Splits carry ids so a resize names the split it changes. Shares are relative (any positive numbers;
the applier keeps them summing to the child count). A tiling tree, as VS Code, Bitwig and i3 use,
expresses everything rows did plus columns and sizes, and stays a value you can diff. `readDocument(doc)`
gives a v1 document's v2 reading: a root column of row splits (a one-region row is the leaf itself),
equal shares, deterministic split ids (`<tab>-row-<n>`). The applier writes v2 whenever it changes
a v1 layout. Every other intent leaves the version as it was, so mix's documents stay v1 until mix
resizes or docks.

*Rejected:* a grid with spans (Lemur pages, CSS grid areas). Dragging and docking on a grid needs
collision rules; a tree needs none.

### D2. Intents

New: `resizeSplit { tab, split, shares }`, `dockRegion { tab, region, target, zone }` with
`zone ∈ left | right | above | below | swap`, `configureRegion { tab, region, settings }`, `lockTab { tab, locked }`.
Changed: `addRegion { tab, kind, beside?, zone? }`. With no `beside`, it appends to the end of the
root, which matches mix's `addRegion(tab, kind)`. `row`/`index` are gone; they were a day old and
only zen used them. `moveRegion` steps within the nearest split of its axis (left/right in a row,
up/down in a column), and does nothing at an edge.

Docking: take the leaf out (a split left with one child collapses into its parent; a child split of
the same direction merges in), then at the target either insert a sibling, if the target's parent
split runs the zone's way, or wrap the target in a new split of the two. The new pane takes half the
target's share. `swap` exchanges the two leaves.

### D3. Drawing: a split view with measured rooms

The Workspace draws a tab with a new `Splits` model (each split a CSS grid whose tracks are `fr`
from the shares), not `Screen`. Each leaf measures its room with the existing `room` store and picks
the largest form whose `min` fits (`formForRoom(forms, room, principles)`, resolving `Length` with
the assembly's `resolveLength`). It then hands that form to the pane through `FormScope`, as
`Screen` does, so panes keep `useForm`. A handle is drawn between siblings in edit mode only.
`Screen` stays for everything else in zen.

### D4. Gestures as stores, previews as visual state

- `bindSplitHandle` (pointer and arrow keys): during a drag it writes the previewed shares into
  the surface's visual state (`SurfaceUi.resizing`), clamped to the neighbours' smallest forms.
  On release it calls the handler that sends `resizeSplit`. An arrow press sends one intent per
  step (5% of the pair).
- `bindDockDrag` on a region's tag: past a 6 px threshold it tracks the pointer over
  `[data-region]` rects, picks the zone (the outer 25% of an edge, else swap) into
  `SurfaceUi.docking`, draws the drop zone, and on release sends `dockRegion`, or nothing outside
  every region. Pointer capture makes it work for touch and mouse alike.

Both are framework-free stores registered in `view/stores.ts`, so both renderers draw the same.

### D5. Lock

`tab.locked` is document data, so it travels with the panel. A locked tab shows only an Unlock
button in the head: no Edit, no frames, no handles, no tags. On a pointer the Unlock is a hold
(the Button's `onLongPress`, 600 ms); from the keyboard Enter unlocks, which is deliberate already.
Lock and unlock send `lockTab`. Locking also leaves edit mode.

### D6. Settings

```ts
type SettingSpec = { key: string; label: string } & (
  | { type: 'choice'; options: readonly { value: string; label: string }[]; default: string }
  | { type: 'choices'; options: readonly { value: string; label: string }[]; default: readonly string[] }
  | { type: 'toggle'; default: boolean }
  | { type: 'number'; min: number; max: number; step?: number; default: number }
  | { type: 'targets'; of: string; default: 'all' | readonly string[] }
);
```

`PaneDefinition.settings?: SettingSpec[]`. `resolveSettings(definition, region, targets)` fills
defaults. The app's `pane` gets the resolved settings as a third argument:
`pane(region, target, settings)` (a slot takes up to three args). The sheet is the registered
`Sheet` with one field per spec (`Segmented` or `Select` for a choice, `Checkbox`es for choices
and targets, `Checkbox` for a toggle, `NumberField` for a number). Each change sends
`configureRegion` with the whole next settings object.

The live panes declare: `mix` and `loop` the tracks shown (`targets` of `track`), `cuts` the pads
offered (`choices`), `dice` the moves offered (`choices`). The live views read them.

### D7. The looper board

`LOOPER_DOCUMENT` in `Music/live/views/views.ts` is built in code by applying intents to an empty
tab (add, dock, resize, configure, lock), so the reference panel itself shows the builder's intents
are enough. Its story (`Music/Live/Views → Looper`) opens locked at 1280 × 800.

## Risks / Trade-offs

- **Two layout engines.** `Screen`'s solver ranks and steps regions; the split view gives each
  region its share and only steps its form. That split is deliberate: a panel built by hand
  shouldn't rearrange itself. A pane that doesn't fit even its smallest form clips, and edit mode
  marks it (`data-cramped`), rather than reflowing.
- **Drag on touch inside panes.** A region's tag is the only drag source, and only in edit mode,
  so pane gestures (faders, XY pads) never compete with docking.
- **Mix lags on v1.** Mix draws v2 only after its follow-up. Until then, an app that applies a
  layout intent to a v1 document gets v2 back, and must be able to store it.

## Open Questions

- Should a locked tab still allow switching tabs? This change: yes, since tabs are how you move
  through a set.
