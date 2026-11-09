# Filled regions in PlotViewport

Both public renderer entries export `PlotRegion` alongside `PlotViewportProps`.

```tsx
import { PlotViewport, type PlotRegion } from '@satoramoto/zen';

const regions: readonly PlotRegion[] = [
  { id: 'face', boundary: ['a', 'b', 'c'], label: 'Triangle', hue: 1, interactive: true },
  { id: 'preview', boundary: ['a', 'b', 'c'], hue: 2, opacity: 0.1 },
];
// Supply a, b, c through points, and a controlled camera as usual.
// <PlotViewport points={points} camera={camera} regions={regions}
//   selectedRegionId={selectedRegionId} onRegionSelect={setSelectedRegionId} />
```

The Svelte entry is `@satoramoto/zen/svelte`, with the same props and callbacks.
Replace immutable arrays when geometry or styling changes. Region IDs must be
unique and stable within the supplied region array; point IDs must be unique.
Region and point selection use separate namespaces, even if their IDs coincide.

`boundary` is an ordered list of at least three distinct point IDs. Missing
references, repeated IDs and non-finite coordinates omit that region. Zen does
not repair geometry, establish convexity, calculate exact area or certify a
domain operation. The caller owns topology and validity. Polygons use SVG's
ordinary nonzero fill rule, including for caller-supplied self-intersections.

Regions use the point projection and camera, behind edges, points and density
cells. Later regions paint above earlier ones; keyboard order follows input
order. Density cells and point targets keep their existing precedence. Region
identity is independent of density bins. Optional hue slots 1–5 select theme
colors; opacity controls the fill (default .25, clamped to 0–1). Outlines retain
constant screen width. Selection and focus use theme text/accent tokens.

Interaction requires `interactive: true`. Decorative regions have no focus
target and pass pointer input through to shapes beneath. Pointer release, Enter
and Space emit the stable ID through `onRegionSelect`; the caller controls
`selectedRegionId`. A drag starting on an interactive region cancels activation
without panning. Empty-space dragging still pans. Removing a selected region
removes its visual selection without inventing a replacement or firing a callback.
Existing viewport zoom keys and point-navigation keys retain their meaning.

## Reproduce the evidence

Use the preview registry with this checkout's absolute path, then run
`node scripts/viewport-regions.mjs`. It discovers that checkout's registered URL
(`STORYBOOK_URL` can override it), runs scenario plays in React and Svelte at
390px and 1280px, rejects console assertions and browser exceptions, and saves
screenshots/results in ignored `.shots/viewport-regions/`.

The story tooling is pinned to immutable public story-spec source commit
`c96187f1cfd07fe826ceb2a8b1dfc1f3a1074736`, the same source as the approved
artifact used by Harmonigram. Its repository became public during implementation;
the manifest and lockfile now both pin that revision.

Baseline negative control: before model implementation, the first scenario failed
with `Unable to find an accessible element with the role "button" and name
"Left region"`, even though Storybook reported phase `finished`. The runner
correctly rejected the logged assertion.

## Verification

- Eight scenarios × two renderers × two widths: **32 passing browser plays**,
  plus real mouse click/drag and native Enter/Space checks in both renderers.
- `npm run typecheck`: exit 0.
- Full library regression, `npx vitest run src/library`: **102 files, 1,826 tests
  passed** in 30.58s.
- `npx vitest run src/library/view src/library/parity.test.tsx src/library/tiers.test.ts src/library/math/view/PlotViewport/PlotViewport.test.ts`:
  **6 files, 141 tests passed**, including all 13 existing viewport model checks
  and unchanged no-region snapshots. There were no pre-existing dedicated
  PlotViewport story plays; new point/density compatibility plays exercise those
  existing behaviors in both browser bindings.
- `npm run build:lib` and `npm run check:lib`: exit 0;
  `check-lib-entries: 2 entries free of React`.
- `npm run build:storybook`: exit 0.
- Strict store validation and scoped story-spec drift check: exit 0.

The planning store lacks Storybook, so run the scoped generator with this
checkout's dependency path, keeping generation owned by story-spec:

```sh
NODE_PATH="$PWD/node_modules" npx story-spec sync \
  --change viewport-filled-regions \
  --root "$HOME/Projects/satoramoto/zen-flow" \
  --dir "$PWD/src/library/math/view/PlotViewport"
# Repeat with --check to verify drift.
openspec validate viewport-filled-regions --strict --store zen-flow
```

`zen-flow doctor zen --merge-path` returned `pull-request`.
Public-API approval and the gated merge remain pending. No immutable consumer
release is claimed until those steps finish.
