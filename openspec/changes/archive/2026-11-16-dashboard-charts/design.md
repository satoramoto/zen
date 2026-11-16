# Design

## Context

- Every core part is a model that returns a view tree, plus React, Svelte and DOM bindings.
  Behaviour lives in framework-free stores (`foundation/view/stores.ts`, `coreStores.ts`); the
  three renderers apply them through `mountNode`. The Hotwire build (`lib/hotwire/zen.js`) bundles
  the DOM renderer, the core parts and `coreStores`, and its only import is `@hotwired/stimulus`
  (`check:lib`).
- Market draws two charts by hand in SVG:
  - `chart_controller.js`: one series over time, with a crosshair tooltip.
  - `lines_controller.js`: several series rebased to percent change, with end labels and a
    readout of every line at one moment.
- Market's dashboard pieces are in its helpers and CSS:
  - `ratio_track`: log2 of a ratio over a range, clamped, with the mark in the middle and a fill
    from the mark to a dot.
  - `share_track`: a 0..1 dot.
  - The rest: `.strip`, `.panel`, `.bars` and `.mini` tables.
- Lightweight Charts 5.3.0 (Apache-2.0) draws on canvas. It needs a real browser, and jsdom has
  no canvas. Its `dist/lightweight-charts.standalone.production.mjs` (198 kB, about 60 kB
  gzipped) is one ES module with no imports. Its `autoSize` option follows the container's size.

## Goals / Non-Goals

**Goals:** charts and dashboard parts that wear the pack, work in all three renderers and in
Hotwire, and cost nothing on a page that doesn't use them.

**Non-Goals:**
- Candlesticks and OHLC data (Market has none yet).
- Zooming and panning beyond Lightweight Charts' defaults.
- Market's own tables.
- Moving Market's views onto the new parts. That is Market's sessions' work.

## Decisions

### 1. TimeChart's tree is text; the plot is a store

