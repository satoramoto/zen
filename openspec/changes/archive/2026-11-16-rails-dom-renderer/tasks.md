# Tasks

## 1. Shared files first (zen, each its own small commit)

- [x] 1.1 Declare `hotwire.ts` in `structure.ts` `ROOT_FILES` and verify `npx vitest run src/library/structure.test.ts` passes
- [x] 1.2 Split the core stores out of `stores.ts` into their own module that the full registry spreads, and add the framework-free context registry (`foundation/view/contexts.ts`: `control`, `opaque`, `surface`, `form` with their defaults); verify `npx vitest run src/library/foundation/view` and `npm run typecheck` pass unchanged
- [x] 1.3 Add `@hotwired/stimulus` and `@hotwired/turbo` (the version turbo-rails 2.0.23 vendors) as devDependencies and verify `npm ci` is clean

## 2. The DOM renderer

- [x] 2.1 Write `foundation/view/Tree.dom.ts` (`mountTree` with elements, text, holes, keyed matching by `childKey`, SVG namespace, root props, slot fills, `Context` nodes, component nodes) and `foundation/view/dom.ts` (`domPart` and `use`: `state`, `id`, `context`, `provide`, `scope`); verify `npm run typecheck`
- [x] 2.2 Add the DOM renderer to `Tree.parity.test.tsx`, add a keyed reorder and a slot that comes and goes to its every-feature tree if missing, and verify it passes for all three renderers
- [x] 2.3 Teach the bindings-only rule that a `.dom.ts` is a binding (only `domPart`, `use`, models and handlers; no `document.*`, `innerHTML` or element creation), at zero in `view.baseline.json`; verify `npx vitest run src/library/foundation/view` passes and fails on a planted `document.createElement` in a `.dom.ts`
- [x] 2.4 Teach `parity.ts` a third renderer (`renderDom`) and `GENERATED_ID` the `«z\d+»` form, comparing three renderers only for the parts `domComponents.ts` lists; verify `npx vitest run src/library/parity.test.tsx` passes with the list empty
- [x] 2.5 Add the `dom` value to the Renderer toolbar (`withRenderer`) and `--renderer <react|svelte|dom>` to `src/harness/stories/cli.mjs`, documented in `docs/harness-stories.md`; verify `node src/harness/stories/cli.mjs Core/Components/Button --renderer svelte` plays

## 3. DOM bindings for the parts in scope

- [x] 3.1 Primitives: `Text`, `Icon`, `Stack`, `Surface`, `Hole`, `Opaque` get a `.dom.ts` and a `domComponents.ts` line; verify the parity test passes three-way for each
- [x] 3.2 Layouts: `Group`, `Layer`, `Tabs`; verify three-way parity
- [x] 3.3 Simple controls: Button, ActionButton, LampButton, Separator, StatusDot, CodeImage, SettingsRow, Readout, StepValue; verify three-way parity
- [x] 3.4 Stateful controls: Select, Segmented, Checkbox, Radio, Toggle, Switch, Disclosure, LineSlider, Slider, NumberField, SearchField, Popover, Modal, Sheet; verify three-way parity
- [x] 3.5 Remaining converted controls: FolderList, Gate, NamePicker, PageList, VoteControl; verify three-way parity
- [x] 3.6 Verify `node src/harness/stories/cli.mjs Core --renderer dom` plays every Core story; fix in the renderer or a binding any play that fails only under `dom`
- [x] 3.7 Add the `--renderer dom` Core run to `.github/workflows/checks.yml` and the checks table in `AGENTS.md`

## 4. The Hotwire entry

