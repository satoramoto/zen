# Signals & Spaces

Ten React-only, interactive examples under **Math / Signal Playground**.
`SignalPlayground` is exported from `@satoramoto/zen`. The picker mounts only the selected
scene, so a gallery never keeps ten WebGL contexts alive.

| Story | Relationship | Direct experiments |
| --- | --- | --- |
| Traveling Wave | A plane wave and its spatial slice | Rotate propagation; shorten wavelength |
| Interference | Two radial sources superpose | Reinforce, cancel coincident sources, separate sources |
| Standing Wave | Counter-propagating waves make stationary nodes | Remove reflection; equalize amplitudes |
| Fourier Synthesis | Odd harmonics build sharp transitions | Add harmonics; change spectral rolloff |
| Beats | Nearby frequencies produce an envelope | Fix or move the envelope; change beat spacing |
| Amplitude Modulation | A slow envelope multiplies a carrier | Remove modulation; cross the overmodulation threshold |
| Dispersion | Spectral phase curvature spreads a packet | Remove dispersion; broaden the spectrum |
| Phase Torus | Two oscillator phases form S¹ × S¹ | Rational versus irrational frequency ratio |
| Spherical Mode | A real degree-2 mode deforms a sphere | Adjust radial displacement; rotate azimuthal phase |
| Four Dimensional Projection | A Clifford torus in R⁴ projects into R³ | Rotate in two 4D planes; compare with 3D camera orbit |

The last example is a **2D manifold embedded in 4D**, not a four-dimensional manifold.
Projection can introduce apparent intersections. The phase torus and sphere are also 2D
manifolds, embedded in 3D. Each scene includes a visible dimensional description and an
expandable statement of its model assumptions.

## Interaction

- Drag the surface to orbit the camera; use the camera buttons for reproducible views.
- Drag the control-pad point to change both named mathematical quantities. Arrow keys also
  work. Fine adjustments reveal separately labeled, keyboard-accessible range controls.
- Experiments change quantities and reset time to zero, then explain what to notice.
- Playback and time scrubbing share the same state as both renderers. Playback starts paused,
  stops at 20, and pauses when the tab or scene leaves view. The 4D projection is static in
  time and exposes geometry rotations instead of a nonfunctional Play control.
- The hue-2 section and probe link the surface to a parameter/plan map and an unfolded trace.
  Choose Along x / Along z for fields, or Along u / Along v for manifolds. Drag the map to move
  the fixed coordinate and probe together; drag the trace point to inspect a value. Sliders
  provide precise keyboard access. Fields display a translucent cutting plane. Manifold
  sections are coordinate curves, explicitly distinguished from planar intersections.
- Fields plot amplitude; the sphere plots radial displacement; tori plot displayed 3D height.
  The probe reports that same scalar. Minimum, maximum and RMS are estimates from 513 uniform
  samples of the displayed interval, not symbolic extrema or total energy.
- Pin 2D comparison freezes the section's mathematical state, time and fixed coordinate.
  The dashed trace labels that snapshot. Changing direction clears it to avoid comparing
  differently parameterized axes. The separate torus oscillator histories remain live.
- Solid paint retains shaded geometry. Signed value uses a diverging gradient; Magnitude
  uses absolute value (not energy). Fixed scales are ±1.5 for fields, ±0.45 for spherical
  displacement, ±0.35 for torus height, and ±√2 for projected 4D torus height. They never
  renormalize during playback. A labeled gradient key shows the encoding, and the probe
  provides a numeric reading independent of color. Colors come from Zen's theme tokens.

All quantities and time are dimensionless. These are bounded analytic demonstrations, not
physical simulation engines, symbolic solvers, FFT-based PDE solvers, or audio processors.

## Implementation

`src/library/math/signals/signals.ts` owns the formulas, geometry, parameter bounds, narrative
and experiment definitions. It imports no renderer. `SignalPlayground.tsx` owns controlled
state, transport, the Mafs pad and linked plots. `SignalSurface.tsx` lazily imports MathBox,
Three.js and OrbitControls, and owns the renderer lifecycle.

MathBox 2.3.2-rc1 uses APIs removed from current Three.js, so Three is pinned to its supported
0.139.2 family (matching type package 0.139.0). Do not independently upgrade Three without
running the GPU browser checks. MathBox and Three load in separate lazy chunks. The Svelte
and themes package entries remain React-free.

The MathBox loop is disabled. State updates, camera changes, resize and theme changes
invalidate rendering. Samplers read the current React-owned state without rebuilding the
scene. Resize/intersection/mutation observers, controls, geometry and renderer resources are
cleaned up on unmount. No animation auto-starts. Theme paint is resolved from Zen's token
contract, including light/dark and pack changes. If WebGL is unavailable, the 2D chart and
controls remain usable and the 3D view displays its unavailable state.

## Verification

Start the unified preview in an isolated worktree on free ports:

```sh
PREVIEW_LABEL="Zen Signals" PREVIEW_PORT=4197 STORYBOOK_PORT=6027 npm run dev
```

Open `/iframe.html?id=math-signal-playground--interference&viewMode=story` on Storybook.
The two additional behavior stories are Explore Interference and Switch Dimensions.

```sh
npm run typecheck
npx vitest run src/library
npm run build:lib
npm run check:lib
npm run build:storybook
MATH_PREVIEW_URL=http://127.0.0.1:6027 node scripts/signal-stories.mjs
MATH_PREVIEW_URL=http://127.0.0.1:6027 node scripts/signal-analysis.mjs
```

The browser runner checks all ten actual WebGL outputs for pixel changes after mathematical
experiments, drags the parameter pad, changes camera views, exercises playback, runs both
Storybook plays, and captures desktop and narrow light/dark layouts. Pure model tests check
interference cancellation, fixed standing-wave nodes, nondispersive packet translation,
rational torus closure, bounded finite geometry, and the reference sphere.

The analysis runner exercises signed/magnitude GPU paint, both cut directions, direct map and trace
dragging, frozen comparisons, the cross-section story play, and 390px layout across field, sphere
and torus examples. Pure analysis tests check cut coordinates, cancellation RMS, spherical
displacement and fixed signed/magnitude normalization.
