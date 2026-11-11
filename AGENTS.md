# AGENTS.md

Zen: React + TypeScript (TSX), Vite, Vitest, Storybook.

- **The design OS**: a token contract with mixable theme facets (`src/library/`), and the Yahaha app redesigned on it (`src/library/yahaha/`). `docs/design-os-handoff.md` explains the ideas and where the work stands.
- **Agent harnesses** (`src/harness/<name>/`, shared parts in `src/harness/shared/`): UI kits for mods of agent apps, coloured by zen's packs. Claude Code is the first (`src/harness/claude-code/`, stories under `Harness/Claude Code/…`); `docs/harness-claude-code.md` is the reference for making a Claude Code mod with zen.

## Preview

**Working on an app and zen together** (on trial as the default, #49): start from the app's repo, not here. In openflowfm/visuals, `npm run dev:app` (the real app window with hot reload) or `npm run dev` (the page in a browser) links this checkout, starts zen's launcher below on 6022/4191 (or `ZEN_STORYBOOK_PORT`/`ZEN_PREVIEW_PORT`), and shows zen's Storybook inside the app's. Zen's source hot-reloads in both. Generic parts still land here first as their own PR.

For zen on its own, use only the unified launcher:

```sh
PREVIEW_LABEL="Zen" PREVIEW_PORT=4191 STORYBOOK_PORT=6022 npm run dev
```

It serves the static root notice and the one Storybook (`.storybook/`: the library, harnesses and Yahaha redesigns), and stops them together. If one child fails, stop and restart the whole launcher group; don't start a replacement child on its own. Never stop unrelated processes or use occupied ports. Give each isolated worktree its own ports.

## Checks

Each must exit 0. Run the narrowest one that covers your change. CI on the PR runs the rest, so don't run the whole set locally.

| Command | When |
|---|---|
| `npm run typecheck` | Any TS/TSX change. Fast compile check. Checks two projects: the root and `src/harness/claude-code/tsconfig.json` (engine JSX against `h`). |
| `npx vitest run src/harness` | The harness's colour maths and skins (`src/harness/`), or any palette or pack change. |
| `npx tsx scripts/harness-skins.ts` | Writes `src/harness/claude-code/kit/skins.ts` after a palette, pack or `src/harness/claude-code/skins.ts` change (the harness tests fail until it's run). |
| `npx vitest run src/library` | Library tokens, themes, layout, components, or anything under `src/library/yahaha/`. |
| `npx vitest run src/library/tiers.test.ts` | Any CSS or TSX under `src/library/{components,music,layouts,yahaha,primitives,graph,report}`: the tier rules hold their baseline (`npm run tiers` prints the table; `npm run tiers -- --write` records a lower one). |
| `npx vitest run src/library/structure.test.ts` | Any file added, moved or renamed under `src/library`, or a story's title: every file is where `docs/structure.md` says it goes. |
| `npm test` | Anything else under `src/` (it includes the above). |
| `npm run build` | The static root page. |
| `npm run build:storybook` | Any stories (library, harnesses, Yahaha), `.storybook/`. |
| `node src/harness/stories/cli.mjs [prefix]` | Any story: plays it on the virtual DOM, and in the headless shell when tagged `browser` (`docs/harness-stories.md`). `npx vitest run src/harness/stories` for the runner itself. |
| `npm run build:lib` | The package: anything a public entry exports (`src/library/index.ts`, `src/library/themes.ts`, `src/library/storybook.tsx`, `src/library/svelte.ts` and what they reach), `vite.lib.config.ts`, `tsconfig.lib.json`, `package.json` exports. |
| `npm run check:lib` (after `build:lib`) | The same: `lib/svelte.js`, `lib/themes.js` and every chunk they import never import React (`scripts/check-lib-entries.ts`). A model or other framework-free file never imports a value from a `.tsx`. |
| `npx vitest run src/library/parity.test.tsx` | Any unconverted component's model, React or Svelte renderer, or fixtures: both renderers draw the same DOM for every story. |
| `npx vitest run src/library/foundation/view` | The view tree (`src/library/foundation/view/`), the store registry, any converted component's model or fixtures (its tree snapshot), or any `.tsx`/`.svelte` under `src/library/{primitives,components,music,layouts,yahaha}` (the bindings-only rule). |

UI is tested by exercising behaviours in Storybook stories, never by unit tests; pure models and functions get unit tests.

Builds and unit tests are not browser evidence: look at layout and perceptual effects in a browser (the invisible-keyboard bug passed every test).

## Structure

Every section of `src/library` has the same folders. `docs/structure.md` is the rule; `src/library/structure.test.ts` fails on a file, folder or story title outside it and says where the thing goes.

```
src/library/
  index.ts, themes.ts, svelte.ts, storybook.tsx, …   the public entries, the repo-wide checks and what they read
  foundation/                    themes/, skins/, view/, svelte/, stories/: shared machinery, no stories of its own
  primitives/<Name>/             the generic tiers
  components/<Name>/
  layouts/<Name>/
  screens/<Name>/                whole views of the core: Bring your own app, the theme inspector, the preview catalog
  <area>/                        music, graph, shader, report, math, compendium, openspec, site, yahaha
    index.ts, lower-case files   the area's entry, registries, stylesheets, helpers
    model/                       data and pure functions: no React, no Svelte
    components/<Name>/           one interaction or one drawn thing
    layouts/<Name>/              arranges other parts
    screens/<Name>/              what an app shows whole: a board, a document, a sample of the area
    <sub-area>/                  the same shape again (music/live, math/trig)
```

- **A part is a folder.** Its model, renderers, stylesheet, fixtures, stories and tests sit together in `<tier>/<Name>/`. A file with a capitalised name is a part's file and is never loose in a tier folder or at an area's root; lower-case helpers may be.
- **No `stories/`, `view/` or `fixtures/` folders.** Stories sit in the part they show; a story of the whole area is a screen.
- **The sidebar mirrors the path.** A stories file's `title` starts with its area's sidebar name and its tier: `music/live/screens/Daws/` is `Music/Live/Screens/…`, `components/Button/` is `Core/Components/Button`. The sidebar's top level is `Core`, then one group per area, then `Harness`: nothing of the library sits outside them.
- **A new area, sub-area or root file is declared** in `src/library/structure.ts` (`AREAS`, `ROOT_FILES`), in its own small commit. Don't add a folder beside the tiers to hold something that fits one of them.
- **There is no baseline.** The check has no exceptions list; if a file cannot go where the rule says, change the rule in an OpenSpec change (`library-structure`), not the file's neighbours.

## Retired field guide

The original six-book field guide and its eighteen examples have been removed. Its old reviews in `docs/` are historical, not requirements to restore it. The root page is a static notice; maintained examples live in Storybook.

## Library rules

- Static documentation sites use `@satoramoto/zen/astro` and `@satoramoto/zen/site`;
  see `docs/static-sites.md`. Astro templates/build helpers ship as source under
  `src/site/`; React views are built from `src/library/site/`. Run `check:site` and
  the `Site/Components/Documentation` plays after changing this surface. Consumers own
  language-specific generators, content, site configuration and deployment.

- Apps consume zen from GitHub: `"@satoramoto/zen": "github:satoramoto/zen#<sha>"`; npm runs `prepare` (`build:lib`) on install, then `import { ThemeScope } from '@satoramoto/zen'` and `import '@satoramoto/zen/zen.css'`.
- The public entries (`package.json` `exports`, built by `vite.lib.config.ts`) are the only way an app reaches zen; nothing imports a deeper path:
  - `@satoramoto/zen` (`src/library/index.ts`): the tokens, themes, primitives, layout and components; its stylesheet is `@satoramoto/zen/zen.css`.
  - `@satoramoto/zen/themes` (`src/library/themes.ts`): the packs and facet lists (`packs`, `palettes`, `faces`, `scales`, `materials`), `toCssVars`, `resolveTheme`, `scopeView`, mode resolution and their types, importing no React and no Svelte, for code that needs a theme without a renderer.
  - `@satoramoto/zen/svelte` (`src/library/svelte.ts`): the Svelte 5 renderers and theme scope (see "Svelte bindings").
  - `@satoramoto/zen/storybook` (`src/library/storybook.tsx`): the toolbar globals (`libraryGlobalTypes`, `libraryInitialGlobals`) and decorators (`withLibraryTheme`, `withStoryFrame`) for an app's own Storybook. Storybook is never reached from the main entry.
  - `@satoramoto/zen/storybook/renderers` (`src/library/storybook-renderers.tsx`): `withRenderer`, `fixtureStories`, `treeStory` and `defineFixtures`, for an app's view-tree parts to play in both renderers. Its own entry because it needs Svelte.
  - `@satoramoto/zen/view` (`src/library/view.ts`, framework-free), `/view/react` and `/view/svelte`: the view tree for an app's own parts (`h`, `component`, `wire`, `textNode`, `iconNode`, `viewState`, `defineFixtures`, the store contract), each renderer's `Tree`, and `registerComponents` / `registerStores`, which add an app's parts and stores by name and refuse a name zen has. The App parts stories (`src/library/screens/AppParts/`) are the worked example.
  - `@satoramoto/zen/checks` (`src/library/checks.ts`): `checkContract`, `checkTiers` and `checkBindingsOnly` over a folder (a path, read in node, or `memoryFiles`), for an app's tests; zen's own rule tests call them.
- The one exception: a harness kit (`src/harness/<name>/kit/`) is reached by path and copied into each plugin at the consumer's build (`@satoramoto/zen/harness/*`, shipped as source in `files`), because the agent engine loads a plugin's own source files only. Keep a kit self-contained: no imports outside its folder, no React.
- App-specific UI lives in the app's repo, built on these entries; zen holds only generic parts (Yahaha's redesign is the reference exception). visual[flow]'s UI lives in openflowfm/visuals `app/src/ui/`; zen keeps its `visuals` theme pack. When an app needs something zen has but doesn't export, export it (with a one-line doc) rather than reaching in.
- **Running an app against a local zen** (hot reload of zen's source): every entry has a `zen-source` export condition pointing at the TS/TSX source (the CSS entry at the empty `src/library/source.css`, since in source each component imports its own stylesheet). A plain install ignores it and resolves the built `lib/`. In the app, point the package at the checkout and add the condition first in its Vite config:

  1. Make `node_modules/@satoramoto/zen` a link to the checkout: `npm install --no-save ~/Code/satoramoto/zen` (a folder installs as a symlink; the next plain `npm install` puts the GitHub build back). Not a `resolve.alias` to the folder: an alias to a path skips `exports`, so `@satoramoto/zen/storybook` and `@satoramoto/zen/zen.css` don't resolve.
  2. Vite config:

     ```ts
     const zenSource = process.env.ZEN_SOURCE; // the checkout, e.g. ~/Code/satoramoto/zen
     export default defineConfig({
       resolve: {
         conditions: zenSource ? ['zen-source', 'module', 'browser', 'development|production'] : undefined,
         dedupe: ['react', 'react-dom'], // zen's source would otherwise reach its own react
       },
       server: { fs: { allow: zenSource ? ['.', zenSource] : ['.'] } },
     });
     ```

  The link resolves to the checkout's real path, outside `node_modules`, so Vite compiles zen's TSX with the app's React plugin and hot-reloads it. The condition only resolves against a checkout: the installed package ships `lib/` only.

- Every decision belongs to one tier (tokens, primitives, controls, groups, regions, screens, app): `docs/tiers.md` says which, and `src/library/tiers.test.ts` holds its four rules to `tiers.baseline.json` (counts only go down).
- Components in `src/library/components`, `src/library/music`, `src/library/graph`, `src/library/layouts`, and `src/library/yahaha` read only the variables produced by `toCssVars()` in `src/library/contract.ts` (plus local ones they declare). No literal colours or radii, no `light-dark()`; `library.test.tsx` enforces this. The mix[flow] port's files that still speak the reference's vocabulary are named in `PORT_VOCABULARY` there; the list only shrinks, and a new music file reads the contract.
- Generic components live in `src/library/components/<Name>/` (controls) and `src/library/music/components/<Name>/` (music parts), exported from `components/index.ts` and `music/root.ts`, stories titled `Core/Components/<Name>` and `Music/Components/<Name>`. They carry no app meaning: colour is a slot (`hue` 1–4, `role-1`/`role-2`; `components/hue.ts`), and an app maps its meanings onto it (Yahaha in `yahaha/hues.ts`). Never import `yahaha/` from them.
- **Music is one area, `src/library/music/`, holding two kinds of part** (`docs/music.md`). The token-drawn parts (Fader, Pad, Keys, the readouts, the live workspace's parts) read zen's contract, need no scope, and are exported flat from the package root through `music/root.ts`. The mix[flow] toolkit is the reference-faithful port, exposed as the `Music` namespace (`music/index.ts`, `music/svelte.ts`) in both renderer entries and drawn inside `Music.Scope`, with its live surface in the sub-area `music/live/`. `Scope` is a CSS vocabulary boundary, never a second theme; the enclosing Zen scope owns all facets. There is one meter and one transport, the toolkit's (`Music.Meter`, `Music.Transport`): a token-drawn part that needs one draws it inside a `MusicScope` node (MixBand's meters, Yahaha's Show). The two knobs are different controls: the token-drawn dial that shows a value the host formats is `KnobReadout` (the package root also exports it as `Knob`), and `Music.Knob` turns a `Param`. `Fader` at the root is the token-drawn fader and `Music.Fader` the toolkit's slider. The tier rules scan all of `music/` (the toolkit's findings are recorded in the baseline and only go down). Music UI is verified with browser story plays/visual comparisons and narrowly scoped hook/lifecycle tests, not new helper/model/snapshot unit suites.
- The graph is its own area, `src/library/graph/`: `model/` (the Circuit model, `docs/circuit-model.md`), `components/<Name>/` (`Graph`, `Port`, `Device`, `NodeSheet` and the canvas layers), `screens/` (Circuit: fixtures, Samples, Behaviours; Materials), all exported from `graph/index.ts`, which the package root re-exports. Stories are titled `Graph/Components/<Name>` and `Graph/Screens/<Name>`. The tier rules and `library.test.tsx` hold it to the same rules as the controls (`graph/<tier>/<Name>` is a tiers folder), and the same colour-slot rule applies.
- The research report is its own area, `src/library/report/` (`docs/research-report.md`): a plain-JSON market research report (`model/`, pure helpers with unit tests) and the document that renders it (`components/<Name>/`: `Report`, `Brief`, `Summary`, `Segments`, `Findings`, `LeadTable`, `Sources`), all exported from `report/index.ts`, which the package root re-exports. Stories are titled `Report/Components/<Name>`. It knows a market, a goal, findings and leads, never what the market is; the tier rules and `library.test.tsx` hold it to the controls' rules (`report/<tier>/<Name>` is a tiers folder).
- Colour, type, shape and spacing values live only in `src/library/foundation/themes/` (one file per facet). Mark any value the source style doesn't define with `// added`.
- The compendium is its own area, `src/library/compendium/` (`src/library/compendium/README.md`): the book primitives for an interactive textbook. `model/` (no React) holds the document (an entry is plain data: sections, paragraphs of runs, formulas as TeX, figures by registry name, quantities a scrub sets and a figure binds to, exercises checked by name, notes, peeks at other entries), the checkers, the book and `validateEntry`; `components/<Name>/` one part each with its stories; `layouts/<Name>/` Reading, Document and Book; `book/` the sample textbooks (content, not primitives: the Fourier book, the trigonometry book in `book/trig/` with its figures in `math/trig/`, the harmonic series). It never knows what an entry is about and never imports `math/`; a page hands it the math components as figures and checkers. Its two packs are `textbook-console` and `textbook-blueprint` (the `airy` scale, the `reading` face for running text). React-only, not exported yet. Stories are titled `Compendium/Layouts/<Name>` and `Compendium/Components/<Name>`; `library.test.tsx` holds its CSS and TSX to the contract.
- Push is its own area, `src/library/push/` (`docs/push.md`): the Ableton Push 3's surface, its display and a model of the device, read from the manual and planned as the OpenSpec change `push-3-surface`. It makes no sound and speaks no MIDI. It is built from existing components first: a part is an existing component under the `push-3` pack, then that component with one more generic prop (one at a time, in its own commit), and a new component only for a large difference of function. Lamp colours are an indexed table in `src/library/foundation/themes/lamps.ts`, set as local `--push-lamp-N` properties, outside the contract. The tier rules, `library.test.tsx` and the bindings-only rule hold it at zero.
- OpenSpec is its own area, `src/library/openspec/` (`src/library/openspec/README.md`): a root read from its files (`model/`, no React: Markdown to blocks, specs with requirements and scenarios, changes with proposal, tasks and deltas, the archive) and drawn (`components/<Name>/`: `Markdown`, `Spec`, `Change`, `Repo`). Stories are titled `Openspec/Components/<Name>`; the `Repo` story named Zen draws this project's own `openspec/` folder, read at build time. This project is an OpenSpec project (`openspec/`, schema `spec-driven`): plan work there as a change (`openspec validate --strict`), archive it when done, and the stories show it. React-only, not exported yet; `library.test.tsx` holds its CSS and TSX to the contract.
- The theme editor is part of the core (`docs/theme-editor.md`): skins (a pack as portable JSON) in `src/library/foundation/skins/` (`skin.ts`, `colour.ts` and `persist.ts`, which never import React: a Vue or Svelte binding wraps them), and the React parts in `src/library/components/` (`SkinScope`/`SkinProvider`, `ThemePicker`, `ThemeEditor` and `ThemeSettings`), all exported from `components/theme-editor.ts`, which the package root re-exports. Stories are `Core/Components/Theme picker`, `Core/Components/Theme editor` and `Core/Screens/Bring your own app`. They are React-only: their markup is counted in `view.baseline.json` like any unconverted component's.
- A theme pack (`foundation/themes/packs.ts`) names its Refero style id and the source rules it keeps.
- `vendor/` holds the few modules the bundlers resolve in place of a dependency's dependency, each with its reason in its own `package.json`, aliased for every Vite build in `vite.aliases.ts` (the app, Vitest, the library build and Storybook all import it). Today: `use-resize-observer`, which mafs 0.21 imports as a v9 default export while v9's peer range stops at React 18 and v10 has no default export; npm installs v10 through `package.json` `overrides` so the install is clean, and the alias serves the vendored hook. Remove the alias and the override when mafs imports the named export.
- Shared files: `contract.ts`, `foundation/themes/`, `storybook.tsx`, `.storybook/`, `library.test.tsx`, `structure.ts`, `index.ts`, `components/index.ts`, `music/root.ts`, `graph/index.ts`, `library.css`, `yahaha/hues.ts`, `yahaha/STAGE.md`. Change them in their own small commit first.

## Svelte bindings

Zen's components also render in Svelte 5 (`@satoramoto/zen/svelte`). `docs/svelte-bindings.md` is the how-to for a lane, with Button as the worked example.

- **Bindings only (the rule).** React and Svelte are bindings: every behaviour and every visual is shared. A component's `<Name>.model.ts` returns a **view tree** (`src/library/foundation/view/Tree.model.ts`: elements, string attributes, text, slots, `on` handler keys, `bind` store names), and its `<Name>.tsx` and `<Name>.svelte` are each one `<Tree …/>` (`src/library/foundation/view/Tree.tsx`, `Tree.svelte`) with its slots and the model's handlers. `src/library/foundation/view/bindings-only.test.ts` fails if any `.tsx` or `.svelte` under `src/library/{primitives,components,music,layouts,yahaha}` (stories and tests aside) has element markup other than `<Tree …/>` (tags, `createElement(` / `h(` calls, Svelte's `{@html}`) beyond its count in `view.baseline.json` (counts only go down; only unconverted `components/` files remain there). A React context goes through the registered `Context` component (`src/library/foundation/view/Context.tsx`), never a provider in a binding. `docs/svelte-bindings.md` has the conversion checklist.
- **State.** Stateful logic (long press, hold, size observation, stepping) is a framework-free store in a plain `.ts` (`bindX(node, params)` returning `update`/`destroy`), registered by name in `src/library/foundation/view/stores.ts`; a tree binds it, both renderers apply it. No per-component hooks or actions (`actionOf`, `view/bridge.ts`, makes a store a Svelte action where one is public).
- **Composites.** A model draws another component as a `component('Name', props, { on, slots })` node, looked up by name in `src/library/foundation/view/reactComponents.ts` / `svelteComponents.ts` (one line each per component); callbacks are handler keys, slots are subtrees. Form state (`value`, `checked`, `indeterminate`) is set as element properties by both renderers.
- **Fixtures.** `<Name>.fixtures.ts` holds every story's args (and controls) as plain data; a converted component's `<Name>.stories.tsx` builds every story from them (`fixtureStories`, `src/library/foundation/stories/story.tsx`). A story's own harness (state the story keeps, like `StagePlayground.story.tsx`) is a `*.story.tsx`, outside the rule.
- **Checks of the DOM.** A converted component's tree is snapshotted per fixture (`src/library/foundation/view/snapshot.test.ts`, one line each, `__snapshots__/<Name>.tree`), and `src/library/foundation/view/Tree.parity.test.tsx` holds the two renderers to each other over a tree using every feature. An unconverted component is one line in `src/library/parity.test.tsx`, which renders every fixture instance with both renderers and compares the DOM (`src/library/parity.ts`).
- **Storybook.** `.storybook/` draws every story; its **Renderer** toolbar (`rendererGlobalTypes`) switches a converted component between React's and Svelte's `Tree` (`withRenderer` mounts the Svelte one), so the plays exercise both. There is no separate Svelte Storybook.
- **Shared files** (besides those above): `src/library/svelte.ts`, `src/library/fixtures.ts`, `src/library/parity.ts`, `src/library/parity.test.tsx`, `src/library/storybook.globals.ts`, `src/library/theme.model.ts`, `src/library/foundation/svelte/`, `src/library/foundation/view/` (`stores.ts`, `reactComponents.ts`, `svelteComponents.ts`, `snapshot.test.ts` and `view.baseline.json` take one line per component from a conversion lane), `src/library/foundation/stories/`.
- Checks: `npm run typecheck`, `npx vitest run src/library/foundation/view`, `npx vitest run src/library/parity.test.tsx`, `npx vitest run src/library/tiers.test.ts` (it scans `.svelte` too), `npm run build:storybook`, `npm run build:lib`. `.svelte` files aren't type-checked (svelte-check doesn't support TypeScript 7 yet).

## Yahaha redesigns

`src/library/yahaha/` holds only Yahaha's own concepts (the regions, the Stage, and widgets such as OneTouchPicker), one folder per widget under `components/` or `screens/` (Show, Stage), stories under `Yahaha/Components/…` and `Yahaha/Screens/…`; they build on `components/`, `music/components/` and the layout primitives; `src/library/yahaha/README.md` is the convention, `STAGE.md` the Stage brief, `hues.ts` what colour means. The Svelte originals are in `yahaha/` for reference: read them, never edit them (`npm --prefix yahaha run storybook` serves them if you need to see one). A lane owns whole widget folders; it never edits another lane's folder or the shared files above. Test selectors stay scoped to the widget.

## Ownership

Work on a branch in your own worktree. Changes reach `main` only through a PR. `main` is protected: the `checks` job in `.github/workflows/checks.yml` must pass first. It runs every command in the table above except `npx vitest run src/library`, which `npm test` already covers. A PR that changes only docs (`*.md` anywhere, or `docs/`) skips them and passes at once. Lane leads push their branch but don't open the PR. The orchestrator opens it after review and turns on auto-merge.
