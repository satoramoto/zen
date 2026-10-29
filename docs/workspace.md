# The workspace: tabs of screens you can rearrange

A solo set needs different screens at different moments — launching loops, riding sends,
following a chord, throwing a delay — but one fixed arrangement serves none of them well. The
workspace is tabs of self-assembling screens (`Screen` + `assemble()`, docs/assembly.md) plus an
edit mode that rewrites a tab's spec. This is the Lemur idea, constrained: you lay out
**regions** (blocks), never pixels, so every tab still steps its forms down on a small window
and still reads in every theme pack.

## What a tab is

```ts
interface WorkspaceTab { id: string; title: string; spec: ScreenSpec }
interface WorkspaceSpec { tabs: readonly WorkspaceTab[]; start?: string }
```

A tab **is** a `ScreenSpec`: header, footer and rows of regions, each region declaring its own
`forms`. Perform mode is a `Tabs` strip plus `<Screen spec={tab.spec} regions={…} />`. The tab
strip is persistent: it never moves between tabs, so the set's tabs are one tap away mid-bar.

## The six edits

Every edit is a pure function (`Workspace.edit.ts`), `(spec, …) => ScreenSpec`. The component
calls `onSpec(tabId, next, why)`; the app saves the value. Nothing writes CSS, so the result
still assembles and still re-themes.

| Edit | Function | What it does |
|---|---|---|
| move | `moveRegion(spec, id, 'left' \| 'right')` | swaps the region with its neighbour in its row |
| moveRow | `moveRegionToRow(spec, id, 'up' \| 'down')` | lifts it into the neighbouring top-level row |
| split | `splitRegion(spec, id, region)` | its slot becomes a nest of two rows: itself, then the addition |
| remove | `removeRegion(spec, id)` | removes it; emptied rows and nests go with it, never the last region |
| add | `addRegion(spec, row, region, index?)` | inserts into a top-level row (past the end starts one) |
| bind | — | no spec change: `onBinding(tabId, regionId, { track })` for the app's store |

In the edit surface a region's frame offers all six directly: arrows for move and moveRow, `✕`
for remove, `+ kind` per palette kind for split, and a track switch for bind. The palette bar
under the tabs adds a kind to the tab's **last row**. A tab is therefore a value you can save,
diff and re-theme — the layout builder stores specs, not screenshots.

## What the app supplies

- `content`: what goes in each region, by region id (React nodes, or Svelte snippets), reaching
  the Screen as `content:<id>` slots. The frame wraps this content without the app knowing.
- `palette`: the kinds the surface can place (`WorkspaceRegion`: a kind, a label and the
  widget's own `forms`). Without a palette the edit mode rearranges but adds nothing.
- `tracks`: the `{ id, label }` list a region binds to. Without it there is nothing to bind.
- `bindings`: what each region is bound to (`{ track }`), by region id. Meaning is the app's.

## What the workspace does not do

- No sizes, ever. A region's forms are its widget's own; the solver picks one per placement.
- No per-use colour. Frames are plates, tags are captions, tools are plain buttons.
- No state. The open tab, the specs and the bindings stay the app's; the workspace only asks.
