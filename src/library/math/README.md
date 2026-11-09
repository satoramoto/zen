# Math exploration

The **Math** Storybook section presents the React exploration framework:
linked quantities, directly manipulated drawings, shared probes, and explicit mathematical
interpretations. Entries are grouped by component rather than by implementation batch.

| Storybook entry | Component / purpose |
| --- | --- |
| Fourier / Epicycles | `Epicycles`: arrows tip to tail drawing a shape, the count and the drawing chosen |
| Fourier / Heat Modes | `HeatModes`: cosine modes on a rod shrinking at rates that go with n² |
| Fourier / Step Series | `StepSeries`: the step's cosine series cut off after k terms, with a probe's partial sums |
| Fourier / Rotating Vector | `RotatingVector`: one term, c · e^(n·2πi·t), its turns, size and starting angle |
| Fourier / Pair to Sine | `PairToSine`: mirrored arrows turning opposite ways summing to a cosine on the real line |
| Fourier / Coefficient Finder | `CoefficientFinder`: the drawing's average is c₀; spun back n turns, its average is cₙ |
| Trig / Arc Wrap | `ArcWrap`: the radius laid along the arc, so a radian is a length you can see |
| Trig / Right Triangle | `RightTriangle`: drag the free vertex; opposite, adjacent and hypotenuse with the three ratios live |
| Trig / Unit Circle | `UnitCircle`: the point at θ, its legs as sine and cosine, signs by quadrant, reference angle, tangent on request |
| Trig / Wave Graph | `WaveGraph`: A·sin(B(x − C)) + D with brackets, the circle beside it, an inverse mode and a data-fitting mode |
| Trig / Identity Squares | `IdentitySquares`: squares on the legs, sin²θ + cos²θ = 1 as areas |
| Trig / Angle Sum | `AngleSum`: sin(α + β) as two stacked lengths |
| Primes / Boundary Waves | `BoundaryWaves`: prime p as p half-waves between walls, stacked or overlaid; node marks that never meet |
| Primes / Wrapped Waves | `WrappedWaves`: the same waves round a circle, from a few curves to a shaded disc of 100,000 |
| Primes / Ring Field | `RingField`: thousands of prime waves summed by radius, with the pixel grid's own pattern shown for what it is |
| Primes / Gap Spectrum | `GapSpectrum`: prime gaps played as tones, their spectrum beside the gap histogram; the prime indicator's peaks at simple fractions |
| Primes / Box Field | `BoxField`: the waves as standing waves in a square, summed and painted |
| Primes / Field Shape | `FieldShape`: the box field as a 3D surface or wrapped onto a sphere |
| Trig / General Triangle | `GeneralTriangle`: three draggable vertices, the laws of sines and cosines, area, the ambiguous case |
| Physics / Lunar Descent, DSKY | `ApolloDescentSimulator`, `Dsky`, `DescentSources`: Apollo 11's powered descent from Luminary 099 (quadratic guidance, P63 to P64 to P65, P66 on the rate switch), the executive's core sets and VAC areas with 1201/1202 alarms and restarts, and the DSKY's descent nouns; every number cited or marked an approximation in `physics/SOURCES.md` |
| Physics / Translunar | `OrbitSimulator`: the transfer in the Earth-Moon field with a moving Moon (RK4), its Jacobi-integral drift as the stated accuracy, and a free-return trajectory |
| Wave Calculator | `WaveCalculator`: editable linked functions, automatic parameter scrubbing, time and comparison |
| Circle to Sine | `SineExplorer`: linked orbit and wave, guided stops and comparisons |
| Signal Playground | `SignalPlayground`: ten fields and manifolds with linked analysis |
| Solid Sections | `SolidSections`: true plane cuts, holes, disconnected contours and measurements |
| Complex Explorer | `ComplexExplorer`: square, reciprocal and zeta, linked planes and landscapes |
| Complex Series | `ComplexSeries`: phasor sums and finite prime products |
| Prime Counting | `PrimeCounting`: discrete count, approximation and residual |
| Cymatics Explorer | `CymaticsExplorer`: square plates/membranes and drums, nodal patterns and mixtures |
| Standing String | `StandingString`: counter-propagating waves, nodes and local motion |
| Projection Explorer | `ProjectionExplorer`: four linked projections, forced perspective, dolly zoom and anamorphosis |
| Optical Paths | `OpticsExplorer`: finite mirrors, glass, TIR, coatings and pupil rays |
| Spatial Optics | `SpatialOptics`: true 3D ray paths, finite surfaces and an independent inspection camera |
| Stereo Explorer | `StereoExplorer`: binocular disparity, convergence and motion parallax |
| Components / Projection View | `ProjectionView`: clipped wire geometry and invertible probe manipulation |
| Components / Ray Path View | `RayPathView`: finite optical paths, events and normals |
| Components / Stereo Pair | `StereoPair`: shared geometry through parallel cameras |
| Stereo Illusion Lab | `StereoIllusionLab`: visual seat-and-spacing setup, continuous stereograms, motion-depth relief and measured stereo pairs |
| Components / Stereo Tuner | `StereoTuner`: visual sitting-distance, spacing and depth setup |
| Components / Stereogram | `Stereogram`: continuous patterned hidden-depth field |
| Components / Motion Relief | `MotionRelief`: draggable relief point cloud and optional mesh |
| Components / Fusion Targets | `FusionTargets`: complementary crosses and visible depth rings |
| Components / Dot Stereo View | `DotStereoView`: paired random-dot surface rendering with physical image dimensions |
| Components / Display Calibration | `DisplayCalibration`: ruler-based CSS pixel scale |
| Components / Cymatic Field | `CymaticField`: nodal grains, signed displacement and cycle-averaged paint |
| Components / Equation Input | `EquationInput`: editable typeset math, touch keyboard and plain-text fallback |
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

The `fourier/` folder (`model/` pure and tested, plain-SVG figures, `useClock`) is what the
compendium's Fourier textbook draws as its figures (`src/library/compendium/book/fourier/`);
every figure takes its quantities as controlled props with `on<Prop>` callbacks so a page can
bind them, and keeps its own state when the page doesn't.

The `trig/` folder follows the same contract for the trigonometry course
(`src/library/compendium/book/trig/`): `model/` (angles, triangles, waves; pure and tested),
`parts.tsx` (frame, axes, arcs, labels, and a handle dragged by pointer or stepped by the arrow
keys), and seven plain-SVG figures. Hue 1 is sine, hue 2 cosine, hue 3 tangent, hue 4 the angle,
hue 5 a second thing (a second angle or triangle, data).

The `primes/` folder draws primes as waves for the Prime waves chapter
(`src/library/compendium/book/prime-waves/`), after a video that showed such pictures without its
code: `model/` (a sieve, waves in a boundary, the ring and box fields, an FFT and the gap and
indicator spectra; pure and tested), `parts.tsx` (a count slider on round numbers and a `Raster`
that paints a canvas with the contract's colours), and six figures. Each figure says where its
pattern comes from: the arithmetic, the pixel grid, or the shape it is wrapped on.

## Implementation references

- [Calibrated stereo illusions](../../../docs/stereo-illusions.md)
- [Perspective and geometric optics](../../../docs/perspective.md)
- [Editable wave calculator](../../../docs/wave-calculator.md)
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
