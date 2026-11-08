# Zen's mission

**Zen makes good interfaces easy to compose, with less infrastructure to maintain. Every supported theme produces a coherent, usable, pleasant result; which theme suits an app is a matter of character and preference.**

**Swap the theme, change the character, preserve the quality.**

A theme can make an app feel playful, austere, technical or warm. Different apps and people will prefer different expressions. Every supported expression must still feel deliberately composed and work well.

## Quality and preference

Use this distinction when designing, reviewing and reporting defects:

| Dimension | Quality that must survive a supported theme swap | Legitimate stylistic variation |
| --- | --- | --- |
| Content | Labels and essential content remain readable and reachable | Typeface, case, texture and visual voice |
| Hierarchy | Primary actions, groups and emphasis remain understandable | Quiet versus expressive emphasis |
| Interaction | Focus, selection, disabled and error states remain distinguishable; controls remain operable | Shape, material and treatment of those states |
| Layout | Content fits or deliberately reflows/scrolls without accidental clipping, overlap or inaccessible controls | Density, rhythm, proportion and whitespace |
| Semantics and state | Theme swapping preserves app data, selected values and the meaning of controls | Colours and decorative treatments used to express meaning |
| Composition | Parts share a coherent visual vocabulary and deliberate alignment | Technical, playful, warm or austere character |

Pleasantness requires design judgment. The rubric makes that judgment discussable; a numerical score cannot prove beauty. A preference for a different character is valid, and a preference for the current character does not excuse illegibility or broken layout. Compilation, token checks and DOM parity support the work, but do not establish perceptual quality.

## Where the promise applies

The quality promise covers supported built-in packs and supported combinations of the exposed theme facets, used through supported Zen component APIs. Zen describes those facets as freely mixable. That commitment includes combinations we have not yet inspected; testing a subset must not quietly redefine the supported set.

An incompatible combination calls for a defect report or an explicit proposal to change compatibility policy. Arbitrary app CSS overrides and unchecked user-authored skin values are outside the built-in quality guarantee. Theme switching must still preserve application state.

This document establishes the standard to uphold. It does not certify that every existing component and theme combination has passed a comprehensive audit. Keep evidence and known gaps explicit.

## What earns a place in Zen

Generic components and layout abstractions should make real interfaces easier to compose and reduce the infrastructure their authors must maintain. A proposal should explain:

- Which concrete composition becomes easier, including ordinary website use.
- Which maintenance responsibility disappears or becomes smaller, accounting for integration and adapter costs.
- Why the responsibility belongs in Zen and how it preserves quality across themes.
- What observable evidence will demonstrate the improvement.

Specialised modules such as music and math are first-class work: their domain behaviour is part of Zen's value. General website composition should remain approachable without adopting those domain concepts. A new primitive earns its place through useful compositions, rather than catalog completeness.

A headless library can be evaluated by the custom behaviour it replaces, accessibility, integration cost and theme outcomes. Library adoption, renderer changes and layout architecture remain separate design decisions. This mission selects none of them and does not supersede the current [tier rules](tiers.md), [assembly design](assembly.md) or [React and Svelte binding rules](svelte-bindings.md).

## Evidence for future changes

Future implementation proposals should demonstrate the same ordinary content or settings page and a specialised music or math interface under theme changes, keeping content and application state fixed so the comparison is honest.

Inspect narrow and wide layouts, long labels, focus, selection and overlays. Exercise interactions in the supported renderers. Record which packs, facet combinations, modes and viewports were inspected, what failed and what remains unverified. A sample provides evidence without proving the full combination space.

Behavioural requirements belong in Storybook `scenario()` stories, with one When and one Then and the capability named in `parameters.spec`. Generate their deltas with `story-spec sync`. Browser inspection supplies the layout and perceptual evidence that builds and unit tests cannot.

This evidence brief guides later proposals; publishing the mission does not itself add a showcase or audit the existing library.
