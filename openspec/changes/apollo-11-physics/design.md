# Design

## Starting point

`change/apollo-11-physics` (807262e) holds the earlier run: `model/` (vector2, integrator, gravity,
rocket, earthMoonTransfer, apolloDescent, each with tests), `ApolloDescentSimulator`,
`OrbitSimulator`, `DskyDisplay`, `physics.css` and seven stories. The implementer continues on
that branch rather than starting over.

## Decisions

- **Keep the model layer's shape.** Pure models with no framework, React views over them, as zen's
  other math modules do. vector2, the RK4 integrator and gravity stay as they are unless a
  scenario shows them wrong.
- **Rework the descent against the source.** The guidance step is rewritten from Luminary 099's
  lunar landing guidance equations (the public chrislgarry/Apollo-11 repository), with a code
  comment at each borrowed quantity citing file and line. Where the simulator must simplify (a
  planar model of a three-dimensional descent, the absence of a terrain model), `SOURCES.md` says
  what was simplified and why.
- **An executive, minimally.** A small job scheduler with a fixed capacity per cycle stands in for
  the AGC executive's core sets and VAC areas. Guidance, display and a rendezvous radar load are
  jobs; overflow raises 1202 (no core sets) or 1201 (no VAC areas), restarts, and sheds the
  lowest-priority work. It is a model of the failure's cause, not an AGC emulator.
- **DSKY values come from the source's noun tables**: the nouns the descent programs display,
  their quantities, units and scaling. The current component's layout stays; its contents change.
- **Historical checks are tests.** The nominal descent is checked against a few documented
  Apollo 11 values (the program switches happening in order, a touchdown within the source's
  limits, propellant remaining), with tolerances written next to each check and its source.
- **Scenarios need story-spec in CI.** zen does not depend on story-spec today, and story-spec has
  no remote. The first task group gives story-spec a GitHub repository and adds it to zen as a
  git dependency, so `scenario()` works in zen's CI. This makes story-spec an affected area.
- **No vendoring.** The flight software is cited, never copied into zen.

## Open questions

- Which mission timeline source to cite for the historical checks (the Apollo 11 Flight Journal
  or the mission transcript); either is acceptable if it is named.
