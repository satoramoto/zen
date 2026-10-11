# AGENTS.md

## Checks

Run the narrowest one that covers your change; CI-equivalent is all four.

| Command | When |
|---|---|
| `npm run typecheck` | Any TS/TSX change. Fast compile check. |
| `npx vitest run src/library` | Library tokens, themes, components or screens. |
| `npm test` | Anything else under `src/`. |
| `npm run build:storybook` | Stories, `.storybook/`, or CSS you want to see rendered. |

## Library rules

- Components in `src/library/components` and `src/library/screens` read only the variables produced by `toCssVars()` in `src/library/contract.ts` (plus local ones they declare). No literal colours or radii; `library.test.tsx` enforces this.
- Colour, type, shape and spacing values live only in `src/library/themes/` (one file per facet). Mark any value the source style doesn't define with `// added`.
- A theme pack (`themes/packs.ts`) names its Refero style id and the source rules it keeps.
- Shared files every lane touches: `contract.ts`, `themes/packs.ts`, `storybook.tsx`, `.storybook/preview.ts`, `library.test.tsx`, `components/index.tsx`, `library.css`. Change them in their own small PR first.

## Yahaha redesigns

`src/library/yahaha/` holds the Yahaha widgets redesigned on the library, one folder per widget; `src/library/yahaha/README.md` is the convention (files, story titles, what each redesign records). The originals are in `yahaha/` (Svelte, composed into Storybook as "Yahaha baseline"): read them, never edit them. A lane owns whole widget folders; it never edits another lane's folder or the shared files above.

| Command | When |
|---|---|
| `npm --prefix yahaha run check` | Only if `yahaha/` changed (it shouldn't). |
