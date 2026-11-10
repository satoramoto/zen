# Design

## The rule

```
src/library/
  index.ts themes.ts svelte.ts storybook.tsx …   public entries, repo-wide checks and what they read
  foundation/     themes/ view/ svelte/ stories/ preview-catalog/   shared machinery, exempt from the tiers
  primitives/<Name>/
  components/<Name>/
  layouts/<Name>/
  <area>/
    index.ts, README.md, lower-case files          the area's entry, registries, stylesheets, helpers
    model/                                         data and pure functions; no React, no Svelte
    components/<Name>/
    layouts/<Name>/
    screens/<Name>/
    <sub-area>/                                    the same shape again
```

- **Tier of a part.** One interaction or one drawn thing is a component. Something that arranges
  other parts is a layout. Something an app would show whole (a board, a document, a sample of the
  whole area) is a screen. This is `docs/tiers.md` applied to folders.
- **A file named for a component is in that component's folder.** The check reads a capitalised
  file name as a component file. Lower-case helpers may sit at an area's root, in a tier folder or
  in `model/`.
- **Areas are declared.** `structure.ts` lists each area and its sub-areas with its sidebar name.
  A folder that isn't listed fails the check, so a new section is a deliberate one-line change.
- **Stories.** A `*.stories.tsx` sits in a `<Name>/` folder, and its title starts with the area's
  sidebar name and the tier. The generic tiers read `Core/Primitives`, `Core/Components`,
  `Core/Layouts`. `foundation/` is exempt.

## Decisions

- **`instrument/` for the older music parts.** Folding them into `music/components` needs `Knob`,
  `Meter` and `Transport` merged first. A separate area keeps both families whole and names the
  duplication plainly.
- **`music/live` is a sub-area**, not flattened into `music/components`: its panes, the control
  panel and the boards are one surface with their own registry and specs.
- **Math topics are sub-areas** (`math/trig`, `math/fourier`, …), since each already has its own
  model and entry. `math/trig/index.ts`, `math/trig/model/index.ts` and `math/calculator/public.ts`
  keep their paths because the package exports them.
- **Root files stay.** `contract.ts`, `tiers.ts` and the other root files are read by the entries
  and the checks by path and are named throughout the docs; only root folders move to
  `foundation/`.
- **No baseline of exceptions unless one is needed.** If a folder cannot move in this change it is
  listed in `structure.baseline.json` with its count, which may only go down, as the tier rules do.
- **Moves are scripted.** One script holds the old-to-new map, moves with `git mv`, rewrites every
  relative import from the map, then rewrites repo paths, story titles and story ids in scripts and
  docs. The checks find what the script misses. The script is not kept.

## Risks

- **Open branches.** Git follows renames for edited files; files added under an old path fail the
  structure check on rebase with the new path named.
- **Story ids outside the repo.** Unknown links break. The new ids follow from the path, so they
  will not change again.
- **Tier counts.** Each moved folder's count must equal its old one; the baseline is rewritten by
  key and compared, never re-recorded.
