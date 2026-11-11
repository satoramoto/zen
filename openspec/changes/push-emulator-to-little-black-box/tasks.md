# Tasks

Three merges in order (design D7). zen's work is on `change/push-emulator-to-little-black-box`;
little-black-box's is on a branch of the same name in
`~/Projects/.worktrees/little-black-box/push-emulator-to-little-black-box`, never in its checkout.

## 1. zen: the view runtime as a public, extensible entry

- [x] 1.1 The component and store registries become maps an app adds to (`registerComponents`, `registerStores`, one per renderer), refusing a taken name; zen's own parts and the Push area register through them; `npx vitest run src/library/foundation/view` passes unchanged
- [x] 1.2 `@satoramoto/zen/view`, `/view/react` and `/view/svelte` entries in `package.json` and `vite.lib.config.ts`, each export with a one-line doc; `npm run build:lib` then `npm run check:lib` pass and `view` imports neither React nor Svelte
- [x] 1.3 `withRenderer`, `treeStory`, `fixtureStories` and `defineFixtures` exported from `@satoramoto/zen/storybook/renderers` (design D2); the lamp table from `@satoramoto/zen/themes`
- [x] 1.4 `@satoramoto/zen/checks`: `checkContract`, `checkTiers` and `checkBindingsOnly` as functions over a folder; zen's own `library.test.tsx`, `tiers.test.ts` and `bindings-only.test.ts` call them and pass with their baselines unchanged
- [x] 1.5 The `library-extension` scenarios as stories with plays (an app part and an app store drawn in both renderers, a taken name refused, the checks on a scratch folder with a literal colour and on a clean one); they pass in both renderers
- [x] 1.6 `npm run typecheck`, `npm test`, `npm run build:storybook`, `build:lib` and `check:lib` pass; pull request merged (merge 1)

## 2. little-black-box: the emulator moves in

- [x] 2.1 Make the worktree (`git worktree add ~/Projects/.worktrees/little-black-box/push-emulator-to-little-black-box -b change/push-emulator-to-little-black-box`); pin zen to merge 1's commit; add `vitest`, `jsdom`, `svelte`, `@sveltejs/vite-plugin-svelte` and `jsqr` as dev dependencies; `npm install` and `npm run typecheck` pass on the untouched repo
- [x] 2.2 Copy `src/library/push/` to `src/push/`, rewrite its imports of zen's insides to the public entries (no other line changes); `npm run typecheck` passes
- [x] 2.3 The Storybook mounts both renderers and the `push-3` pack (`withRenderer`, `withLibraryTheme`); the existing source map pages still render and play (as built: `npm run test:stories`, zen's headless runner, 23 of 23; `check:stories` keeps to the site's pages)
- [ ] 2.4 Move the scripts and `docs/push.md` with `docs/push/`, their paths updated; `node scripts/push-stories.mjs --renderer both` passes every play (972 today). So far: all 486 Push stories pass headless (`npm run test:stories -- Push`, React); with Svelte only the 24 Surface stories have been played
- [x] 2.5 The model's unit tests and the area's tree snapshots run under little-black-box's `vitest`; every test passes and each snapshot file is byte-for-byte zen's
- [x] 2.6 The contract, tier and bindings-only checks run on `src/push/` from a test, through `@satoramoto/zen/checks`, with a baseline of zero; they pass
- [x] 2.7 `openspec/` in little-black-box (local, schema `zen-flow`); `story-spec sync --specs --dir src/push` writes the 17 `push-*` main specs; each matches zen's word for word; `openspec validate --specs --strict` passes
- [x] 2.8 The README names the emulator, how to serve it and its checks; merged as `zen-flow doctor little-black-box --merge-path` says (merge 2), the branch deleted and the worktree removed

## 3. zen: the area leaves

- [ ] 3.1 Remove `src/library/push/`, `Push` from both entries, the area from `structure.ts`, `tiers.ts`, `foundation/view/bindings.ts`, the registries and the snapshot test, and the Push paragraph from `AGENTS.md`; `docs/push.md` replaced by one line pointing at little-black-box; no file under `src/` imports `push/`
- [ ] 3.2 Regenerate this change's REMOVED deltas from the main specs as they are then (they gain `push-3-fidelity`'s requirements once it is archived); `openspec validate push-emulator-to-little-black-box --strict` passes
- [ ] 3.3 `npm run typecheck`, `npm test`, `npm run build`, `npm run build:storybook`, `build:lib` and `check:lib` pass; the `push-3` pack still appears in the theme picker story; CI's `checks` passes; pull request merged after approval (merge 3), branch deleted

## Workflow follow-up

- Archive with `/opsx:archive push-emulator-to-little-black-box`. With `retire_capabilities`, the 17 `push-*` main specs leave zen.
- Review is `approve`: stop at Ready with both repos' pull requests or branches for a look before merges 2 and 3.
