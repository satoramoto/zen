# Design

## Context

- Every converted part is a model (`<Name>.model.ts`) that returns a view tree, plus two thin
  bindings (`<Name>.tsx`, `<Name>.svelte`), each one `<Tree …/>`. Behaviour is in stores
  (`foundation/view/stores.ts`) applied by the framework-free `mountNode`
  (`foundation/view/mount.ts`), which both renderers already call. Composites draw other parts by
  name through `reactComponents.ts` / `svelteComponents.ts`. A composite receives its slot fills
  as named props (`props.icon`, `props.children`; `componentProps` plus the fills in `Tree.tsx` /
  `Tree.svelte`).
- The bindings are thin but not uniform. Besides drawing, they do the following:
  - keep view state (`viewState`: Select's open and highlighted row);
  - make an id (`useId`, `$props.id()`);
  - read a context through the registered `Context` component (`control`, `opaque`, `surface`,
    `form`);
  - set a context for their children (Popover sets `CONTROL_FIELD`);
  - read the theme scope (Surface, for a pack's shader);
  - forward a `ref` and extra props onto their root (Stack, Surface, Text, Layer; Layer forwards
    `onX` handlers);
  - run a timer (Ambient), or read the scope's principles and the form store (AssembledScreen,
    Workspace).
- `stores.ts` imports music's and Yahaha's stores too, and `Context.tsx` imports React.
- `build:lib` is `vite build -c vite.lib.config.ts && tsc …`, with `emptyOutDir: true`,
  `cssCodeSplit` and `joinStyles`. Output is shared chunks, which an import map would have to pin
  one by one.
- The story runner (`src/harness/stories/cli.mjs`) plays each story once, in the default
  renderer (React). No run plays the Svelte renderer today.
- `scopeView(facets, mode)` returns `lib-scope`, `data-mode`, `data-bleed` and the variables.
  `resolveTheme({ theme })` returns `{ pack, facets }`. There is no pack named `zen`; the default is
  `packs[0]`, `yahaha-elektron`.
- Market (`ryangavin/xmrz`, `first-mover/market`) runs Rails 8.1 with importmap and Propshaft,
  turbo-rails 2.0.23 and stimulus-rails 1.3.4. It has no `package.json`. The Board and Hardware
  filters are native `<select>`s and number fields inside `<label>`s in `form_with`, listened to by
  `change->calc#choose` (`board/_controls`, `hardware/_controls`). The Heatmap page uses
  `shared/_filters` with `change->autosubmit#submit`. It does not morph. Its one stream replaces a
  board row's watch star, a `button_to` PATCH. `stylesheet_link_tag :app` loads every stylesheet
  under `app/assets/stylesheets/`.

## Goals / Non-Goals

**Goals:**
- A part's DOM binding is as small as its React and Svelte ones, and the three are checked
  against each other.
- A Rails app gets zen by copying files and adding pins: no Node, bundler or gem at run time.

**Non-Goals:**
- Rendering on the server, in Ruby or Node.
- Custom elements or shadow DOM.
- Parts outside the set in decision 2. Music, Yahaha, graph, the React-only parts, and the
  assembled and workspace layouts (`AssembledScreen`, `Workspace`, `Screen`, `Region`,
  `FormScope`) and `Ambient` are not in this change. Asking the registry for one of them fails
  with an error naming it.
- A Ruby gem. The helper is a documented snippet that the app copies.

## Decisions

### 1. The DOM `Tree` is a small keyed patcher over `mountNode`

`foundation/view/Tree.dom.ts` exports:

```
mountTree(parent, before, tree, context) → { update(tree, context), destroy(), first() }
```

It draws `tree` into `parent` before the `before` node, so it works for roots, children and
fragments alike. `context` holds `slots`, `handlers`, `stores`, `components`, the contexts in
force, the theme scope and `svg`. An optional `root: { attrs, on, ref }` lands on the root
element after the tree's own attributes, as `...native` does in `Tree.svelte`.

- An element node creates the element (in the SVG namespace inside `svg`). It sets attributes
  with `domAttrs` and calls `mountNode` for `on`, `bind` and the form properties.
- Text becomes a text node.
- A component node draws through the DOM registry.
- On update, children are matched with `childKey`, the same rule the other renderers use. A
  matched element has changed attributes set or removed and gets `mounted.update`. A changed tag
  or kind is replaced. Holes (`null`) keep their siblings' positions.

**Slots.** A fill is `(parent, before, args) → { update(args), destroy() }`. A composite receives
its fills as named props, as in the other renderers. For a subtree fill, the parent tree mounts
the subtree with its own handlers and contexts and patches it on the parent's update. A
pass-through fill is the parent's own fill, handed on. Slot arguments are passed to `update`.

**Contexts.** `foundation/view/contexts.ts` is a framework-free registry of names with default
values: `control`, `opaque`, `surface`, `form`. A `Context` node puts its value into the context
for its subtree. The DOM side needs no React and no Svelte for this. `Context.tsx` and
`Context.svelte` keep their own mappings to the same names.

**Stores.** The DOM build draws from a `coreStores` set: `stores.ts` is split so that the core
stores sit in their own module, which the full registry spreads. The Hotwire bundle then carries
no music or Yahaha store. Asking for one it lacks fails with the existing "no store named" error.

*Alternatives:*
- A virtual-DOM library (snabbdom, preact's): a dependency, and its attribute rules would diverge
  from `domAttrs`.
- `innerHTML`: loses focus and store state on every update.
- The Svelte renderer compiled to custom elements: it ships Svelte's runtime, and shadow DOM cuts
  the parts off from the theme's variables and zen.css.

### 2. A part's DOM binding is a definition, made with `domPart`

Each part in scope gets a `<Name>.dom.ts` beside its `.tsx`/`.svelte`:

```ts
export const SelectDom = domPart<SelectProps>({ events: ['onChange'], value: { prop: 'index', on: 'onChange' } }, (props, use) => {
  const view = use.state(SELECT_CLOSED);
  const { quiet } = use.context('control');
  return { tree: selectView(props, { ...view.get(), quiet, id: use.id() }), handlers: selectHandlers(props, view.set) };
});
```

`use` offers what the bindings in scope do, and nothing more:
- `state(initial)`: a `viewState` whose `set` schedules one redraw in a microtask.
- `id()`: stable per mount, of the form `«z1»`.
- `context(name)`: read a context.
- `provide(name, value)`: set a context, applied to the subtree it returns.
- `scope()`: the theme scope in force: pack, facets, mode and principles, published by
  `zen-theme`, or else the default pack.

The binding returns `{ tree, handlers, slots?, root? }`. Root props (Stack's and Layer's `ref`,
extra attributes, Layer's `onX`) go through `root`.

`domComponents.ts` registers one line per part. The parts in scope are every converted part
under `components/`, and these primitives and layouts: `Text`, `Icon`, `Stack`, `Surface`,
`Hole`, `Opaque`, `Group`, `Layer`, `Tabs`. A part in scope that draws one outside the set is a
failing parity line. The fix is to bring the drawn part into scope, never to drop the parity
line.

A `.dom.ts` is a binding, and the bindings-only rule scans it. It may call `domPart`, `use`,
models and handlers. It may not call `document.*` or `innerHTML` and may not draw elements. The
rule gets that pattern, and `view.baseline.json` gives these files zero.

*Alternative:* move state, id and context into each model so that one generic DOM binding fits
every part. That would be cleaner, but it reshapes every model and both of its bindings. It is a
follow-up, not part of this change.

### 3. Parity and plays cover the DOM renderer

- `parity.ts` gets `renderDom(name, props)`, which mounts into a detached div in jsdom.
  `parity()` compares React, Svelte and DOM for each fixture of each part in scope. Parts outside
  the scope keep comparing two renderers, and the scope is listed in `domComponents.ts`.
  `GENERATED_ID` learns `«z\d+»`.
- `Tree.parity.test.tsx`, the tree that uses every feature, gets the DOM renderer. It also gains
  a reordering keyed list and a slot that switches between a fill and nothing, if it lacks them.
- The Storybook **Renderer** toolbar gets a third value, `dom`. `withRenderer` mounts the DOM
  `Tree` for it.
- The story runner gets `--renderer <react|svelte|dom>`, which sets the `renderer` global for
  every story it plays. `node src/harness/stories/cli.mjs Core --renderer dom` then plays the
  existing Core plays against the DOM renderer, and that is the evidence for "Behaviour is the
  part's own". A play that fails only under `dom` is a renderer bug, fixed in this change. CI's
  `checks` job runs it beside the default run.

### 4. The Stimulus controllers are the only Hotwire-aware code

`src/library/hotwire.ts` is a new root file, declared in `structure.ts` `ROOT_FILES` in its own
commit. It exports `ZenController`, `ZenThemeController` and `registerZen(application)`, which
registers them as `zen` and `zen-theme`. `@hotwired/stimulus` is external.

- **The placeholder:**

  ```html
  <div data-controller="zen" data-zen-part-value="Select"
       data-zen-props-value='{…}' data-zen-field-value="basis" data-zen-values-value='[…]'>
  ```

  The part draws inside a `[data-zen-part]` wrapper that is the placeholder's only element child
  besides its `<template>`s and its hidden input. `connect()` removes a stale wrapper left by a
  snapshot, then mounts. `propsValueChanged` updates the part. `disconnect()` destroys it.
  Stimulus fires these for visits, frames and streams.
- **Events:** each callback the binding lists in `events` is passed as a function that
  dispatches a bubbling `zen:<name>` from the placeholder, with `detail: args`. `<name>` is the
  callback without `on`, lower-cased.
- **Value echo:** a binding with `value: { prop, on }` gets the change applied to the
  controller's own props, followed by a redraw, so the choice holds with no round trip. The form
  field belongs to the controller, not to a prop, because some parts use `name` as a visible
  caption (Select does). With `field`, the controller keeps a hidden `<input name=field>` in the
  placeholder. Its value is `values[index]` when `values` is given, and otherwise the prop as
  text. The controller dispatches native bubbling `input` and `change` from it. The existing
  `change->calc#choose` reads `event.target.name/value` from it unchanged.
- **Slots:** each `<template data-zen-slot="icon">` child is a fill that clones the template's
  content on each draw. A MutationObserver on direct children redraws when the templates change.
- **Morph:** on `turbo:before-morph-element` targeting a placeholder, the controller calls
  `preventDefault()` and copies the incoming element's props, field and values attributes onto
  itself, which fires the value-changed callbacks. Morph never touches the drawn DOM. The Hotwire
  story pins `@hotwired/turbo` to the version turbo-rails 2.0.23 vendors.
- **Cache:** on `turbo:before-cache`, the controller destroys the part and removes its wrapper,
  so the snapshot holds only placeholders.
- **Theme:** `zen-theme` takes `pack` and `mode` values (`light`, `dark`, `system`). It applies
  `scopeView(resolveTheme({ theme: pack }).facets, resolvedMode)` to its element, plus
  `data-zen-pack`. It always writes a resolved `data-mode`, following `subscribeSystemMode` when
  the mode is `system`. It publishes the scope (pack, facets, mode, principles) to the parts
  inside it for `use.scope()`.

The story that proves the lifecycle is `screens/Hotwire/` (`Core/Screens/Hotwire`, tagged
`browser`). It runs real Turbo and Stimulus against stubbed responses, with one play per spec
scenario: frame, stream, frame replace, props change, morph, cache restore, events, form field,
slot and theme.

*Alternative:* one controller per part (`zen-select`). That means more files and pins, and the
lifecycle code would be split across them when it should exist once.

### 5. A separate self-contained build for import maps

`vite.hotwire.config.ts` builds `src/library/hotwire.ts` as one ES module. Code splitting is off,
`@hotwired/stimulus` is external and `emptyOutDir` is false. It writes:
- `lib/hotwire/zen.js`;
- `lib/hotwire/zen.css`, the bundled parts' stylesheets with library.css, gathered by a
  `joinStyles` shared from `vite.lib.config.ts`;
- `lib/hotwire/themes/<pack>.css`, one per pack, written at build time by `toCssVars`:
  `.lib-scope[data-zen-pack="<pack>"][data-mode="light"|"dark"]`.

`build:lib` becomes `vite build -c vite.lib.config.ts && vite build -c vite.hotwire.config.ts &&
tsc …`. `check-lib-entries.ts` gets a rule: `lib/hotwire/zen.js` has no import but
`@hotwired/stimulus`, and nothing of React or Svelte. `package.json` exports `./hotwire`,
`./hotwire/zen.css` and `./hotwire/themes/*`. The bundle's size is reported in `docs/rails.md`.

*Alternative:* pin the existing `lib/` chunks. They reach React through the shared chunks, and the
pins would change with every build.

### 6. Rails gets files, a helper snippet and pins, not a gem

`docs/rails.md` explains each step:

1. **Vendor the build** with `script/zen-vendor <zen checkout> <pack>`, kept in the app. It:
   - runs `npm ci && npm run build:lib` in the checkout;
   - copies `zen.js` to `vendor/javascript/`;
   - copies `zen.css` and the one chosen pack's CSS to `app/assets/stylesheets/zen/`, so
     `stylesheet_link_tag :app` loads only that pack;
   - writes the commit to `vendor/javascript/zen.version`.

   Node is needed only on the machine that vendors.
2. **Pin and register.** Add `pin "zen", to: "zen.js"`, then call `registerZen(application)` in
   `controllers/index.js`.
3. **Add the helper**, `zen(part, field: nil, values: nil, html: {}, **props, &slots)`. It writes
   the placeholder with `tag.div(**html, data: { controller: "zen", zen_part_value:,
   zen_props_value: props.to_json, zen_field_value: field, zen_values_value: values }.merge(html[:data]
   || {}))`. `html:` carries the app's own attributes and actions onto the placeholder. The block
   fills `<template data-zen-slot>` elements.
4. **Mind the labels.** zen's controls draw their own button triggers and menus, so they must not
   sit inside a `<label>`. A click on the label would press the trigger again. Name them with the
   part's `label` prop, or its `name` caption, instead.

### 7. What Market gets

- `zen-theme` on `<body>` with the chosen pack in `system` mode. In `application.css`, the
  colours, type and spacing that the contract covers are replaced by contract variables. The
  dial, the tables and the plot keep their own rules, which now read those variables.
- In `board/_controls`, `hardware/_controls` and `shared/_filters`, each select becomes a
  `zen_select`:

  ```erb
  <%= zen_select :basis, [["Best published", "top"], …], selected: board.basis, label: "Figure to beat" %>
  ```

  `zen_select` is Market's wrapper over `zen`. It splits the choices into `items`, `values` and
  `index` and puts the Select's own `name` caption in place of the `<label>`. The `<label>` around
  it becomes a `div` of the same class. The placeholder sits inside the same `form_with`, so the
  existing `change->calc#choose` and `change->autosubmit#submit` actions hear its field's `change`
  unchanged. Number fields stay native. `<noscript>` keeps native selects, so the page still works
  without JavaScript.
- `coins/show` gets a watch control, which it lacks today. It is a lazy
  `turbo_frame_tag dom_id(coin, :watch_frame), src: watch_coin_path(coin), loading: :lazy`, served
  by a new `get :watch` member route that renders the control. The control is a zen `Button` with
  `on` and an accessible name, inside a `button_to`-style form. Its `zen:press` event runs a small
  `watch` Stimulus action that calls `form.requestSubmit()`. The PATCH responds with the existing
  `turbo_stream.replace`, which now replaces the frame's contents. That covers the frame route and
  the stream route. The board rows keep their native stars, so the board gains no requests.

## Risks / Trade-offs

- **The DOM patcher's matching drifts from React's or Svelte's in an edge case.** Mitigation: the
  every-feature tree gains a keyed reorder and a slot that comes and goes, and every Core play
  runs under `--renderer dom`.
- **A DOM binding grows logic its siblings don't have.** Mitigation: the rule allows only
  `domPart`, `use`, models and handlers. Decision 2's follow-up removes per-part bindings
  altogether.
- **A cold load flashes empty placeholders.** Mitigation: zen.css gives `[data-controller~=zen]`
  `min-block-size: var(--control-h)`. The pack's stylesheet loads in `<head>`, so colours are right
  at first paint.
- **zen.css restyles Market's own markup.** Mitigation: most of its rules sit under `.lib-scope`.
  The unscoped ones (`[data-hue]`) hit no markup Market uses. Each Market page is checked by eye
  before merging.
- **The bundle is large, holding every core part in one file.** Mitigation: its size is measured
  and reported. Per-part entries are a follow-up if it matters.
