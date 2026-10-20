# Svelte bindings: one view tree, two renderers

Every zen component renders in React and in Svelte 5 from one framework-free model, with the same markup, classes and data attributes, so one stylesheet styles both. **React and Svelte are bindings only**: every behaviour and every visual is shared. A model returns a **view tree** (plain data: elements, attributes, text, slots, handler keys and store names), and one renderer per framework draws any tree: `src/library/view/Tree.tsx` and `src/library/view/Tree.svelte`. A component's `.tsx` and `.svelte` are one `<Tree …/>` each.

Button (`src/library/components/core/Button/`) is the worked example; Knob (`src/library/components/music/Knob/`) is the second. Components not yet converted still render their model by hand in both files (the older way, below) and are held by the DOM parity test until a conversion lane moves them.

## The kernel (`src/library/view/`)

| File | What it holds |
|---|---|
| `Tree.model.ts` | The tree: `Node` (`{ tag, attrs?, children?, key?, on?, bind? }`), `Slot` (`{ slot: name }`), and the helpers `h(tag, attrs, ...children)`, `slot(name)`, `when(test, () => node)`, `each(items, key, draw)`, `wire(node, { on, bind })`, `styleText(map)`, `printTree(node)`. No framework. (`tree.ts` would clash with `Tree.tsx` on a case-insensitive disk, so it follows the `<Name>.model.ts` convention.) |
| `Tree.tsx`, `Tree.svelte` | The two renderers, written once. Props: `tree`, `slots` (React nodes / Svelte snippets by name), `handlers` (callbacks by key), `stores` (the registry; default all). |
| `mount.ts` | What both renderers do to an element once it exists: apply its `bind` stores, then attach its `on` listeners. Framework-free. |
| `stores.ts` | The registry: every store a tree can bind, by name (`longPress`, `hold`, `tip`, `knob`). `keyed(bindX, ['onFoo'])` adapts a plain `bindX(node, params)` store. |
| `tip.ts` | The app's tooltip action as a store (`tip`). |
| `bridge.ts`, `useBound.ts` | For unconverted components only: a plain store as a Svelte action (`actionOf`) or bound to a React ref (`useBound`). |
| `bindings.ts`, `bindings-only.test.ts`, `view.baseline.json` | The rule, enforced (below). |
| `snapshot.test.ts`, `__snapshots__/<Name>.tree` | Each converted component's tree for every fixture. |
| `Tree.parity.test.tsx` | The two renderers held to each other over one synthetic tree that uses every feature. |

### The tree

