# Proposal

## Why

The Push 3 emulator is a model of one device, its layouts and its 486 scenario stories. zen is a
design system that any app consumes, so it is the wrong home for an emulator. `little-black-box`
(`~/Projects/ryangavin/little-black-box`) is the research project into the unit's own software,
and that is where the emulator belongs. Moving it leaves zen with the generic parts the emulator
taught it, gives the emulator a home where it can grow toward the unit, and lets zen release
without carrying 17 capabilities that only one app reads.

## What Changes

**Into little-black-box** (the emulator, unchanged in behaviour):

- The whole of `src/library/push/`: the device model (`model/`), the layouts (`Surface`,
  `Display`, `Device`, `RearPanel`), the `Trace` component, the screens with their 486 stories
  and plays, the registries, and the area's entries. It goes under `src/push/` in
  little-black-box, with the same folder shape.
- `docs/push.md` and `docs/push/`, and the scripts that serve the area
  (`scripts/push-stories.ts`, `scripts/push-stories.mjs`).
- The 17 `push-*` capabilities, as little-black-box's own main specs. They are written there by
  `story-spec sync --specs` from the moved stories, so they are the same requirements.
- The checks that hold the area: its unit tests, the story run in both renderers, its tree
  snapshots, and the contract, tier and bindings-only rules run over its folder.

**Staying in zen** (shared, and used by the emulator through zen's public entries):

- The `push-3` theme pack, its palette, face and material, and the lamp colour table
  (`foundation/themes/lamps.ts`). Every pack is zen's, and any app may wear this one.
- `CodeImage`, `KnobReadout`'s `origin`, `PianoRoll`'s note `level`, and every other component
  the emulator draws.
- The view-tree runtime the emulator is built on: `Tree` for each renderer, `h`/`component`/
  `wire`, the component and store registries, `textNode`/`iconNode`, `withRenderer` and
  `treeStory`, and `defineFixtures`. These are made public (below).
- The Yahaha Stage's exception for the `push-3` pack, which is about the pack and not the device.

**New in zen**, so that an emulator outside zen can be built the zen way:

- A public entry for the view-tree runtime, for each renderer, with a way for an app to register
  its own parts and stores by name, so a model's `component('PushDisplay', …)` resolves to the
  app's part in both renderers.
- The library's rule checks as functions over any folder: the contract check (no literal colours
  or radii), the tier rules, and the bindings-only rule, so little-black-box can run them on
  `src/push/`.
- The lamp table exported from `@satoramoto/zen/themes`.

**Removed from zen**: the `push` area, `Push` from both package entries, the area's lines in
`structure.ts`, the tier and bindings scans, the snapshot test and `AGENTS.md`, and the 17
`push-*` main specs. **BREAKING**: an app that imports `Push` from `@satoramoto/zen` imports
from little-black-box instead. Nothing in the satoramoto family does today.

Not in this change: anything new in the emulator itself, sound or MIDI, publishing
little-black-box as a package, or touching its research tools and records.

## Capabilities

### New Capabilities

- `library-extension`: an app adds its own view-tree parts and stores to zen's runtime, and runs
  zen's rule checks on its own folders.

### Modified Capabilities

All 17 `push-*` capabilities leave zen: every requirement of `push-browser`, `push-clip-view`,
`push-device-model`, `push-device-view`, `push-display`, `push-drum-mode`, `push-encoders`,
`push-mix-view`, `push-note-mode`, `push-pads`, `push-recording`, `push-sampling`,
`push-session`, `push-setup`, `push-step-sequencing`, `push-surface` and `push-theme` is removed
here, with little-black-box's main specs as their migration. The change retires those
capabilities (`retire_capabilities`).

## Impact

- **zen**: `src/library/push/` removed; `src/library/index.ts`, `svelte.ts`, `structure.ts`,
  `tiers.ts`, `foundation/view/` (bindings list, registries, snapshot test), `library.test.tsx`;
  new public entries in `package.json` and `vite.lib.config.ts`; `AGENTS.md`; `docs/`;
  `openspec/specs/push-*` removed.
- **little-black-box**: a new `src/push/` and its Storybook section beside the source map
  site's pages; `vitest`, `svelte` and the Svelte Vite plugin as dev dependencies; zen pinned
  to the commit that has the new entries; an `openspec/` root of its own (the repo has none).
  Its research tools, records and site are untouched. Work there happens in
  `~/Projects/.worktrees/little-black-box/push-emulator-to-little-black-box`, because another
  branch and uncommitted files are live in its checkout.
- **Order**: zen's new entries merge first; little-black-box pins that commit and takes the
  emulator; zen removes the area last, so neither repo is without the emulator at any commit.

## Validation

**Before merging:**

- zen, before the removal: `npm run typecheck`, `npm test`, `npm run build:lib` then
  `npm run check:lib`, and the new `library-extension` scenarios play.
- little-black-box: `npm run typecheck`; the model's unit tests (259 today) pass under its
  `vitest`; every Push story plays in both renderers (972 plays today); the contract, tier and
  bindings-only checks pass on `src/push/`; `npm run build:storybook` and
  `npm run check:stories` (its existing pages still render and play);
  `story-spec sync --specs --dir src/push --check` reports nothing; `openspec validate --specs
  --strict` passes; the tree snapshots are byte-for-byte the ones zen had.
- zen, after the removal: `npm run typecheck`, `npm test`, `npm run build`,
  `npm run build:storybook`, `npm run build:lib` then `check:lib`, no file under `src/` imports
  `push/`, and `openspec validate push-emulator-to-little-black-box --strict` passes.
- CI's `checks` job on each zen pull request.

**While building:** after each task group, the typecheck and the unit tests of the repo it
touched, and the Push story run once the stories are in little-black-box.

**Review:** `approve`. The change moves work between two repos and adds an OpenSpec root to one
that has none; it stops at Ready for a look at both before anything merges.
