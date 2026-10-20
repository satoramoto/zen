# AGENTS.md

Zen: React + TypeScript (TSX), Vite, Vitest, Storybook. Two things live here:

- **The field guide**: six books, eighteen principle demonstrations (`src/catalog.ts`, `src/PrincipleExample.tsx`, `src/App.tsx`, `src/stories/`).
- **The design OS**: a token contract with mixable theme facets (`src/library/`), and the Yahaha app redesigned on it (`src/library/yahaha/`). `docs/design-os-handoff.md` explains the ideas and where the work stands.
- **Agent harnesses** (`src/harness/<name>/`, shared parts in `src/harness/shared/`): UI kits for mods of agent apps, coloured by zen's packs. Claude Code is the first (`src/harness/claude-code/`, stories under `Harness/Claude Code/…`); `docs/harness-claude-code.md` is the reference for making a Claude Code mod with zen.

## Preview

**Working on an app and zen together** (on trial as the default, #49): start from the app's repo, not here. In openflowfm/visuals, `npm run dev:app` (the real app window with hot reload) or `npm run dev` (the page in a browser) links this checkout, starts zen's launcher below on 6022/4191 (or `ZEN_STORYBOOK_PORT`/`ZEN_PREVIEW_PORT`), and shows zen's Storybook inside the app's. Zen's source hot-reloads in both. Generic parts still land here first as their own PR.

For zen on its own, use only the unified launcher:

```sh
PREVIEW_LABEL="Zen" PREVIEW_PORT=4191 STORYBOOK_PORT=6022 npm run dev
```

It starts the app and the one Storybook (`.storybook/`: the field guide, the library and the Yahaha redesigns), and stops them together. If one child fails, stop and restart the whole launcher group; don't start a replacement child on its own. Never stop unrelated processes or use occupied ports. Give each isolated worktree its own ports.

## Checks

Each must exit 0. Run the narrowest one that covers your change. CI on the PR runs the rest, so don't run the whole set locally.

| Command | When |
|---|---|
| `npm run typecheck` | Any TS/TSX change. Fast compile check. Checks two projects: the root and `src/harness/claude-code/tsconfig.json` (engine JSX against `h`). |
| `npx vitest run src/harness` | The harness's colour maths and skins (`src/harness/`), or any palette or pack change. |
| `npx tsx scripts/harness-skins.ts` | Writes `src/harness/claude-code/kit/skins.ts` after a palette, pack or `src/harness/claude-code/skins.ts` change (the harness tests fail until it's run). |
| `npx vitest run src/library` | Library tokens, themes, layout, components, or anything under `src/library/yahaha/`. |
| `npx vitest run src/library/tiers.test.ts` | Any CSS or TSX under `src/library/{components,layout,yahaha,primitives}`: the tier rules hold their baseline (`npm run tiers` prints the table; `npm run tiers -- --write` records a lower one). |
| `npm test` | Anything else under `src/` (it includes the above). |
| `npm run build` | The field guide app. |
| `npm run build:storybook` | Any stories (field guide, library, Yahaha), `.storybook/`. |
| `npm run build:lib` | The package: anything a public entry exports (`src/library/index.ts`, `src/library/themes.ts`, `src/library/storybook.tsx`, `src/library/svelte.ts`, `src/library/storybook-svelte.ts` and what they reach), `vite.lib.config.ts`, `tsconfig.lib.json`, `package.json` exports. |
| `npx vitest run src/library/parity.test.tsx` | Any unconverted component's model, React or Svelte renderer, or fixtures: both renderers draw the same DOM for every story. |
| `npx vitest run src/library/view` | The view tree (`src/library/view/`), the store registry, any converted component's model or fixtures (its tree snapshot), or any `.tsx`/`.svelte` under `src/library/{primitives,components,layout,yahaha}` (the bindings-only rule). |
| `npm run build:storybook:svelte` | Any `*.stories.svelte.ts`, `*.story.svelte`, `.storybook-svelte/`, `src/library/storybook-svelte.ts`. |

UI is tested by exercising behaviours in Storybook stories, never by unit tests; pure models and functions get unit tests.

Builds and unit tests are not browser evidence: look at layout and perceptual effects in a browser (the invisible-keyboard bug passed every test).

## Field guide quality

- Preserve all eighteen stable example IDs and their source references.
- Keep comparisons honest: state which variables change and what stays fixed.
- Book summaries are paraphrases. Publisher descriptions support topic alignment, not exact full-text fidelity.
- Storybook Controls must affect the specimen. Canvas interactions must work in both the app and Storybook.
- Validate at narrow widths. Sliders must change the actual drawing, not just the displayed number.
- Review conceptual fidelity separately from interaction and layout checks.

## Library rules

- Apps consume zen from GitHub: `"@satoramoto/zen": "github:satoramoto/zen#<sha>"`; npm runs `prepare` (`build:lib`) on install, then `import { ThemeScope } from '@satoramoto/zen'` and `import '@satoramoto/zen/zen.css'`.
- The public entries (`package.json` `exports`, built by `vite.lib.config.ts`) are the only way an app reaches zen; nothing imports a deeper path:
  - `@satoramoto/zen` (`src/library/index.ts`): the tokens, themes, primitives, layout and components; its stylesheet is `@satoramoto/zen/zen.css`.
  - `@satoramoto/zen/themes` (`src/library/themes.ts`): the packs and facet lists (`packs`, `palettes`, `faces`, `scales`, `materials`), `toCssVars`, `resolveTheme`, `scopeView`, mode resolution and their types, importing no React and no Svelte, for code that needs a theme without a renderer.
  - `@satoramoto/zen/svelte` (`src/library/svelte.ts`) and `@satoramoto/zen/storybook-svelte`: the Svelte 5 renderers and theme scope (see "Svelte bindings").
  - `@satoramoto/zen/storybook` (`src/library/storybook.tsx`): the toolbar globals (`libraryGlobalTypes`, `libraryInitialGlobals`) and decorators (`withLibraryTheme`, `withStoryFrame`) for an app's own Storybook. Storybook is never reached from the main entry.
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
- Components in `src/library/components`, `src/library/graph`, `src/library/layout`, and `src/library/yahaha` read only the variables produced by `toCssVars()` in `src/library/contract.ts` (plus local ones they declare). No literal colours or radii, no `light-dark()`; `library.test.tsx` enforces this.
- Generic components live in `src/library/components/core/<Name>/` (controls) and `src/library/components/music/<Name>/` (instrument parts), each exported from that folder's `index.ts`, stories titled `Design OS/Components/Core|Music/<Name>`. They carry no app meaning: colour is a slot (`hue` 1–4, `role-1`/`role-2`; `components/core/hue.ts`), and an app maps its meanings onto it (Yahaha in `yahaha/hues.ts`). Never import `yahaha/` from them.
- The graph is its own area, `src/library/graph/`: `model/` (the Circuit model, `docs/circuit-model.md`), `view/<Name>/` (`Graph`, `Port`, `Device`, `NodeSheet` and the canvas layers), `stories/` (fixtures, Samples, Behaviours), all exported from `graph/index.ts`, which the package root re-exports. Stories are titled `Design OS/Graph/<Name>`. The tier rules and `library.test.tsx` hold it to the same rules as the controls (`graph/<view|model>/<Name>` is a tiers folder), and the same colour-slot rule applies.
- The research report is its own area, `src/library/report/` (`docs/research-report.md`): a plain-JSON market research report (`model/`, pure helpers with unit tests) and the document that renders it (`view/<Name>/`: `Report`, `Brief`, `Summary`, `Segments`, `Findings`, `LeadTable`, `Sources`), all exported from `report/index.ts`, which the package root re-exports. Stories are titled `Design OS/Report/<Name>`. It knows a market, a goal, findings and leads, never what the market is; the tier rules and `library.test.tsx` hold it to the controls' rules (`report/<view|model>/<Name>` is a tiers folder).
- Colour, type, shape and spacing values live only in `src/library/themes/` (one file per facet). Mark any value the source style doesn't define with `// added`.
- The theme editor is its own area, `src/library/theme-editor/` (`docs/theme-editor.md`): skins (a pack as portable JSON) in `skin.ts`, `colour.ts` and `persist.ts`, which never import React (a Vue or Svelte binding wraps them), and the React parts `SkinScope`/`SkinProvider`, `ThemePicker/`, `ThemeEditor/` and `ThemeSettings/`, all exported from `theme-editor/index.ts`, which the package root re-exports. Stories are titled `Design OS/Theme Editor/<Name>`. The tier rules and `library.test.tsx` hold it to the controls' rules.
- A theme pack (`themes/packs.ts`) names its Refero style id and the source rules it keeps.
- Shared files: `contract.ts`, `themes/`, `storybook.tsx`, `.storybook/`, `library.test.tsx`, `index.ts`, `components/core/index.ts`, `components/music/index.ts`, `graph/index.ts`, `library.css`, `yahaha/hues.ts`, `yahaha/STAGE.md`. Change them in their own small commit first.

## Svelte bindings

Zen's components also render in Svelte 5 (`@satoramoto/zen/svelte`, `@satoramoto/zen/storybook-svelte`). `docs/svelte-bindings.md` is the how-to for a lane, with Button as the worked example.

- **Bindings only (the rule).** React and Svelte are bindings: every behaviour and every visual is shared. A component's `<Name>.model.ts` returns a **view tree** (`src/library/view/Tree.model.ts`: elements, string attributes, text, slots, `on` handler keys, `bind` store names), and its `<Name>.tsx` and `<Name>.svelte` are each one `<Tree …/>` (`src/library/view/Tree.tsx`, `Tree.svelte`) with its slots and the model's handlers. `src/library/view/bindings-only.test.ts` fails if any `.tsx` or `.svelte` under `src/library/{primitives,components,layout,yahaha}` (stories and tests aside) has element markup other than `<Tree …/>` beyond its count in `view.baseline.json` (counts only go down). Button, Knob, LampButton and SettingsRow are converted; `docs/svelte-bindings.md` has the conversion checklist.
- **State.** Stateful logic (long press, hold, size observation, stepping) is a framework-free store in a plain `.ts` (`bindX(node, params)` returning `update`/`destroy`), registered by name in `src/library/view/stores.ts`; a tree binds it, both renderers apply it. No per-component hooks or actions (`actionOf`, `view/bridge.ts`, makes a store a Svelte action where one is public).
- **Composites.** A model draws another component as a `component('Name', props, { on, slots })` node, looked up by name in `src/library/view/reactComponents.ts` / `svelteComponents.ts` (one line each per component); callbacks are handler keys, slots are subtrees. Form state (`value`, `checked`, `indeterminate`) is set as element properties by both renderers.
- **Fixtures.** `<Name>.fixtures.ts` holds every story's args (and controls) as plain data; a converted component's `<Name>.stories.tsx` builds every story from them (`fixtureStories`, `src/library/stories/story.tsx`). An unconverted one still has `<Name>.stories.svelte.ts` (same story names), and a `<Name>.story.svelte` when a Svelte story needs markup.
- **Checks of the DOM.** A converted component's tree is snapshotted per fixture (`src/library/view/snapshot.test.ts`, one line each, `__snapshots__/<Name>.tree`), and `src/library/view/Tree.parity.test.tsx` holds the two renderers to each other over a tree using every feature. An unconverted component is one line in `src/library/parity.test.tsx`, which renders every fixture instance with both renderers and compares the DOM (`src/library/parity.ts`).
- **Storybook.** `.storybook/` draws every story; its **Renderer** toolbar (`rendererGlobalTypes`) switches a converted component between React's and Svelte's `Tree` (`withRenderer` mounts the Svelte one), so the plays exercise both. `.storybook-svelte/` (`npm run storybook:svelte`, port 6023) keeps the unconverted components' Svelte stories until they convert; the React one composes it as a ref while it runs.
- **Shared files** (besides those above): `src/library/svelte.ts`, `src/library/fixtures.ts`, `src/library/parity.ts`, `src/library/parity.test.tsx`, `src/library/storybook.globals.ts`, `src/library/theme.model.ts`, `src/library/svelte/`, `.storybook-svelte/`, `src/library/view/` (`stores.ts`, `reactComponents.ts`, `svelteComponents.ts`, `snapshot.test.ts` and `view.baseline.json` take one line per component from a conversion lane), `src/library/stories/`.
- Checks: `npm run typecheck`, `npx vitest run src/library/view`, `npx vitest run src/library/parity.test.tsx`, `npx vitest run src/library/tiers.test.ts` (it scans `.svelte` too), `npm run build:storybook`, `npm run build:storybook:svelte`, `npm run build:lib`. `.svelte` files aren't type-checked (svelte-check doesn't support TypeScript 7 yet).

## Yahaha redesigns

`src/library/yahaha/` holds only Yahaha's own concepts (the regions, the Stage, and widgets such as OneTouchPicker), one folder per widget, stories under `Yahaha/...`; they build on `components/core`, `components/music` and the layout primitives; `src/library/yahaha/README.md` is the convention, `STAGE.md` the Stage brief, `hues.ts` what colour means. The Svelte originals are in `yahaha/` for reference: read them, never edit them (`npm --prefix yahaha run storybook` serves them if you need to see one). A lane owns whole widget folders; it never edits another lane's folder or the shared files above. Test selectors stay scoped to the widget.

## Ownership

Work on a branch in your own worktree. Changes reach `main` only through a PR. `main` is protected: the `checks` job in `.github/workflows/checks.yml` must pass first. It runs every command in the table above except `npx vitest run src/library`, which `npm test` already covers. A PR that changes only docs (`*.md` anywhere, or `docs/`) skips them and passes at once. Lane leads push their branch but don't open the PR. The orchestrator opens it after review and turns on auto-merge.
