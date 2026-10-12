# AGENTS.md

Zen: React + TypeScript (TSX), Vite, Vitest, Storybook. Two things live here:

- **The field guide**: six books, eighteen principle demonstrations (`src/catalog.ts`, `src/PrincipleExample.tsx`, `src/App.tsx`, `src/stories/`).
- **The design OS**: a token contract with mixable theme facets (`src/library/`), and the Yahaha app redesigned on it (`src/library/yahaha/`). `docs/design-os-handoff.md` explains the ideas and where the work stands.

## Preview

Use only the unified launcher:

```sh
PREVIEW_LABEL="Zen" PREVIEW_PORT=4191 STORYBOOK_PORT=6022 npm run dev
```

It starts the app and the one Storybook (`.storybook/`: the field guide, the library and the Yahaha redesigns), and stops them together. If one child fails, stop and restart the whole launcher group; don't start a replacement child on its own. Never stop unrelated processes or use occupied ports. Give each isolated worktree its own ports.

## Checks

Each must exit 0. Run the narrowest one that covers your change. CI on the PR runs the rest, so don't run the whole set locally.

| Command | When |
|---|---|
| `npm run typecheck` | Any TS/TSX change. Fast compile check. |
| `npx vitest run src/library` | Library tokens, themes, layout, components, or anything under `src/library/yahaha/` or `src/library/visuals/`. |
| `npx vitest run src/library/tiers.test.ts` | Any CSS or TSX under `src/library/{components,layout,yahaha,visuals,primitives}`: the tier rules hold their baseline (`npm run tiers` prints the table; `npm run tiers -- --write` records a lower one). |
| `npm test` | Anything else under `src/` (it includes the above). |
| `npm run build` | The field guide app. |
| `npm run build:storybook` | Any stories (field guide, library, Yahaha), `.storybook/`. |
| `npm run build:lib` | The package: `src/library/index.ts`, `src/library/visuals/index.ts`, `vite.lib.config.ts`, `tsconfig.lib.json`, `package.json` exports. |
| `npm run build:lib` | Anything exported from the library (`src/library/index.ts` and what it reaches), `vite.lib.config.ts`, `tsconfig.lib.json`. |

Builds and unit tests are not browser evidence: look at layout and perceptual effects in a browser (the invisible-keyboard bug passed every test).

## Field guide quality

- Preserve all eighteen stable example IDs and their source references.
- Keep comparisons honest: state which variables change and what stays fixed.
- Book summaries are paraphrases. Publisher descriptions support topic alignment, not exact full-text fidelity.
- Storybook Controls must affect the specimen. Canvas interactions must work in both the app and Storybook.
- Validate at narrow widths. Sliders must change the actual drawing, not just the displayed number.
- Review conceptual fidelity separately from interaction and layout checks.

## Library rules

- Apps consume zen from GitHub: `"@satoramoto/zen": "github:satoramoto/zen#<sha>"`; npm runs `prepare` (`build:lib`) on install, then `import { ThemeScope } from '@satoramoto/zen'` and `import '@satoramoto/zen/zen.css'`. The public surface is `src/library/index.ts`.

- Every decision belongs to one tier (tokens, primitives, controls, groups, regions, screens, app): `docs/tiers.md` says which, and `src/library/tiers.test.ts` holds its four rules to `tiers.baseline.json` (counts only go down).
- Components in `src/library/components`, `src/library/layout`, `src/library/yahaha` and `src/library/visuals` (except `visuals/model`) read only the variables produced by `toCssVars()` in `src/library/contract.ts` (plus local ones they declare). No literal colours or radii, no `light-dark()`; `library.test.tsx` enforces this.
- Generic components live in `src/library/components/core/<Name>/` (controls) and `src/library/components/music/<Name>/` (instrument parts), each exported from that folder's `index.ts`, stories titled `Design OS/Components/Core|Music/<Name>`. They carry no app meaning: colour is a slot (`hue` 1–4, `role-1`/`role-2`; `components/core/hue.ts`), and an app maps its meanings onto it (Yahaha in `yahaha/hues.ts`). Never import `yahaha/` from them.
- Colour, type, shape and spacing values live only in `src/library/themes/` (one file per facet). Mark any value the source style doesn't define with `// added`.
- A theme pack (`themes/packs.ts`) names its Refero style id and the source rules it keeps.
- Shared files: `contract.ts`, `themes/`, `storybook.tsx`, `.storybook/`, `library.test.tsx`, `index.ts`, `visuals/index.ts`, `components/core/index.ts`, `components/music/index.ts`, `library.css`, `yahaha/hues.ts`, `yahaha/STAGE.md`. Change them in their own small commit first.

## Yahaha redesigns

`src/library/yahaha/` holds only Yahaha's own concepts (the regions, the Stage, and widgets such as OneTouchPicker), one folder per widget, stories under `Yahaha/...`; they build on `components/core`, `components/music` and the layout primitives; `src/library/yahaha/README.md` is the convention, `STAGE.md` the Stage brief, `hues.ts` what colour means. The Svelte originals are in `yahaha/` for reference: read them, never edit them (`npm --prefix yahaha run storybook` serves them if you need to see one). A lane owns whole widget folders; it never edits another lane's folder or the shared files above. Test selectors stay scoped to the widget.

## Ownership

Work on a branch in your own worktree. Changes reach `main` only through a PR. `main` is protected: the `checks` job in `.github/workflows/checks.yml` must pass first. It runs every command in the table above except `npx vitest run src/library`, which `npm test` already covers. Lane leads push their branch but don't open the PR. The orchestrator opens it after review and turns on auto-merge.
