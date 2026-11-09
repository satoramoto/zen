# Projected face interaction

`ProjectionView` remains a controlled, React-only presentation primitive. Its
public types are exported through `@satoramoto/zen`:

```ts
interface ProjectionFacePick {
  candidateIds: string[];
  input: 'pointer' | 'touch' | 'keyboard';
}
interface ProjectionCamera { rotation: number; pitch: number }
```

Faces optionally supply a unique nonempty `id` and accessible `label` (falling
back to the ID). `selectedFaceIds` controls highlighting and pressed state.
`onFacePick` never changes selection itself. Anonymous, empty-ID and duplicate-ID
faces remain decorative. Invalid/nonfinite or edge-on projected surfaces are
omitted rather than assigned invented hit geometry.

Pointer/touch taps return all containing near-clipped projected polygons,
including rear and coincident faces. Candidates are nearest-first by interpolated
camera-space depth **at the hit**, with caller order breaking exact ties.
Perspective depth uses reciprocal interpolation. Keyboard focus follows caller
order; Enter or Space returns only the explicitly focused face's ID. Floating
projection does not establish exact geometry, layer legality or material order:
the caller decides how to select or cycle candidates.

`onCameraChange({rotation,pitch})` takes precedence over `onRotate`. It permits
unrestricted rotation, pitch in [-90,90], and two-degree directional-key steps.
Each component reads only its supplied settings; callers own independent camera
state. Legacy `onRotate` alone retains its horizontal [-75,75] clamp and step.

New interaction mode treats motion beyond **4 CSS pixels** as a drag. A completed
tap leaves camera state unchanged; a drag never emits a pick, even if it returns
to its start. Pointer cancellation and lost capture discard pending selection.
Probe gestures remain separate and never emit face picks. Camera changes never
mutate caller geometry or selection.
