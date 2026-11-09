# projection-surface-occlusion Spec Delta

## ADDED Requirements

### Requirement: Occlude opaque surfaces and their marks

The projection SHALL optionally render opaque convex planar surfaces with pointwise depth occlusion, mask surface-owned marks with their owners, and honor caller-provided coplanar side relations consistently with camera-aware picking. Transparent wire mode SHALL remain the default.

#### Scenario: Inspect contact from both sides
- **WHEN** a viewer inspects contacting opaque surfaces from opposite sides
- **THEN** the visible and first-picked surface reverses with the camera and the buried surface marks remain inside their owner visibility mask
