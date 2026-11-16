# Proposal

## Why

The person wants zen's component library usable in a standard Rails 8 app without React, with
pages built from ordinary server-rendered HTML that Turbo loads into frames, and without the cost
of server-side rendering of the components. The first app is the Market dashboard in
`ryangavin/xmrz` (`first-mover/market`: Rails 8.1, importmap, Propshaft, Turbo and Stimulus, no
Node).

My reading: zen already keeps every component's markup and behaviour framework-free (the view
tree and the stores), so a third renderer that writes the DOM directly is most of the work, and
Stimulus's connect/disconnect lifecycle is the natural place to mount it. Why now: Market is
outgrowing its hand-written controls and stylesheet, and is the first app in the family that is
not a JavaScript app.

## What Changes

- **A DOM renderer for the view tree** (`@satoramoto/zen/view/dom`): draws a model's tree into an
  element with no framework, attaching `on` handlers and `bind` stores through the existing
  `mountNode`, patching the DOM on update and tearing it down on destroy. It is held to the same
  DOM as the React and Svelte renderers.
- **A DOM binding for each converted control** in `components/` and the primitives and layouts
  they draw (Text, Icon, Stack, Surface, Hole, Opaque, Group, Layer, Tabs). A binding does the
  little that each React and Svelte binding does besides drawing: view state, an id, contexts,
  the theme scope and root props. Each one is registered by name in `domComponents.ts`, as the
  other two renderers register theirs. Not in this change: music, Yahaha, the assembled and
  workspace layouts, and the React-only parts (the theme editor, picker and settings).
- **A Hotwire entry** (`@satoramoto/zen/hotwire`): a Stimulus controller that draws a named part
  from `data-` attributes, plus a theme controller that scopes a page or element to a pack. It:
  - mounts when Turbo inserts it (a page visit, a frame, a stream) and destroys when removed;
  - updates in place when its props attribute changes, and keeps its drawn DOM through a Turbo
    morph;
  - leaves no stale drawing in Turbo's page cache;
  - turns callbacks into bubbling DOM events (`zen:change` with the arguments in `detail`);
  - takes slot fills from server HTML (`<template data-zen-slot="icon">`);
  - for a part with a value, writes a named hidden input and fires a native bubbling `change`, so
    `form_with`, existing Stimulus actions and Turbo form submissions work as with a native field.
- **A self-contained build for importmap**: one ES module with no bare imports besides
  `@hotwired/stimulus` (which the app already pins), `zen.css`, and the packs as static CSS, so a
  Rails app vendors three files and runs no Node.
- **A Rails snippet**, documented in `docs/rails.md`: a `zen` view helper (`<%= zen :select,
  name: "basis", options: …, value: … %>`) and how to vendor and pin the build. Not a gem yet.
- **The story runner plays a chosen renderer** (`--renderer dom`), so the existing Core plays
  prove the DOM renderer's behaviour.
- **In Market (xmrz)**:
  - the build is vendored and the layout is scoped to a pack;
  - the selects in the Board, Hardware and Heatmap filters are drawn with zen's `Select`, and
    the existing `calc` and `autosubmit` controllers stay unchanged;
  - the coin page gains a watch control, a zen `Button`, loaded through a lazy Turbo frame and
    updated by the existing Turbo stream.

## Anti-goals

- Market ends up with two styles side by side that clash, or a slower board than today.
- A Rails app has to install Node, run a bundler or keep a Node server to use zen.
- The DOM renderer becomes a third place a component's behaviour is written: if a part needs logic
  in its DOM binding that its React and Svelte bindings do not have, the logic belongs in its model
  or a store.

## Capabilities

### New Capabilities

- `library-dom-renderer`: the view tree drawn straight into the DOM, with every converted core
  part available by name and drawing the same DOM as the React and Svelte renderers.
- `library-hotwire`: zen's parts in a server-rendered Hotwire app: the Stimulus controllers, their
  Turbo lifecycle (frames, streams, morph, cache), events, slots from server HTML, form fields,
  theme scoping, and the importmap build.

### Modified Capabilities

None.

## Impact

- zen: `src/library/foundation/view/` (the DOM `Tree`, `domComponents.ts`, a framework-free
  context registry, the core stores split out), a `<Name>.dom.ts` beside each part in scope, a new
  root entry `src/library/hotwire.ts` (declared in `structure.ts`), the story runner's
  `--renderer`, a story of the Hotwire lifecycle, `vite.lib.config.ts` and `package.json` exports, `docs/rails.md`,
  `AGENTS.md` (the new entry and checks), `view.baseline.json` and the bindings-only rule (a
  `.dom.ts` is a binding too). New devDependencies: `@hotwired/stimulus`, `@hotwired/turbo`
  (stories only).
- xmrz (`first-mover/market`): `vendor/javascript/`, `config/importmap.rb`,
  `app/assets/stylesheets/`, `script/zen-vendor`, the `zen` and `zen_select` helpers, the layout,
  the three filter partials, `coins/show` with a new `get :watch` route and a `watch` action.

## Validation

**Before merging:**

- zen: `npm run typecheck`; `npx vitest run src/library/foundation/view`;
  `npx vitest run src/library/parity.test.tsx` (now three renderers);
  `npx vitest run src/library/structure.test.ts src/library/tiers.test.ts`;
  `npm run build:lib && npm run check:lib` (the hotwire bundle imports nothing but
  `@hotwired/stimulus`); `npm run build:storybook`; `node src/harness/stories/cli.mjs Core` (the
  Hotwire lifecycle plays are tagged `browser`) and `node src/harness/stories/cli.mjs Core
  --renderer dom`; `openspec validate rails-dom-renderer --strict`;
  `story-spec sync --change rails-dom-renderer --check`. The `checks` job on the pull request.
- xmrz: `bin/rails test` in `first-mover/market`, with integration tests that the filter pages
  render the zen placeholders and still filter by query; then the pages loaded in Playwright's
  headless shell against a running server, choosing a filter on each page, with the result
  reported.

**While building:** after the renderer group, run the parity test over the parts converted so
far before writing more DOM bindings.

**Review:** `look`. After merging, look at Market's Board and Hardware filters in the pack, and
at the Hotwire story's frame, stream and morph plays.
