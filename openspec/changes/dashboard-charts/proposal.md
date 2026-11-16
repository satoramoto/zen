# Proposal

## Why

Ryan wants TradingView-grade charts in Market, and the pieces Market built for its dashboard
(tracks, strips of figures, panels, ranked bars) as zen parts, so Market draws them with zen
rather than its own CSS and every zen app gets them. Market's Design session suggested wrapping
Lightweight Charts (TradingView's own open-source chart library, Apache-2.0) and promoting those
pieces.

My reading: Market's two hand-drawn SVG charts (a coin's yield over time with a crosshair, and the
home page's several coins rebased to percent change) are where the chart starts, and the
dashboard pieces are generic enough to belong in zen's core. Each part has to work in all three
renderers and in the Hotwire build, as every core part now does.

## What Changes

- **A new area, `chart`**, with one part, **TimeChart**, built on Lightweight Charts 5.3:
  - series of kind line, area, baseline (above a value in success, below in danger) and
    histogram, several on one time axis;
  - an option to rebase every series to its percent change from its first point;
  - a crosshair whose readout lists each series' value at that moment, as text;
  - an accessible summary giving each series' last value and its change;
  - colours read from the pack (series 1–5 take hue-1..5), following light and dark live;
  - resizing with its box;
  - a short message instead of an empty canvas when there are too few points.
- **Five dashboard parts in core components**, each with a model, React, Svelte and DOM
  bindings, fixtures, stories and a tree snapshot:
  - **Track**: a value on a rail. Either a ratio on a log scale around a mark, with a fill from
    the mark to a dot and a good, close or bad tone, or a share from 0 to 1.
  - **Sparkline**: a small inline line drawn from values, with a tone set by direction.
  - **BarList**: ranked bars, each with a name, a rail sized against the largest, a value and a
    note.
  - **FigureStrip**: a strip of figures, each with a label, a value and a small note; the first
    can lead.
  - **Panel**: a titled card with a heading, a small aside and a body, plus a message when it is
    empty.
- **The Hotwire build** draws all six. Lightweight Charts is not bundled into `zen.js`: it is
  loaded the first time a chart mounts, as `lightweight-charts`, which an app pins from a file
  `script/zen-vendor` copies in. Pages without a chart never load it.
- **Market (`ryangavin/xmrz`)**: the vendored build is updated. Its views move onto these parts
  in Market's own sessions, as agreed with Market's Design session.

## Anti-goals

- A chart that looks like a stock library dropped into the page: it has to wear the pack.
- Heavier pages that have no chart.
- Parts that carry Market's meaning ("headroom", "coin") rather than a generic one.

## Capabilities

### New Capabilities

- `chart-time-chart`: a time-series chart part, its series kinds, rebasing, crosshair readout,
  accessible summary, theming, sizing and lazy loading.
- `library-dashboard-parts`: Track, Sparkline, BarList, FigureStrip and Panel.

### Modified Capabilities

None.

## Impact

- zen:
  - `src/library/chart/`, a new area declared in `structure.ts`;
  - `src/library/components/{Track,Sparkline,BarList,FigureStrip}/` and
    `src/library/layouts/Panel/`;
  - the registries (React, Svelte, DOM, stores, fixtures, snapshots);
  - `package.json`, with `lightweight-charts` 5.3.0 as a dependency;
  - `vite.hotwire.config.ts` and `check:lib`, which allow the `lightweight-charts` import;
  - `docs/rails.md`.
- xmrz: `script/zen-vendor` also copies Lightweight Charts and pins it; the vendored files are
  re-vendored.

## Validation

**Before merging:**
- `npm test`;
- `npm run typecheck`;
- `node src/harness/stories/cli.mjs Core Chart`, the chart stories tagged `browser`, and again
  with `--renderer dom`;
- `npm run build:lib && npm run check:lib`;
- `npm run build:storybook`;
- `openspec validate dashboard-charts --strict`;
- `story-spec sync --change dashboard-charts --check` over this change's stories;
- the `checks` job on the pull request.

After vendoring into Market, the headless shell draws a TimeChart and a Track on a Market page
with no console errors.

**Review:** `look`.
