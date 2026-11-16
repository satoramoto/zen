# Tasks

## 1. Shared files first

- [x] 1.1 Declare the `chart` area in `structure.ts` (`AREAS`), and verify `npx vitest run src/library/structure.test.ts` passes.
- [x] 1.2 Add `lightweight-charts` 5.3.0 as a dependency, external in `vite.lib.config.ts`. Verify `npm ci` is clean.

## 2. The chart model

- [x] 2.1 Write `chart/model/series.ts` with unit tests: `rebase`, `windowed`, `valueAt`, `lastChange`, `formatValue` and `formatTime`. Verify the tests pass.

## 3. TimeChart

- [x] 3.1 Write `chart/components/TimeChart/timeChart.ts`, the store:
  - a lazy import, `createChart` with `autoSize`, and every series kind;
  - reference lines, markers and point marks;
  - colours read from the contract and reapplied on a scope change;
  - crosshair hover and the visible span;
  - `data-chart="unavailable"` when the import or the canvas fails.

  Register it in `coreStores.ts`, and verify `npm run typecheck` passes.
- [x] 3.2 Write TimeChart's model, React, Svelte and DOM bindings, fixtures and CSS:
  - the readout, the legend with links, the summary and the empty state;
  - spans, height and aria-label.

  Add its lines to the four registries, `domFixtures` and the snapshot. Verify `npx vitest run src/library/foundation/view` passes.
- [x] 3.3 Write TimeChart's scenario stories (`Chart/Components/TimeChart`); those that check the canvas are tagged `browser`. Verify `node src/harness/stories/cli.mjs Chart` passes, with and without `--renderer dom`.

## 4. Dashboard parts

- [x] 4.1 Track, Sparkline, BarList and FigureStrip in `components/`, and Panel in `layouts/`. Each has a model with unit tests for its geometry, the three bindings, fixtures, CSS, scenario stories, the registry lines and a snapshot. Verify `npx vitest run src/library` and `node src/harness/stories/cli.mjs Core --renderer dom --no-browser` pass.
- [x] 4.2 Their static form:
  - `src/rails/zen_static.rb`, Ruby helpers that write each part's markup;
  - `scripts/static-goldens.ts`, which writes every fixture's HTML to `src/rails/goldens.json`;
  - `src/rails/static_test.rb`, which holds the Ruby to the goldens;
  - a vitest check that the goldens are current.

  Verify `ruby src/rails/static_test.rb` passes, and add it to CI.

## 5. Hotwire and docs

- [x] 5.1 Keep `lightweight-charts` external in `vite.hotwire.config.ts`, and allow it in `check:lib`. Verify `npm run build:lib && npm run check:lib` passes.
- [x] 5.2 Update `docs/rails.md`: the chart pin, vendoring, the static helpers, and an example of each part. Verify against Market.

## 6. Market

- [ ] 6.1 Extend `script/zen-vendor` in xmrz to copy Lightweight Charts and `zen_static.rb`, and pin `lightweight-charts`. Re-vendor from zen main. Verify `bin/rails test` passes, and that the headless shell draws a TimeChart and a static Track on a Market page with no console errors.

## 7. Merge

- [ ] 7.1 zen: `npm test`, `npm run typecheck`, the story runs, `build:lib`/`check:lib`, `build:storybook`, `openspec validate --strict` and `story-spec sync --check` pass. The pull request merges.
- [ ] 7.2 xmrz: the re-vendor is merged locally and pushed. Tell Design.
