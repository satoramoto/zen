# Proposal

## Why

Three top-level sidebar groups hold very little and are all part of the core: `Theme Editor`
(two components and one screen), `Foundation` (the theme inspector) and `Development` (the
preview catalog). They sit beside the real areas (Music, Graph, Math) and make the sidebar longer
than the library is.

## What Changes

No behaviour changes and no public import changes.

- **The theme editor's parts are core components.** `theme-editor/components/{SkinScope,
  ThemeEditor,ThemePicker,ThemeSettings}` move to `components/<Name>/`; stories become
  `Core/Components/Theme picker` and `Core/Components/Theme editor`. Its entry becomes
  `components/theme-editor.ts`, which the package root still re-exports whole.
- **Skins are foundation.** `theme-editor/model/` (`skin.ts`, `colour.ts`, `persist.ts` and
  their tests) moves to `foundation/skins/`, beside `foundation/themes/`.
- **The core has screens.** A fourth generic tier, `screens/`, sidebar `Core/Screens`, holds
  the three whole views: `BringYourOwnApp` (from the theme editor), `ThemeInspector` (from
  `foundation/inspector`) and `PreviewCatalog` (from `foundation/preview-catalog`).
- **`theme-editor` is no longer an area**, and `foundation/` holds no stories.
- **Checks.** The four theme editor components keep their tier counts (zero) under
  `components/<Name>`. They are React-only, and `components/` is under the bindings-only rule,
  so their markup (192 tags over seven files) is recorded in `view.baseline.json` as
  unconverted components; it was not counted before.

## Capabilities

### New Capabilities

- (none)

### Modified Capabilities

- `library-structure`: the root gains the generic tier `screens`; the sidebar's top level is
  Core, the areas and the harnesses.

## Impact

- 27 files move; `index.ts`, `resolve.ts`, the music theme helpers and one music story have
  imports rewritten.
- `structure.ts`, `tiers.ts`, `tiers.baseline.json`, `library.test.tsx`, `view.baseline.json`,
  `.storybook/preview.ts`.
- `AGENTS.md`, `docs/structure.md`, `docs/theme-editor.md`, `README.md`.
- Story ids under `theme-editor-…`, `foundation-theme-inspector` and
  `development-preview-catalog` change; links from outside the repo need the new ids.

## Validation

**Before merging:** `npm run typecheck`; `npm test`; `npm run build:storybook`; `npm run build:lib`
then `npm run check:lib`; `npm run build`; the plays of `Core/Components/Theme picker`,
`Core/Components/Theme editor`, `Core/Screens` and `Music/Screens/Theme` in a served Storybook,
with no failure that `main` does not have; the served sidebar's top level showing no
`Theme Editor`, `Foundation` or `Development`; `openspec validate core-sections --strict`; the
PR's required `checks` job.

**Review:** `look`. Afterwards: open `Core` in the sidebar.
