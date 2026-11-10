# Mathematical relationships: first explorable scene

`Math/Explore/Components/Circle to Sine` is the first acceptance scene for an
interactive math exploration framework. The main object is a relationship: several
representations share its quantities and expose ways to change them. A form is not the
primary interaction.

## Try it

Use the unified launcher, with unoccupied ports for your worktree:

```sh
PREVIEW_LABEL="Zen Math Play" PREVIEW_PORT=4197 STORYBOOK_PORT=6027 npm run dev
```

Open `http://127.0.0.1:6027/?path=/story/math-explore-components-circle-to-sine--playground`.
The stories are Playground, Twice Around, Tall And Slow, Linked Handles, Compare And Reset,
Play And Pause, and Follow One Turn. The last four execute interaction assertions in the browser.

- The default scene starts at zero in **Follow the point** mode: a counterclockwise arrow,
  rightward time arrow, and linked quarter-turn markers establish the relationship. Select
  Start, Top, Across, Bottom, or Back to inspect matching heights. **Change the wave** reveals
  radius and frequency handles; returning to Follow restores the unit circle at zero.
- Drag the orbiting point or the wave's point to change the same time quantity.
- Drag the radius handle vertically to change the circle's size and the wave's amplitude.
- Drag the spacing handle horizontally to change frequency. Its position marks the first
  crest, `π / (2 frequency)`, so it remains available at every supported frequency.
- Each handle is a named slider with arrow keys, Shift for larger steps, and Home/End.
- Play advances time; dragging, keyboard changes, or scrubbing pause it. The scene starts
  paused, pauses when the tab is hidden, and cancels animation on unmount.
- Pin a comparison, then change the relationship. The ghost wave and radius stay fixed;
  the height difference compares the two waves at the current time.
- Equation coefficients focus their matching handles. Presets are invitations to explore;
  they do not discard a pinned comparison. Reset clears the comparison and restores props.
- The circle and wave stack on narrow containers. All paint comes from the current Zen theme.

Here `t` runs from 0 to 2π and is a dimensionless exploration coordinate. The angle is
`frequency × t`; the point is `(amplitude cos(angle), amplitude sin(angle))`. The wave's
height is that exact same y value. Playback wraps the finite time interval; for noninteger
frequency its endpoint may differ from its start. The visible trace reveals the function
up to t, not a persistent history of every drag.

## Reuse

The public React entry exports `SineExplorer`, `useRelationship`, `Relationship`, and the
quantity/source helpers. Existing mathematical primitives retain their Svelte bindings.
This new exploration area is explicitly React-only, as requested.

```tsx
import { SineExplorer, ThemeScope } from '@satoramoto/zen';
import '@satoramoto/zen/zen.css';

// Inside your existing ThemeScope:
<SineExplorer amplitude={1} frequency={2} time={Math.PI / 4} />
```

`Relationship<K, D>` declares bounded numeric source quantities and one function deriving
outputs. `useRelationship` owns those sources and a pinned snapshot. Every representation
reads the same sources; a view can supply an inverse mapping for direct manipulation (the
circle drag chooses the nearest valid turn). It is deliberately a small foundation, not a
symbolic constraint solver or a graph of arbitrary equations. Definitions should have a
stable identity, for example a module-level constant.

## Renderer decisions and scope

- **Mafs 0.21.0** is the installed 2D engine. The adapter adds accessible quantity semantics
  and keyboard steps to its movable points. Its stylesheet is scoped through `.zen-sine`
  overrides to the Zen token contract, and the public library build includes it.
- **MathBox** now renders the separate [Signals & Spaces collection](signal-playground.md),
  with ten signal-processing and manifold scenes. The circle-to-sine scene remains Mafs-only.
- **MathLive + Cortex Compute Engine** remain the direction for authored expressions. This
  scene's equation is the exact display of a known relationship, not a free-form editor.
  Neither dependency is needed for this first scene.

Avoid turning every scene into a single generic settings panel. Develop the next relationship
as another playable specimen, then promote the presentation pieces that actually repeat.

## Verification

```sh
npm run typecheck
npx vitest run src/library
npm run build:storybook
npm run build:lib
npm run check:lib
MATH_PREVIEW_URL=http://127.0.0.1:6027 node scripts/math-stories.mjs
```

The browser runner observes Storybook completion/failure events, exercises pointer dragging
and keyboard input, checks linked values and viewport overflow, and saves screenshots at
1440, 900, 560 and 390 pixels in light/dark themes. Pure model tests cover forward/inverse
consistency, turn preservation, the angle seam, and invalid source values. Review screenshots
separately from the test results.
