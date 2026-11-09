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

## Resolved while building

- **Timeline source:** NASA SP-4029, the Apollo by the Numbers mission timeline (ignition
  102:33:05, the alarms, P64, P66 and touchdown), named as `TIMELINE_SOURCE` in
  `model/sources.ts` and in `SOURCES.md`.
- **The translunar accuracy measure** is the Jacobi integral, not the energy: with a moving Moon
  the energy in the Earth's frame is not conserved, but the Jacobi integral is in the frame
  turning with the Moon, so its drift is the integrator's error. The bounds are 1e-5 for the
  default transfer at a 30 s step and 1e-4 for the free return at 60 s.
- **Known deviations** from the flight, written down in `SOURCES.md`: the model throttles down
  at about 200 s (the flight at 386 s), and its alarms are all 1202 (the flight had one 1201).
