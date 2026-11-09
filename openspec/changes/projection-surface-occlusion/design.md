# Design

Opt in with surfaceMode="opaque". For each projected convex planar face, subtract the parts of other projected faces that are closer at each image point. Reciprocal depth is affine for perspective; depth is affine for parallel projections. Clip the occluder by the depth-difference half-plane, then use SVG masks for fills and owned lines. This avoids centroid-order errors and supports crossing depth without moving vertices.

Coplanar ties use explicit face relations: a face names other face IDs and their side (+1/-1) of its oriented normal. Camera-facing normal selects visibility. Unknown ties use stable caller order only as a deterministic fallback; no physical validity is claimed. All-layer picking remains available and uses the same tie policy.

Lines may identify their owning face IDs. Draw each owned mark within each owner's visibility mask; cover it with nearer surfaces, including contact layers. Unowned lines remain deliberate overlays. Existing transparent wire rendering remains the default.

The application owns construction history and material semantics. Zen owns only generic projection and visibility. Test reciprocal-depth clipping independently with crossing faces and test camera reversal on coincident faces.
