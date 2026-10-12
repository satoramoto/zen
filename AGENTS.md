# AGENTS.md

Zen: React + TypeScript (TSX), Vite, Vitest, Storybook. Two things live here:

- **The field guide**: six books, eighteen principle demonstrations (`src/catalog.ts`, `src/PrincipleExample.tsx`, `src/App.tsx`, `src/stories/`).
- **The design OS**: a token contract with mixable theme facets (`src/library/`), and the Yahaha app redesigned on it (`src/library/yahaha/`). `docs/design-os-handoff.md` explains the ideas and where the work stands.

## Preview

Use only the unified launcher:

```sh
PREVIEW_LABEL="Zen" PREVIEW_PORT=4191 STORYBOOK_PORT=6021 YAHAHA_STORYBOOK_PORT=6022 npm run dev
```

It starts the app, the main Storybook (field guide and library) and the Yahaha Storybook (`.storybook-yahaha/`, only `src/library/yahaha/`), and stops them together. If one child fails, stop and restart the whole launcher group; don't start a replacement child on its own. Never stop unrelated processes or use occupied ports. Give each isolated worktree its own ports.

## Checks

Each must exit 0. Run the narrowest one that covers your change. CI on the PR runs the rest, so don't run the whole set locally.

| Command | When |
|---|---|
| `npm run typecheck` | Any TS/TSX change. Fast compile check. |
| `npx vitest run src/library` | Library tokens, themes, components, screens, or anything under `src/library/yahaha/`. |
| `npm test` | Anything else under `src/` (it includes the above). |
| `npm run build` | The field guide app. |
| `npm run build:storybook` | Field guide or library stories, `.storybook/`. |
| `npm run build:storybook:yahaha` | Yahaha stories, `.storybook-yahaha/`. |

Builds and unit tests are not browser evidence: look at layout and perceptual effects in a browser (the invisible-keyboard bug passed every test).

## Field guide quality

- Preserve all eighteen stable example IDs and their source references.
- Keep comparisons honest: state which variables change and what stays fixed.
- Book summaries are paraphrases. Publisher descriptions support topic alignment, not exact full-text fidelity.
- Storybook Controls must affect the specimen. Canvas interactions must work in both the app and Storybook.
- Validate at narrow widths. Sliders must change the actual drawing, not just the displayed number.
- Review conceptual fidelity separately from interaction and layout checks.

## Library rules

- Components in `src/library/components`, `src/library/screens` and `src/library/yahaha` read only the variables produced by `toCssVars()` in `src/library/contract.ts` (plus local ones they declare). No literal colours or radii, no `light-dark()`; `library.test.tsx` enforces this.
- Colour, type, shape and spacing values live only in `src/library/themes/` (one file per facet). Mark any value the source style doesn't define with `// added`.
- A theme pack (`themes/packs.ts`) names its Refero style id and the source rules it keeps.
- Shared files: `contract.ts`, `themes/`, `storybook.tsx`, `.storybook/`, `.storybook-yahaha/`, `library.test.tsx`, `components/index.tsx`, `library.css`, `yahaha/hues.ts`, `yahaha/STAGE.md`. Change them in their own small commit first.

## Yahaha redesigns

`src/library/yahaha/` holds the Yahaha widgets redesigned on the library, one folder per widget; `src/library/yahaha/README.md` is the convention, `STAGE.md` the Stage brief, `hues.ts` what colour means. The Svelte originals are in `yahaha/` for reference: read them, never edit them (`npm --prefix yahaha run storybook` serves them if you need to see one). A lane owns whole widget folders; it never edits another lane's folder or the shared files above. Test selectors stay scoped to the widget.

## Ownership

Work on a branch in your own worktree. Changes reach `main` only through a PR. `main` is protected: the `checks` job in `.github/workflows/checks.yml` must pass first. It runs every command in the table above except `npx vitest run src/library`, which `npm test` already covers. Lane leads push their branch but don't open the PR. The orchestrator opens it after review and turns on auto-merge.
