# Why

Opaque folded surfaces cannot use centroid painter sorting or draw every line on top. Harmonigram needs depth-correct surfaces and caller-owned contact order through the public projection component.

# What Changes

- Opt-in opaque surfaces with per-surface occlusion, including owned lines.
- Caller-supplied coplanar ordering, interpreted relative to oriented face normals so orbiting reverses visibility correctly.
- Preserve existing transparent wire diagrams and all-layer inspection.

# Capabilities

## New Capabilities
- `projection-surface-occlusion`: depth-correct opaque convex planar faces and surface-owned marks.

## Modified Capabilities
None.

# Impact

Zen public ProjectionView types, renderer and pure projection models. Harmonigram consumes the public API in its separate origami-paper-game change. No geometric or physical certification is inferred from display order.

# Validation

Before merging: typecheck, library unit tests, build:lib, check:lib, build:storybook; scenario generation/check and strict OpenSpec validation. Browser checks of opaque overlapping surfaces, coplanar ordering, orbit, owned marks and unchanged transparent mode, including 390px. Review: look — inspect the connected Harmonigram box preview after integration.