- **Attributes** use their DOM names (`class`, `aria-pressed`, `viewBox`, `stroke-width`) and are strings or undefined, never booleans: a present boolean attribute is `''` (both renderers set `disabled: ''` as the property `true`). `style` is a string (`styleText({ '--yh-x': '3', 'min-width': '2px' })`); React gets it as an object.
- **Children** are elements, text, slots, or `null`: `when(false, …)` leaves a hole so the siblings after it keep their positions (and their elements). Unkeyed children match by position; a list that reorders uses `each(items, key, draw)`, whose nodes carry `key`, and goes in its own parent element.
- **Slots** are holes the binding fills: `slot('icon')` draws `slots.icon` (a `ReactNode` in React, a `Snippet` in Svelte). The model can't see a React node or a snippet, so it takes which slots are filled as data (`buttonView(props, { icon: true })`) and draws a slot's wrapper only then.
- **Handlers**: `on: { click: 'press' }` calls `handlers.press(event)`, a native listener on the element in both renderers (React's synthetic events aren't used, so both see the same events in the same order). The model exports the handlers too (`buttonHandlers(props)`), so a binding computes nothing: a click's rule (`clickPresses`) lives in `press`.
- **Stores** (`bind`): `[['longPress', { disabled: false, onLongPress: 'longPress' }]]`. Each entry names a registered store and passes plain-data params; a param that is a callback holds a handler key, and the store reads the latest handler when it calls it. A store is applied when the element mounts (stores first, in order, then the `on` listeners, so a store's listener runs before a handler), gets `update(params)` whenever its params or the handlers change, and `destroy()` on unmount. Changing the list of store names rebinds them all.
- **A tooltip action** (`tipAction`, a function from the app) is a handler too: the `tip` store binds `{ tip: key, tipAction: 'tipAction' }` and applies `handlers.tipAction(node, key)`, reapplying when the key or the action changes. Knob's own store applies its tooltip the same way.
- **State back to the model.** A store reports only through handlers (`onLongPress`, `onstep`); the owner (the app) changes the props and the model draws the new tree. Button and Knob are fully controlled, so no store holds view state. When a component needs local view state (a measured width), the store is a readable (`subscribe`/`get`), the binding reads it (`useSyncExternalStore` in React, `fromStore(store).current` in Svelte) and passes it to the model: `xView(props, state)`. That is one line per binding, added with the first component that needs it.

No function ever appears in a tree, so a tree prints as text (`printTree`) and snapshots.

## The files of one converted component

| File | What it holds |
|---|---|
| `Button.model.ts` | The props (`ButtonModelProps`: everything but slots), `buttonView(props, slots): Node` (the face's classes, `data-*`, ARIA, label, glyph, the icon slot, `on: { click: 'press' }` and the `longPress`, `hold` and `tip` stores) and `buttonHandlers(props)`. Pure helpers (`clickPresses`). No React, no Svelte. |
| `longPress.ts`, `hold.ts` | The stores: `bindLongPress(node, params)` and `bindHold(node, params)`, each returning `{ update, destroy }`, registered in `view/stores.ts`. |
| `Button.tsx` | `<Tree tree={buttonView(props, { icon: icon !== undefined })} slots={{ icon }} handlers={buttonHandlers(props)} />`, its doc comment (job, changes, tuning knobs) and its CSS imports. |
| `Button.svelte` | The same line with the Svelte `Tree` and the `icon` snippet. |
| `Button.css` | Shared as is (contract variables only). |
| `Button.fixtures.ts` | Every story's args as plain data (`defineFixtures<ButtonModelProps>()({ Board: { args }, Role2: { items } })`), plus the controls (`buttonArgTypes`). No callbacks: the stories add spies. |
| `Button.stories.tsx` | `const story = fixtureStories<Story>(Button, ButtonSvelte)`, then one line per story (`story(s.Board)`, or `{ ...story(s.Board), play }`). |

No per-component hooks (`useX.ts`) or actions (`x.svelte.ts`), no `*.stories.svelte.ts`.

## Stories: one Storybook, a Renderer toggle

The React Storybook (`.storybook/`) draws every story. Its toolbar's **Renderer** (`react` | `svelte`, `rendererGlobalTypes` in `src/library/storybook.globals.ts`) picks who draws a converted component: `withRenderer` (`src/library/stories/story.tsx`, first in the component's `decorators`, so inside the theme) mounts the Svelte component with the story's args and fixture through Svelte's `mount()`, and unmounts it on change. Story ids, controls, the theme toolbar and play functions are unchanged, so the plays exercise whichever renderer is chosen. A story with a layout of its own (`render`, e.g. Button's Faces grid) has no fixture to draw in Svelte and stays React, with a note.

The Svelte Storybook (`.storybook-svelte/`, `npm run storybook:svelte`) still serves the unconverted components' `*.stories.svelte.ts` until every component is converted.

## Rules

- **Bindings only.** A component's `.tsx` and `.svelte` under `src/library/{primitives,components,layout,yahaha}` write no element markup but `<Tree …/>`. `src/library/view/bindings-only.test.ts` counts the other tags per file against `view.baseline.json`: a count may go down, never up, and a file not listed must have none. Converting a component deletes its lines there.
- **Nothing either renderer would copy.** If a binding would compute it, it goes in the model (the tree, the handlers) or a store.
- **Theme.** `ThemeScope.svelte` and the `theme` action (`src/library/svelte/theme.svelte.ts`) draw `scopeView` from `src/library/theme.model.ts`, as React's `ThemeScope` does.
- **Tiers.** `src/library/tiers.ts` scans `.svelte` files: `<script>` as TS, `<style>` as CSS, `style="…"` and `style:prop` like `style={{}}`. New files keep every count at 0.

## Converting a component

A lane converts whole component folders; it owns the folder and adds one line to each of the shared lists below.

1. **Model returns a tree.** In `<Name>.model.ts`, make `<name>View(props, slots?)` return a `Node` built with `h`/`when`/`each`/`slot`, drawing exactly the DOM the `.tsx` draws today (a primitive such as `Text` or `Surface` becomes its element with `textView(...)`'s or the surface model's class and attributes spread in). Export `<name>Handlers(props)` for every callback the tree names.
2. **Behaviour into stores.** Each hook or action becomes (or already is) a plain `bindX(node, params)` store; register it in `src/library/view/stores.ts` with `keyed(bindX, [callback fields])` (one line); bind it from the tree (`wire(node, { on, bind })`). Delete the `useX.ts` hook and the `x.svelte.ts` action; if `src/library/svelte.ts` exported the action, export `actionOf(bindX)` under the same name instead.
3. **Bindings.** `<Name>.tsx` becomes `<Tree tree={…} slots={…} handlers={…} />` (keep its doc comment and CSS imports, add `primitives/Text.css` or `Surface.css` if it drew those primitives); `<Name>.svelte` the same with `view/Tree.svelte`.
4. **Same DOM.** Before deleting the old renderers, compare: the parity line for the component must still pass against the new renderers, and the new React DOM must equal the old one for every fixture.
5. **Tests move.** Delete its line from `src/library/parity.test.tsx`; add `snapshot('<Name>', (props) => <name>View(props), <name>Stories)` to `src/library/view/snapshot.test.ts` and record it (`npx vitest run src/library/view/snapshot.test.ts -u`, then read the `.tree` file). Delete its entries from `src/library/view/view.baseline.json`. Its own tests stay and pass.
6. **Stories.** In `<Name>.stories.tsx`: `decorators: [withRenderer, withLibraryTheme]`, `const story = fixtureStories<Story>(<Name>, <Name>Svelte)`, each story `story(s.X)` or `{ ...story(s.X), play }`. Delete `<Name>.stories.svelte.ts` (and `<Name>.story.svelte`).
7. **Checks** (each exits 0): `npm run typecheck`, `npx vitest run src/library/view src/library/parity.test.tsx src/library/tiers.test.ts <its folder>`, `npm run build:lib`, `npm run build:storybook`, `npm run build:storybook:svelte` (while that Storybook exists).

## Unconverted components (the older way)

Until a lane converts it, a component's `<Name>.tsx` and `<Name>.svelte` render its `<name>View` by hand, the same markup in both, and `src/library/parity.test.tsx` compares their DOM for every fixture (`parity('Name', Name, NameSvelte, nameStories)`). Its stores are wired with `useBound(ref, bindX, params)` in React and `actionOf(bindX)` in Svelte. `docs/svelte-bindings.md`'s history has the full how-to for that way; new work converts instead.

## Running the Storybooks

`PREVIEW_LABEL="Zen" PREVIEW_PORT=4191 STORYBOOK_PORT=6022 npm run dev` serves the one Storybook; flip **Renderer** in its toolbar. `npm run storybook:svelte` serves the Svelte Storybook of the unconverted components on 6023; the React Storybook shows it as the **Svelte** ref while it runs (`SVELTE_STORYBOOK_PORT=6023 PREVIEW_PORT=4191 STORYBOOK_PORT=6022 npm run dev` starts both).
