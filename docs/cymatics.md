# Cymatics and standing waves

React-only components under **Math / Cymatics Explorer**, **Standing String**,
and **Components / Cymatic Field**. Exported from the normal package entry. They use the
existing MeshView and DragPoint components; no new rendering dependency or audio engine.

## Surface models

- Square membrane: fixed edges, uniformly tensioned, sine-product modes. Relative frequency
  √((m²+n²)/2). The swapped (n,m) mode has the same frequency.
- Square plate: uniform thin plate, simply supported at every edge. The same sine-product
  basis satisfies displacement and bending-moment boundary conditions; relative frequency
  (m²+n²)/2. This is not the free-edge or center-clamped plate used in many Chladni experiments.
- Circular membrane: fixed rim, J_m(j_mn r) cos(mθ) and sin(mθ), with frequency relative to
  j_01. Five angular orders (0–4) and three radial roots. Radial profiles are normalized for
  display. n−1 internal nodal rings; m diameters for a single standing angular mode.

The pair coefficients are cos(blend) and sin(blend), with selectable relative phase.
Square m=n and circular m=0 have no distinct displayed partner; their mix controls disable.
Displacement is divided by √2 for a fixed bound. RMS displacement is computed analytically
from both basis functions and their phase relationship, not from instantaneous height.
At quadrature, momentary zero lines can move while persistent low-motion regions differ.

Mode grids, blend/phase pads, precise sliders and experiments update the top view, 3D surface,
probe readings and one-cycle trace. Display time is a slow ¼ cycle/second for every mode;
natural frequency ratios are shown separately. Playback starts paused, stops at 10 cycles,
and pauses when hidden/offscreen. No audio is generated.

## Grains and paint

CymaticField provides Grains, signed Displacement and RMS motion views. Its probe is optional.
The canvas and its transparent Mafs interaction overlay share coordinates. Paint is resolved
from the enclosing theme tokens, including live theme changes.

Grains are an illustrative gradient descent on squared RMS displacement, using bounded
steps and 1600 deterministically seeded points. They do not model bouncing, collisions,
friction, fluid dynamics, driving forces or material transport. The initial view is
pre-settled. Scatter resets the points; Play advances settling alongside the animated
surface. Geometry/mix changes refresh the initial pattern when the scatter counter is zero.
The faint nodal band is a tolerance visualization, not an exact contour. Boundaries can
collect grains. RMS paint is time invariant even when all instantaneous heights cross zero.

## Standing string

The resultant is ½[sin(nπx−2πc)+r sin(nπx+2πc)]. For r=1 it equals sin(nπx)cos(2πc), a
fixed-end string mode with frequency n times the fundamental. For unequal amplitudes it is
an ideal local superposition, not a solution with both endpoints fixed. Stationary-node
markers appear only at r=1. Inspect a node and an antinode, then remove the return wave:
the linked cycle trace and analytic RMS distinguish permanent nodes from zero crossings.

## Sources and numerical checks

Formulas and model interpretation informed by [Penn State square membrane modes](https://www.acs.psu.edu/drussell/Demos/rect-membrane/rect-mem.html),
[Penn State drum modes](https://www.acs.psu.edu/drussell/Demos/MembraneCircle/Circle.html),
and [Oberlin's Chladni experiment](https://www2.oberlin.edu/physics/catalog/demonstrations/waves/chladni.html).
No external animation assets are used. Bessel roots were computed with mpmath; the bounded
Bessel series is checked at every supported root. Tests also verify fixed boundaries,
frequency ratios, analytic RMS against time samples, quadrature versus cancellation,
grain descent and stationary string nodes.

Run `node scripts/cymatics-stories.mjs` against the unified preview (6027 by default).
It checks real field/GPU changes, scattering and settling, probe movement, behavior plays,
and narrow layouts. The Math catalogue runner includes the three new component groups.
