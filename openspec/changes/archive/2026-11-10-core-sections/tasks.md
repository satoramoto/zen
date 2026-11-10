# Tasks

## 1. The move

- [x] 1.1 Move the theme editor's components to `components/`, its model to `foundation/skins/`, its entry to `components/theme-editor.ts`
- [x] 1.2 Move `BringYourOwnApp`, `ThemeInspector` and `PreviewCatalog` to the root `screens/`; retitle the five stories under `Core/`
- [x] 1.3 `npm run typecheck` passes

## 2. The checks

- [x] 2.1 `structure.ts`: `screens` is a root tier, `theme-editor` is not an area
- [x] 2.2 `tiers.ts`, `tiers.baseline.json`, `library.test.tsx` drop `theme-editor`; `view.baseline.json` records the editor's markup
- [x] 2.3 Sidebar order; `AGENTS.md`, `docs/structure.md`, `docs/theme-editor.md`

## 3. Verify

- [x] 3.1 `npm test`, `npm run build:storybook`, `npm run build:lib`, `npm run check:lib`, `npm run build`
- [x] 3.2 Plays of the moved stories in a served Storybook, compared with `main`
- [x] 3.3 `openspec validate core-sections --strict`

**Review:** `look`.
