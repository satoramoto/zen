# Tasks

## 1. The move

- [ ] 1.1 Move `instrument/components/<Name>` to `music/components/<Name>`, the entry to `music/root.ts`, the shared data to `music/model/live.model.ts`; rewrite imports, repo paths, story titles and ids
- [ ] 1.2 Rename the token-drawn `Knob`, `Meter`, `Transport` to `KnobReadout`, `LevelMeter`, `TransportBar` (files, component, props, registry name) and keep the old root names as aliases
- [ ] 1.3 `npm run typecheck` passes

## 2. The checks

- [ ] 2.1 `tiers.ts` scans `music/` and counts `music/live` per part; `tiers.baseline.json` carries every old `instrument` key at its old count and records the toolkit's
- [ ] 2.2 Bindings-only scans `music/`; `music/preview.tsx` is `preview.story.tsx`
- [ ] 2.3 `library.test.tsx` holds `music/` to the contract with `PORT_VOCABULARY` and the test that the list only shrinks
- [ ] 2.4 `structure.ts` no longer declares `instrument`; the sidebar order drops it; the four snapshots record the new names

## 3. The guides

- [ ] 3.1 `AGENTS.md`, `docs/structure.md`, `docs/music.md`, `docs/tiers.md` and the docs naming old paths

## 4. Verify

- [ ] 4.1 `npm test`, `npm run build:storybook`, `npm run build:lib`, `npm run check:lib`, `npm run build`
- [ ] 4.2 Plays of `Music/Components`, `Yahaha/Screens` and `Core/Layouts/Workspace` in a served Storybook, compared with `main`
- [ ] 4.3 `openspec validate merge-music-families --strict`

**Review:** `look`.
