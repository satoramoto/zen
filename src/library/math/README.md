# Math workspace: first slice

Spatial Studio is an application-level acceptance story under **Design OS → Math**. It is deliberately not a new public application component. The reusable presentation primitives are exported through Zen's React and Svelte entries; all share framework-free view models.

| Component | Responsibility |
| --- | --- |
| ExactValue | Render an exact value from a string, keeping arbitrary-precision presentation separate from JS numbers. |
| ExpressionField | Controlled expression input, validation feedback, Enter to commit, Escape to cancel; no evaluation. |
| PlotViewport | Stable point identities, projection, selection, pan, zoom, relation edges and independent fill/outline channels. Optional boundsPoints keeps positions stable across filters. |
| MathInspector | Supplied mathematical properties and predicate membership; never derives facts itself. |

The next reusable candidates are a predicate/layer editor, mathematical table, sequence picker, formula renderer, and computation-status view. Their application semantics should settle in this story before being promoted into Zen.

## Interaction structure

The canvas is the primary output. A single side panel switches between Setup, Layers and Inspect. Pattern visibility stays immediately available; styling and composition controls are disclosed on demand. Color identifies mathematical sets, while headings, body text and supporting metadata use Zen's type and neutral ink hierarchy. Captured views are secondary bookmarks rather than a permanent control bank.

This arrangement draws on Wolfram's documented Manipulate control panel, optional numeric/animation controls, bookmarks, and selectable/collapsible views:
- https://reference.wolfram.com/language/workflow/UseTheManipulateInterface.html
- https://reference.wolfram.com/language/tutorial/Views.html

## Evaluation and persistence

The local TypeScript model supports positive integers up to 1,000,000 and at most 10,000 plotted points. Placement supports line, grid, alternating rows, Ulam spiral and projected volume. Predicates support multiples, residue classes, squares, cubes, primes and bounded boolean combinations. The expression input is a small parser, never arbitrary code evaluation.

Experiments preserve domain, placement, predicates, channel appearance, selection, camera, slice, relations, display settings and captured views as validated versioned JSON. Export is explicit; there is no automatic durable storage. UI permits eight new layers and twelve captured views; imported files permit up to 32 of each. Last visible matching layer in each channel wins. Combination predicates copy definitions rather than tracking mutable layer references.

No Sage connection exists in this edition. The volume is an SVG oblique projection with rotation and depth slicing, not a general 3D engine. Integer evaluation uses bounded exact JS integer arithmetic; arbitrary-precision strings in ExactValue do not imply arbitrary-precision evaluation. Camera/placement slider gestures are not individually recorded in undo history. Captures preserve them.

## Development and verification

User explicitly requested implementation in the main checkout; changes are uncommitted. Base: 246115a6fce350e0b057a5835ec6706d33856144. Root owns application integration and the unified preview. Bounded model and primitive assignments completed; review findings around serialization, camera bounds, independent opacity and view restoration were addressed.

Run the unified launcher only:

```sh
PREVIEW_LABEL="Zen Math Studio" PREVIEW_PORT=4191 STORYBOOK_PORT=6022 npm run dev
```

Model tests cover integer arithmetic, placement, parsing and persistence. Viewport tests cover stable filtered projection, independent opacity, gesture bounds and keyboard behavior. Shared view-tree snapshots cover all four new presentation primitives. The Spatial Studio Acceptance story selects 81, verifies five divisors, captures its view and inspects the serialized definition.

Verified during implementation: library suite (1,468 tests before final UX-only changes), final math/snapshot suite (97 tests), typecheck, library build and public entry checks, Storybook build, and browser Acceptance play. Browser checks also exercised adding a residue pattern, restoring its prior capture and volume slicing. The inspected accessibility scan had zero violations and four inconclusive checks; this is not a complete accessibility audit.
