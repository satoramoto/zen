# Tasks

## 1. story-spec reachable from zen

- [ ] 1.1 story-spec gets a GitHub repository (satoramoto/story-spec) and zen depends on it as a git dependency; a scenario story in zen builds in `npm run build:storybook` and runs its play

## 2. The model, grounded

- [ ] 2.1 Continue on `change/apollo-11-physics`; rewrite the descent guidance from Luminary 099 with a citation at each borrowed quantity; `SOURCES.md` lists citations and approximations
- [ ] 2.2 Program switching P63, P64, P66 from the source's criteria; tests for each switch
- [ ] 2.3 The executive model: capacity, jobs, 1201/1202 on overflow, restart and shedding; tests for overload and recovery
- [ ] 2.4 Historical checks for the nominal descent with their tolerances and sources
- [ ] 2.5 Translunar: the energy-drift bound and a free-return trajectory, with tests
- [ ] 2.6 While building: `npx vitest run src/library/math/physics` passes

## 3. Views and scenarios

- [ ] 3.1 The DSKY shows the descent nouns from the source's tables, lamps, KEY REL and PRO
- [ ] 3.2 Scenario stories (story-spec `scenario()`) for every scenario in the three capabilities, replacing the seven unstructured stories; `story-spec sync --change apollo-11-physics --check` reports nothing
- [ ] 3.3 The module's row in `math/README.md` and its exports in `math/index.ts`

## 4. Merge

- [ ] 4.1 In zen, `npm run typecheck`, `npm test`, `npm run build:storybook` and every physics play pass; `openspec validate apollo-11-physics --strict` passes; the pull request merges itself when `checks` passes; branch deleted
