# Math exploration

The **Design OS / Math** Storybook section presents the React exploration framework:
linked quantities, directly manipulated drawings, shared probes, and explicit mathematical
interpretations. Entries are grouped by component rather than by implementation batch.

| Storybook entry | Component / purpose |
| --- | --- |
| Circle to Sine | `SineExplorer`: linked orbit and wave, guided stops and comparisons |
| Signal Playground | `SignalPlayground`: ten fields and manifolds with linked analysis |
| Solid Sections | `SolidSections`: true plane cuts, holes, disconnected contours and measurements |
| Complex Explorer | `ComplexExplorer`: square, reciprocal and zeta, linked planes and landscapes |
| Complex Series | `ComplexSeries`: phasor sums and finite prime products |
| Prime Counting | `PrimeCounting`: discrete count, approximation and residual |
| Cymatics Explorer | `CymaticsExplorer`: square plates/membranes and drums, nodal patterns and mixtures |
| Standing String | `StandingString`: counter-propagating waves, nodes and local motion |
| Components / Cymatic Field | `CymaticField`: nodal grains, signed displacement and cycle-averaged paint |
| Components / Mesh View | `MeshView`: sampled mesh, clipping plane and native manipulation handles |
| Components / Signal Surface | `SignalSurface`: field/manifold rendering, sections and scalar colors |
| Components / Cross Section | `CrossSection`: linked map, trace, probe and sampled statistics |
| Components / Drag Point | `DragPoint`: accessible free and constrained direct manipulation |

Component stories carry their own Controls. Stateful story specimens supply the controlled
values and callbacks, while the real components perform the drawing and interactions.
Behavior stories remain beside the component they exercise. Circle to Sine has no extra
Relationships grouping. The former Signals & Spaces and Solid & Complex collection names
are replaced by component names; browser scripts and documentation use the new story IDs.

The older ExactValue, ExpressionField, PlotViewport, MathInspector and DistributionPlot
stories and the Spatial Studio acceptance demo have been removed from this catalogue.
Their production components, public React/Svelte exports, models, fixtures and tests remain
available for compatibility. This cleanup does not remove a package API.

## Implementation references

- [Circle-to-sine exploration](../../../docs/math-exploration.md)
- [Signals, sections and scalar paint](../../../docs/signal-playground.md)
- [Cymatics and standing waves](../../../docs/cymatics.md)
- [Solid cuts and complex functions](../../../docs/solid-complex-playground.md)

Keep new stories next to the component they document. Add a complete mathematical scene to
its corresponding explorer; add a reusable drawing or interaction specimen to Components.
Avoid a new navigation folder just for a single relationship.

## Verification

Use the unified preview launcher, with free ports for an isolated worktree. Build Storybook
and run `node scripts/math-catalog.mjs` against its preview (default port 6027) to verify the
navigation inventory, moved behavior stories, isolated components and a narrow layout.
The focused `math-stories.mjs`, `signal-stories.mjs`, `signal-analysis.mjs` and
`lab-stories.mjs` runners use the same updated story IDs.
