# Perspective reference for Math

Reference: [ryangavin/perspective](https://github.com/ryangavin/perspective), inspected at `aa83fc32debbb3ff92c76f60d6e91e952da08dbf`.

The local checkout is `/home/ryan/Projects/ryangavin/perspective`; it is a reference repository, not a Zen dependency. No code has been ported yet. Keep its app-specific UI in that repository; extract reusable models and exploration primitives into Zen when building the stories.

## Story candidates

| Exploration | Existing reference | Relationship to make tangible |
| --- | --- | --- |
| One world, four projections | `src/geometry.ts` | Drag a world point; perspective, orthographic, isometric and cabinet views follow. Keep scene and scale conventions explicit. |
| Forced perspective | `src/geometry.ts` | Two differently sized cubes coincide from one camera position. Move the camera and reveal the separation. |
| Mirrors and prisms | `src/optics.ts`, `src/OpticalBench.tsx` | Drag an incident ray; follow reflection, refraction, total internal reflection and finite apertures. |
| Optical paths in space | `src/optics3d.ts`, `src/ThreeOpticsLab.tsx` | Move an optical element and inspect how the ray path changes in 3D and in section. |
| Two eyes, one world | `src/binocular.ts`, `src/stereo.ts` | Change eye separation and target depth; compare disparity, parallax and occlusion. |
| Walk around the illusion | `src/play.ts`, `src/Playground.tsx` | First-person motion exposes viewpoint-dependent alignment and optical paths. |

Start with the projection comparison and forced-perspective pair: they share a small pure model and make the central relationship especially clear. Use the existing model tests as conceptual checks when extracting it.

## Fidelity boundaries

- A single-camera projection is not stereo vision.
- Orthographic scale is fixed; perspective divides by camera-space depth. Explain what stays fixed when switching views.
- Forced alignment in the reference uses a homothety about one specific camera position; it is not invariant under camera movement.
- The 2D optical bench uses idealized optics and finite apertures. Do not imply a full wave-optics simulation.
- Painter rendering and CPU stereo rendering have different occlusion limitations. Name them in the relevant story.
- Stereo viewing is optional and cannot promise fusion or physical calibration. Include ordinary side-by-side views.

The shared interaction vocabulary should remain selection → visible relationships → direct manipulation → comparison, with keyboard equivalents and honest readouts. Avoid turning these explorations into settings forms.
