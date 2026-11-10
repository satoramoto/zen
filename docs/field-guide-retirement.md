# Field guide retirement

The six-book field guide has been removed from the root preview and Storybook.
Library exports, the shared test setup and the launcher/port contract are preserved.
The old guide reviews are historical records.

## Browser evidence

`scripts/check-preview-catalog.mjs` runs against an existing managed Storybook
(`STORYBOOK_URL`, default `http://127.0.0.1:6006`). It serves the actual root HTML
on an ephemeral port during the check, closes that server afterward, and passes
its URL to the root scenario. The scenario fetches and renders that document;
the runner also visits the built root page directly.

Before removal, `node scripts/check-preview-catalog.mjs --baseline` recorded
1,395 unrelated catalog entries and confirmed both retirement plays failed.
After removal, `node scripts/check-preview-catalog.mjs` confirms both plays pass,
compares maintained IDs with that baseline and the built Storybook index, and
captures library Button and Claude Code Kit specimens at 1440px and 390px.
The baseline is local evidence, not a newly maintained story inventory; the
removal comparison requires `.shots/remove-field-guide/catalog-before.json`.

Evidence is under `.shots/remove-field-guide/`: `baseline.json`,
`verification.json`, before/after screenshots and `root-390.png`.
The checked specimens retain their layout and theme treatment; the surrounding
preview canvas is now neutral rather than inheriting the guide's cream background.
The narrow root page is readable without horizontal overflow.

## Checks

- `npm ci` refreshed stale dependencies and rebuilt public declarations.
- `npm run typecheck` and `npm run build` passed; the root builds to a static 0.39 kB HTML page.
- `npm test`: 118 files, 1,917 tests passed.
- `npm run check:lib`: five entries respect framework boundaries.
- `npm run build:storybook` and `node scripts/check-preview-catalog.mjs` passed: both retirement plays, the built root, and all 1,395 maintained catalog IDs.
- Same-scope story-spec drift check and strict OpenSpec validation passed.

Sync only this change's scenarios into the shared store (from the Zen checkout):

```sh
NODE_PATH="$PWD/node_modules" npx story-spec sync --change remove-field-guide \
  --root ../zen-flow --dir "$PWD/src/library/screens/PreviewCatalog"
NODE_PATH="$PWD/node_modules" npx story-spec sync --change remove-field-guide \
  --root ../zen-flow --dir "$PWD/src/library/screens/PreviewCatalog" --check
openspec validate remove-field-guide --strict --store zen-flow
```

`NODE_PATH` lets the shared planning root resolve this checkout's Storybook CSF
tools without changing either repository's dependencies or OpenSpec configuration.
