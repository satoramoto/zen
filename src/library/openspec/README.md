# OpenSpec: a root drawn in Storybook

`src/library/openspec/` reads an [OpenSpec](https://github.com/Fission-AI/OpenSpec) root from its
files and draws its specs and changes as documents. Stories are under a top-level **Openspec**
section: `Openspec/Components/Repo` (a whole root, with the overview), `Openspec/Components/Spec`, `Openspec/Components/Change`.

The area is React-only and not yet exported from the package (`index.ts` is its own entry).

## Folders

| Folder | What's in it |
| --- | --- |
| `model/` | No React. `markdown.ts` (the slice of Markdown the artifacts use, to blocks), `spec.ts` (a spec's requirements, scenarios and steps; a delta's ADDED, MODIFIED, REMOVED and RENAMED requirements; `applyDelta`), `change.ts` (proposal, design, tasks with progress, deltas, `skip_specs`), `repo.ts` (`readRepo(files)`: config, specs, active changes, archive; `summarize`, `touched`). Unit tests over the sample. |
| `view/<Name>/` | `Markdown`, `Spec` (with `RequirementView`, `ScenarioView`, `Badge`), `Change` (with `DeltaView`, `Tasks`, `Progress`), `Repo` (side list, overview, open item). One stylesheet, `openspec.css`, contract variables only. |
| `fixtures/sample.ts` | A synthetic root as files: two specs, an active change with partial tasks and every delta kind, a tooling change that skips specs, an archived change. |
| `stories/zen.ts` | This project's own `openspec/` folder, read at build time with `import.meta.glob`, keyed by path relative to the root. |

## Reading a root

`readRepo(files)` takes `Record<path, contents>` with paths relative to the root
(`config.yaml`, `specs/<capability>/spec.md`, `changes/<name>/proposal.md`, `changes/archive/<date>-<name>/…`).
Nothing touches a filesystem: a story globs the folder, an app can fetch it, a test can write it inline.

## Dogfood

This project is an OpenSpec project (`openspec/`, schema `zen-flow`, the family's fork of
`spec-driven` that asks each change how it will be shown to work). The viewer's own spec is
`openspec/specs/openspec-viewer/spec.md`, written as the change `openspec-stories`, validated with
`openspec validate --strict` and archived with `openspec archive`; the `Openspec/Components/Repo` story named
**Zen** draws it. New work here should go the same way: propose, spec, build, archive, and the
stories show it.

## Checks

`npx vitest run src/library/openspec` for the model; `npm run typecheck`; `npm run build:storybook`
and `node scripts/openspec-stories.mjs <storybook url>` for every Openspec play in headless
Chromium with screenshots; the library rules in `src/library/library.test.tsx` cover the CSS and TSX.
