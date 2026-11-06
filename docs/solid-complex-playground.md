# Solid cuts and complex relationships

React-only stories under **Design OS / Math**, grouped by **Solid Sections**,
**Complex Explorer**, **Complex Series**, and **Prime Counting**. Public components:
`SolidSections`, `ComplexExplorer`, `ComplexSeries`, and `PrimeCounting`.

## True plane sections

Sphere Cuts, Torus Cuts and Ellipsoid Cuts share a triangle mesh, plane, intersection
contours and boundary probe. Move/rotate handles on the 3D plane are Three TransformControls;
the pad and sliders provide equivalent access. The background orbits the camera.
The renderer is imported lazily and uses the existing pinned Three version.

`intersectMesh(mesh, plane)` computes triangle-plane intersections, welds shared-edge hits,
and stitches ordered contour loops. `planeFrame` supplies orthonormal section coordinates.
`sampleSurface` builds indexed meshes from parameterized surfaces. These plain TypeScript
primitives are exported independently of the React binding.

The flat section uses even-odd filling; area subtracts nested holes. Boundary loops are
not the same as connected filled components: the torus's horizontal annulus and vertical
pair of disks both have two loops. Readings approximate a finite triangle mesh. Tangency
can collapse a loop or create an isolated contact, which is not rendered as a contour.
An open-contour diagnostic warns that area is unreliable. Cutaway clips the shell; it does
not claim to cap the 3D mesh. The adjacent 2D view supplies the filled section.

## Complex functions

Complex Square and Complex Reciprocal introduce the linked input/output view. Riemann Zeta
adds the critical line and six known approximate zeros. One shared input controls:

- A domain-coloring image with draggable input and selected vertical input line.
- The output trajectory of that entire line, plus its current image point.
- A 3D scalar landscape with selectable magnitude, real or imaginary height.
- The magnitude restricted to the input line, with the same inspection time.
- Numeric input/output and magnitude readouts.

Cyclic theme colors encode phase; brightness uses 0.08 + 0.92 |f|/(1+|f|). The phase is
undefined at zero. The legend shows the cycle; exact readings are available without relying
on color. Optional sampled Re(f)=0 and Im(f)=0 contours highlight candidate intersections;
a pole is not a zero. Output curves omit segments outside the ±4 frame. Landscape height
uses the explicitly labeled logarithmic/asinh compression; missing pole samples are omitted
from the mesh. Input axes are independently scaled to show the long critical strip.

Sweep starts paused, stops at the window end, and pauses when hidden/offscreen. Clicking a
known zero snaps to its tabulated ordinate; it does not run a certified root finder. Moving
off σ=1/2 changes both the trajectory and the probe. A finite plot cannot prove RH.

### Evaluation

`zeta` uses Euler–Maclaurin continuation (48 summands, eight Bernoulli corrections), bounded
to −3 ≤ Re(s) ≤ 3 and |Im(s)| ≤ 40. It returns null for unsupported inputs and the pole.
The visual window is −0.5 ≤ Re(s) ≤ 1.5, 10 ≤ Im(s) ≤ 40. The trivial zeros and pole are
outside that view. A second evaluation with 80 summands reports agreement at the probe;
that is a consistency check, not a rigorous error bound. Tests cover real special values,
a tabulated complex value, six known zeros, conjugate symmetry and truncation stability.

References: [NIST definition, continuation and products](https://dlmf.nist.gov/25.2),
[NIST zeros](https://dlmf.nist.gov/25.10), [Clay RH statement](https://www.claymath.org/millennium/Riemann-Hypothesis/).

## Supporting primitives

Phasor Series draws head-to-tail terms n^(-s), their finite sum, the product over primes
p ≤ N, and the evaluated zeta value. Its input is restricted to Re(s)>1, where the Dirichlet
series and Euler product converge. It deliberately does not use partial sums to evaluate
the critical strip. Finite-sum and finite-product errors are separately reported.

Prime Count links a discrete staircase π(x), x/log x, their difference, and an inspection
point. Range 200 or 1000; primes are computed by trial division. This illustrates a discrete
count against an asymptotic approximation, not an RH-equivalent error bound or an explicit
formula reconstruction. [NIST number-theoretic applications](https://dlmf.nist.gov/25.16).

## Verification

The unified launcher serves the existing worktree on Storybook 6027/app 4197.
`node scripts/lab-stories.mjs` checks GPU changes, direct pads, zero visits, contour toggles,
sweeps, the two behavior stories, supporting primitives, and narrow light-mode layouts.
Pure tests are in `src/library/math/lab/lab.test.ts`. Required checks: typecheck, library
tests, build:lib, check:lib and build:storybook. Browser screenshots are reviewed separately.
