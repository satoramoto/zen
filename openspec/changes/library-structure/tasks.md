# Tasks

## 1. The map and the move

- [ ] 1.1 Write the old-to-new map for every file under `src/library` and review it
- [ ] 1.2 Move the files and rewrite relative imports, repo paths, story titles and story ids
- [ ] 1.3 `npm run typecheck` passes

## 2. The path-keyed checks

- [ ] 2.1 `tiers.ts`, `tiers.baseline.json` and `scripts/tiers.ts` read the new folders; every count equals its old one
- [ ] 2.2 The bindings-only scanner and `view.baseline.json`, `library.test.tsx`, the snapshots and parity tests
- [ ] 2.3 `.storybook/preview.ts` sidebar order, scripts and docs that name story ids or paths

## 3. Holding the rule

- [ ] 3.1 `src/library/structure.ts` and `structure.test.ts`: areas, tiers, part folders, the model tier, story titles
- [ ] 3.2 `docs/structure.md`; `AGENTS.md` and `docs/tiers.md` state the rule and the new paths

## 4. Verify

- [ ] 4.1 `npm test`, `npm run build:storybook`, `npm run build:lib`, `npm run check:lib`
- [ ] 4.2 Plays of one story group per moved area in a served Storybook, both renderers where converted
- [ ] 4.3 `openspec validate library-structure --strict`, `story-spec sync --specs --check`

**Review:** `look`.