- [x] 4.1 Write `src/library/hotwire.ts` (`ZenController`, `ZenThemeController`, `registerZen`) per design decision 4: mount, props update, events, value echo with the hidden field, `<template>` slots, morph, cache, theme scope publishing `use.scope()`; add the placeholder's `min-block-size`; verify `npm run typecheck`
- [x] 4.2 Write `screens/Hotwire/` (`Core/Screens/Hotwire`, tagged `browser`) with one `scenario()` play per `library-hotwire` scenario, against real Turbo and Stimulus with stubbed responses; verify `node src/harness/stories/cli.mjs Core/Screens/Hotwire` passes
- [x] 4.3 Add `scenario()` plays for the `library-dom-renderer` scenarios that the Core plays don't already cover (unknown name error, focus survives update, popover cleaned up on destroy) under the parts they concern; verify they pass with `--renderer dom`
- [x] 4.4 Run `story-spec sync --change rails-dom-renderer` and verify the deltas match the stories

## 5. The importmap build

- [x] 5.1 Write `vite.hotwire.config.ts` (one module, no splitting, Stimulus external, no `emptyOutDir`, shared `joinStyles`, one theme stylesheet per pack) and chain it in `build:lib`; add `./hotwire`, `./hotwire/zen.css` and `./hotwire/themes/*` to `package.json` exports; verify `npm run build:lib` writes `lib/hotwire/zen.js`, `zen.css` and `themes/*.css`
- [x] 5.2 Add the rule to `scripts/check-lib-entries.ts` that `lib/hotwire/zen.js` imports nothing but `@hotwired/stimulus` and nothing of React or Svelte; verify `npm run check:lib` passes, and fails with a planted React import
- [x] 5.3 Write `docs/rails.md` (vendoring, pins, the `zen` helper snippet, labels, events, form fields, morph and cache, the bundle's measured size) and the new entry's line in `AGENTS.md`; verify each snippet against task group 6 as it is done

## 6. Market (xmrz, `first-mover/market`, branch `change/rails-dom-renderer`)

- [x] 6.1 Add `script/zen-vendor`, vendor the zen branch's build with the chosen pack, pin `zen` in `config/importmap.rb` and call `registerZen` in `controllers/index.js`; verify `bin/importmap json` lists `zen` and the server boots
- [x] 6.2 Add the `zen` and `zen_select` helpers with helper tests (placeholder attributes, props JSON, `html:` merge, choices split into items, values and index); verify `bin/rails test test/helpers`
- [x] 6.3 Put `zen-theme` on `<body>` and move `application.css`'s colours, type and spacing onto contract variables; verify by eye in Playwright's headless shell on Board, Hardware, Heatmap and a coin page in light and dark
- [x] 6.4 Draw the selects in `board/_controls`, `hardware/_controls` and `shared/_filters` with `zen_select` (labels to divs, native selects kept in `<noscript>`); verify the integration tests in `test/integration` still pass and add ones that the filter pages render the placeholders and filter by query
- [x] 6.5 Add `get :watch`, the lazy watch frame on `coins/show`, the zen `Button` watch control and the `watch` action submitting its form, with the PATCH stream replacing it; verify an integration test for the GET and the stream response
- [x] 6.6 In the headless shell against a running server: choose a filter on Board, Hardware and Heatmap and see the results change; on a coin page see the frame load and the star toggle; go back and forth to check nothing is drawn twice; report what was seen

## 7. Merge

- [x] 7.1 zen: `npm run typecheck`, `npx vitest run src/library/foundation/view src/library/parity.test.tsx src/library/structure.test.ts src/library/tiers.test.ts`, `npm run build:lib && npm run check:lib`, `npm run build:storybook`, `node src/harness/stories/cli.mjs Core` and `... Core --renderer dom`, `openspec validate rails-dom-renderer --strict`, `story-spec sync --change rails-dom-renderer --check` pass; pull request from `change/rails-dom-renderer` set to auto-merge and merged, branch deleted
- [x] 7.2 xmrz: re-vendor from zen's merged `main`, `bin/rails test` passes; `git merge --no-ff change/rails-dom-renderer` into `main`, pushed, branch deleted

## Workflow follow-up

- Archive the change and tell the person what to look at (Review: `look`).
- Follow-up change, not this one: move each part's state, id and context into its model so one generic DOM binding replaces the per-part `.dom.ts` files.
