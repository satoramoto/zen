# Apollo 11 in the physics module

## Why

An earlier run left a physics module half-built in zen's main checkout: pure models (vectors, an
RK4 integrator, Earth-Moon gravity, rocket mass and attitude, a translunar transfer, and the
Lunar Module's powered descent through P63, P64 and P66), two simulators, a DSKY display and
seven stories. It is kept on `change/apollo-11-physics` (807262e). Its 18 model tests, zen's
library rules and the typecheck pass, but it is only *inspired* by Apollo 11: nothing cites the
flight software, the guidance law is named rather than traced, the 1202 alarm is a test button
rather than the executive overload that raised it, and no story is a scenario, so nothing in
Storybook says what it does. The Apollo 11 guidance computer source (Luminary 099 for the LM,
Comanche 055 for the CM) is public; the module should be grounded in it and verifiable.

## What Changes

- Take over the run on `change/apollo-11-physics`: keep what holds up, rework what does not.
- Ground the descent in Luminary 099: the guidance equations, the program sequence and its
  switching (P63 braking, P64 approach at high gate, P66 rate of descent), and the constants,
  each with a citation to the source file and line it comes from, or marked as an approximation
  with the reason.
- Model the 1202 alarm as the executive overload it was (more work scheduled than the computer
  could run, with the restart that shed it), so it happens because of load, not only on demand.
- The DSKY shows what the crew saw: the program, verb and noun the descent programs displayed,
  and the registers those nouns define, with the key-release and proceed interactions that
  matter during descent.
- The translunar transfer keeps its RK4 Earth-Moon model and shows a free-return trajectory,
  with its accuracy stated and tested.
- Every requirement gets scenario stories (story-spec `scenario()`, one When and one Then), so
  the stories are the spec and the autodocs are the manual.
- A `SOURCES.md` in the module lists every citation and approximation in one place.

## Capabilities

### New Capabilities
- `physics-lunar-descent`: the Lunar Module's powered descent from the start of braking to
  touchdown, as Luminary 099 guided it, including its program switches and the 1202 overload.
- `physics-dsky`: the display and keyboard the crew read and keyed during descent.
- `physics-translunar`: the Earth-Moon transfer and its free-return trajectory.

### Modified Capabilities

## Impact

- zen: `src/library/math/physics/` (models, simulators, DSKY, stories, `SOURCES.md`), exports in
  `src/library/math/index.ts`, its row in `src/library/math/README.md`.
- story-spec: gets a GitHub repository so zen can depend on it in CI; zen gains it as a git
  dependency, its only new dependency. The flight software is read, not vendored: citations
  point at the public source by file and line.

## Validation

**Before merging:** in zen, `npm run typecheck`, `npm test` (the models' tests, including the
historical checks the design names), `npm run build:storybook`, every physics scenario play
passing in Storybook, `openspec validate apollo-11-physics --strict`, and zen's required `checks`
on the pull request.

**While building:** this is a large change in three capabilities; run
`npx vitest run src/library/math/physics` after each task group so the models stay right as they
are reworked, and the physics stories' plays once they exist.

**Review:** `look`: once merged, play the descent in Storybook from braking to touchdown, raise
a 1202 under load, and read `SOURCES.md`.
