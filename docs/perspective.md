# Perspective as an explorable relationship

`src/library/math/perspective/` is a React-only family under `Math/` in Storybook.
It ports the small projection and finite-optics models from
[ryangavin/perspective](https://github.com/ryangavin/perspective), inspected at
`aa83fc32debbb3ff92c76f60d6e91e952da08dbf`, and builds Zen-native exploration surfaces around them.
The original app remains in its own repository; Zen does not depend on it at runtime.

## Playgrounds

- **Projection Explorer**: one point linked across perspective, orthographic, isometric
  and cabinet views; a forced-perspective cube pair; a dolly zoom; and a nonplanar
  anamorphic ZEN construction. Move the camera, rotate the scene, or drag a point in any
  image. An image drag preserves camera-space depth and inverts the selected projection.
- **Optical Paths**: the same ray through two finite mirrors and through a glass rhomboid.
  Compare TIR, low-index leakage, coated bevels, finite apertures and a sampled pupil.
  Select a boundary to reveal its normal and incidence. A direct angle/relief pad connects
  both systems; labeled sliders provide another input route.
- **Spatial Optics**: finite mirror polygons and a six-face prism, with true 3D reflection
  and refraction. Change incident elevation, azimuth, optic yaw, height or glass index.
  Orbiting the inspection camera does not change the ray physics. The second view is a
  top-down projection, deliberately labeled as distinct from a planar cross section.
- **Stereo Explorer**: parallel pinhole cameras with off-axis convergence shifts, signed
  disparity, a draggable top-down target and a zero-disparity plane. Optional crossed
  image order, and a zero-baseline motion-parallax example, share the same world geometry.

## Primitives and public API

All are exported through `@satoramoto/zen` and have their own component stories:

| Primitive | Contract |
| --- | --- |
| `ProjectionView` | World-space line segments and translucent polygon faces, camera settings, projection and optional image offset; near-plane clipping, world-space probe inversion and shared orbit callback. Colors are theme hue slots. |
| `RayPathView` | Finite surfaces, traced paths and optional glass polygon; boundary selection, normals and directional arrows. It never computes or changes the physics. |
| `StereoPair` | Shared world geometry and probe, separation, focal scale and zero plane; two `ProjectionView` instances with parallel cameras and opposite image shifts. |

Framework-free public models are namespaced as `PerspectiveGeometry`, `GeometricOptics`
and `SpatialOpticsModel`. `stereoPoint`, `disparity` and `StereoSettings` are also exported.
The namespacing keeps two coordinate conventions explicit: projection uses x right,
y up, z forward; geometric optics uses x right, y forward, z up (millimetres).
The spatial renderer converts optics coordinates at its boundary.

`liftImagePath` constructs an arbitrary-depth 3D path from image samples; the chosen
pinhole projection is invariant at the original viewpoint. It powers the anamorphic
message without hard-coding a special rendering trick.

## Conceptual limits

- Drawings are transparent wire geometry, not hidden-surface retinal renders. They do not
  claim to reproduce occlusion or physical image intensity.
- Orthographic scale is f/8. Isometric and cabinet bases are applied after the shared
  world/camera transform; a rotated scene need not retain the canonical axis presentation.
- Forced geometry stays fixed when moving the camera. The matching viewpoint is not
  silently reconstructed to preserve the illusion.
- Dolly zoom locks the perspective scale of the reference plane z = −1.5 when unrotated;
  it cannot lock every depth of a 3D subject.
- Optics is bounded geometric tracing: twelve events in 2D, sixteen in 3D. Corner/edge
  ambiguity, missed apertures, coating backs and critical grazing are explicit outcomes.
  No Fresnel ray splitting, absorption, chromatic dispersion, diffraction or wave optics.
- Pupil bundles sample three horizontal positions and five angles, not integrated pupil
  area or an empirical field-of-view measurement.
- Stereo is schematic and not physically calibrated. Fusion is optional and never needed
  to understand the numerical or diagrammatic relationships. No physiological claims.

The source app's CPU retinal renderer, first-person navigation, physical viewing guide
and calibration workflow are not ported. The current family supplies reusable geometry,
ray paths and explanatory views; those app workflows remain in `perspective`.

## Validation

Model tests preserve the source's exact forced-alignment, clipping, finite-aperture,
Snell/TIR and coating checks. Additional tests check inverse projections, anamorphic
lifting, spatial paths and signed stereo disparity. UI behavior is exercised in the four
explorer story plays and `scripts/perspective-stories.mjs`, including actual pointer and
keyboard manipulation, viewport invariance, narrow layouts and light/dark presentation.
Use the unified Zen launcher and give its isolated worktree free ports; the browser runner
defaults to 6028 or accepts `MATH_PREVIEW_URL`.