`chart/components/TimeChart/TimeChart.model.ts` returns a root `.lib-chart`. It holds:
- a `plot` element bound to the `timeChart` store;
- a `readout` (a `role="status"` line with the hovered moment and each series' value);
- a visually hidden `summary` list (each series' name, last value and change);
- an `empty` message when no series has two points (then there is no plot).

The hovered time is view state, set by the store through the `hover` handler. The readout,
summary and every number in them are computed by pure model functions (`chart/model/series.ts`:
`rebase`, `valueAt`, `lastChange`, `formatValue`, `formatTime`), so the text is the same in every
renderer and in a test.

*Alternative:* let Lightweight Charts draw its own tooltip. That would be canvas only: no text, no
accessibility and no parity.

### 2. The store owns Lightweight Charts

`chart/components/TimeChart/timeChart.ts` exports `bindTimeChart(node, params)`.
- `params` holds the series (`{ name, kind, points: [ms, value][], base? }`), `rebase`, `height`,
  the value format, and `onHover` (a handler key).
- It runs `import('lightweight-charts')` on mount, then `createChart(node, { autoSize: true, … })`
  and `chart.addSeries(LineSeries | AreaSeries | BaselineSeries | HistogramSeries, …)`.
- Times go in as seconds. It subscribes to the crosshair and calls `onHover(ms | null)`.
- `update(params)` replaces the series data and options. `destroy` calls `chart.remove()` and
  disconnects its observers.

**Colours** are read with `getComputedStyle(node)`:
- `--hue-1..5` for series 1–5;
- `--success` and `--danger` for a baseline's two sides;
- `--text-3` for scale text, `--border` for the grid, `--accent` for the crosshair;
- `--font-sans` for text.

A `MutationObserver` on the nearest `.lib-scope` (its `style`, `class` and `data-mode`) reapplies
them, so a pack or mode change restyles a drawn chart. The ground is transparent: the chart sits
on whatever surface holds it.

If the import or the canvas fails (jsdom, or a missing pin), the plot gets
`data-chart="unavailable"` and stays empty, and the text parts still work.

The store is registered in `coreStores.ts`, so the Hotwire build has it.

### 3. Lightweight Charts is loaded, not bundled

- In zen's library build, `lightweight-charts` is a dependency, external like React. An app's
  bundler resolves it.
- In the Hotwire build it is also external, and the import stays a bare `import('lightweight-charts')`.
  `script/zen-vendor` copies `node_modules/lightweight-charts/dist/lightweight-charts.standalone.production.mjs`
  to `vendor/javascript/lightweight-charts.js`, and the app pins `lightweight-charts`.
- A page with no chart never fetches it.
- `check:lib` allows `@hotwired/stimulus` and `lightweight-charts` only.
- The library's own attribution logo stays on (its default), as its licence asks.

*Alternative:* bundle it into `zen.js`. That makes every page 60 kB heavier.

### 4. The dashboard parts are plain trees

- **Track** (`components/Track/`) takes `value` and `mode`:
  - `ratio`: `range` in doublings (default 2), and `mark` (default 1).
  - `share`: a 0..1 value.
  - Also `tone` (`good`, `close`, `bad` or `none`, by default from the ratio: at or above the
    mark is good, within 10% below it is close, below that is bad) and `label`.
  - Positions are pure (`trackPosition`). It draws `role="img"` with the label and the value as
    text.
- **Sparkline** (`components/Sparkline/`): an SVG polyline on a 100×(height) box with
  `preserveAspectRatio="none"` and `vector-effect: non-scaling-stroke`, an optional end dot, and a
  direction tone (`up` or `down` against the first value). It has `role="img"` and a label.
- **BarList** (`components/BarList/`): a `ul` of items, each `{ name, value, display?, note?,
  href? }`. Widths are a percentage of the largest value, at least 0.5%. Names with an `href` are
  links.
- **FigureStrip** (`components/FigureStrip/`): a `dl` of `{ label, value, note? }`, with `lead`
  marking the first.
- **Panel** (`layouts/Panel/`): a `section` with a heading at `level` (default 2), a `title`, an
  `aside` (text or a slot), and a `children` slot, or an `empty` message when it has no children.

Tones map to `--success`, `--warning`, `--danger` and `--text-3`. No part names a market thing.

### 5. One part, three renderers, one story file

Each part has:
- `.model.ts`, `.tsx`, `.svelte`, `.dom.ts`, `.fixtures.ts`, `.stories.tsx` and `.css`;
- one line in each registry: `reactComponents`, `svelteComponents`, `domComponents` and
  `domFixtures`;
- a tree snapshot.

TimeChart's stories that check drawing are tagged `browser`. Its text stories play on the virtual
DOM.

### 6. A static form for the dashboard parts

Market draws hundreds of rows, each with a dot and a track, and swaps them several times a second
while its slider moves. Drawing those as placeholders would mean hundreds of parts torn down and
redrawn on every tick.

So Track, Sparkline, BarList, FigureStrip and Panel also get a static form: markup the server
writes and zen.css styles, with no controller.

- `src/rails/zen_static.rb` holds Ruby helpers that write each part's DOM: `zen_track`,
  `zen_sparkline`, `zen_bar_list`, `zen_figure_strip` and `zen_panel`. Panel takes a block for its
  body.
- `scripts/static-goldens.ts` writes `src/rails/goldens.json`: every fixture's props and the HTML
  the model draws, serialized as parity does.
- `src/rails/static_test.rb` renders each fixture with the helpers and compares it with the golden
  after the same normalisation. CI runs it (Ruby is on GitHub's runners).
- A vitest check fails when the goldens are stale.

The Ruby repeats each model's geometry; the goldens are what hold the two together.

### 7. Rulings from the builder pass

- **The store diffs.** `update` calls `setData` only when the series, the rebase setting, the span,
  the lines or the markers change, compared as one JSON key. Hover changes only the tree's text.
- **Exports.** `chart/index.ts` is re-exported from the package root and from `svelte.ts`, like
  `graph/`. `lightweight-charts` is external in `vite.lib.config.ts` and `vite.hotwire.config.ts`.
- **"Core" now includes TimeChart.** `domComponents.ts` and `coreStores.ts` say "the core parts and
  the chart", in a shared-file commit.
- **Colours resolve in the scope.** Each variable is read from a probe inside the plot, then
  normalised through a canvas `fillStyle` to `#rrggbb` or `rgba()`, so `oklch` and `color-mix`
  values parse. The store writes what it used to `data-series-colours` on the plot, which the
  browser plays compare with the computed `--hue-n`.
- **No canvas, no import.** When `canvas.getContext('2d')` is null (jsdom), the store marks the
  plot unavailable without importing. A `destroyed` flag drops work that finishes after teardown.
- **Track's `range`** is the largest ratio shown: a quarter to four times the mark by default.
  `close` is from 0.9 of the mark up to the mark.
- **Accessibility.** Track and Sparkline are `role="img"` with an `aria-label` that holds the
  value. The readout is not a live region; the summary is what assistive technology reads.
- **Height.** `height` is passed as the fallback size for when `ResizeObserver` is missing.
- **Coverage.** `chart` joins `COMPONENT_SOURCES` in `library.test.tsx`, and the tier and
  bindings-only scans, in a shared-file commit.

## Risks / Trade-offs

- **jsdom has no canvas**, so plot drawing is checked only in the browser. → The text parts
  (readout, summary, empty message) carry the behaviour and play everywhere. The browser stories
  check that a canvas is drawn and coloured.
- **Lightweight Charts can only be themed with literal colours**, not CSS variables. → The store
  resolves the variables to computed values and reapplies them on a theme change.
- **A missing pin in a Rails app** leaves the chart empty. → The plot is marked
  `data-chart="unavailable"`, a console warning names the pin, and `docs/rails.md` lists it.
