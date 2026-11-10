# Proposal

## Why

Every section of `src/library` is laid out its own way. Some keep all their files flat in one
folder (`layout/`, `primitives/`, `Music/controls`), some give each component a folder
(`components/core`, `Music/live`, `yahaha`), some split into `model/ view/ stories/` (`graph`,
`report`, `openspec`) and one into `model/ components/ layout/ book/` (`compendium`). Screens have
no home, stories sit beside their component in some sections and in a `stories/` folder in others,
and the Storybook sidebar follows none of it. Finding where a thing is, or where a new one goes,
means learning each section separately.

## What Changes

No behaviour changes and no public import changes: the package entries keep their paths and their
exports.

- **One shape for every area.** An area is a folder under `src/library` with up to four tier
  folders: `model/` (no renderer), `components/`, `layouts/`, `screens/`. A large area may hold
  sub-areas of the same shape (`music/live`, `math/trig`).
- **One folder per component.** Inside `components/`, `layouts/` and `screens/` each part is a
  `<Name>/` folder holding its model, renderers, stylesheet, fixtures, stories and tests.
- **The generic tiers sit at the root**: `primitives/`, `components/` (today's `components/core`)
  and `layouts/` (today's `layout`).
- **The shared machinery moves to `foundation/`**: `themes/`, `view/`, `svelte/`, `stories/` and
  the preview catalog. The root keeps only the public entries, the repo-wide checks and what those
  read.
- **The two music families get their own areas.** `components/music` becomes `instrument/` and
  `Music/` becomes `music/`, with its live surface as the sub-area `music/live`. They are rehoused,
  not merged: three names (`Knob`, `Meter`, `Transport`) exist in both and merging them changes
  behaviour, which is a separate change.
- **`view/` becomes `components/`** in `graph`, `report`, `openspec` and `math`, and every
  `stories/` folder is dissolved into the parts its stories show.
- **The sidebar mirrors the path.** A stories file's title starts with its area and tier:
  `Core/Components/Button`, `Music/Live/Screens/DAWs`, `Graph/Screens/Circuit/Samples`. Story ids
  change once, here.
- **A check holds it.** `src/library/structure.test.ts` fails on a folder, file or story title
  outside the rule; `AGENTS.md` and `docs/structure.md` state the rule and where a new thing goes.

## Capabilities

### New Capabilities

- `library-structure`: the folder shape of the library, where each kind of file lives, how the
  sidebar follows it and how the rule is held.

### Modified Capabilities

- (none)

## Impact

- Every file under `src/library` except the root entries moves or has its imports rewritten.
- Path-keyed checks: `tiers.ts` and `tiers.baseline.json`, the bindings-only scanner and
  `view.baseline.json`, `library.test.tsx`, the tree snapshots.
- Story ids and titles in `scripts/`, `docs/`, `.storybook/preview.ts` and the folder READMEs.
- `AGENTS.md`, `docs/tiers.md`, the check table's paths, the `story-spec --dir` scopes.
- Open branches that add files under the old paths must move them; the structure check names each.
- Anything outside this repo that links a zen story by id needs the new id.

## Validation

**Before merging:** `npm run typecheck`; `npm test`; `npm run build:storybook`; `npm run build:lib`
then `npm run check:lib`; every tier count in `tiers.baseline.json` equal to its count before the
move under its new key; the plays of one story group per moved area (`Core/Layouts/Workspace`,
`Music/Live/Screens/DAWs`, `Music/Components`, `Instrument/Components`, `Graph/Screens`, `Math/Trig`,
`Compendium`, `Yahaha/Screens`) in a served Storybook; `story-spec sync --specs --check` reporting
nothing; `openspec validate library-structure --strict`; the PR's required `checks` job.

**While building:** `npm run typecheck` after each area's move.

**Review:** `look`. Afterwards: open the Storybook sidebar and read `docs/structure.md`.
