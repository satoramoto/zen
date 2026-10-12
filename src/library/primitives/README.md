# Primitives

**Where does this go?** How something looks, whatever it is: a `Surface` (a layer, a material), `Text` in a role, an `Icon`, the focus and press rings. Never spacing between things, never behaviour. See [`docs/tiers.md`](../../../docs/tiers.md).

Primitives build only from the tokens (`toCssVars()` in `../contract.ts`). They are the one tier that paints backgrounds, shadows, backdrops and borders, and that may hold a pixel value, so every tier above stays free of both.

- `Text`: `role` (`display`, `numeral`, `heading`, `body`, `label`, `caption`, `code`) sets face, weight, size, tracking, leading, case and figures; `tone` sets the colour from a slot. Numerals and code are tabular. Refine the role with `leading` (`tight` 1, `snug` 1.15, `normal`, `none` 0), `size` (another role's size, or `inherit`), `weight` (a contract weight), `case` (`upper`, `label`, `none`) and `tabular`; a size the scale lacks goes in the `--text-size` knob on the Text's own class (also `--text-weight`, `--text-leading`, `--text-tracking`). The type rule (`docs/tiers.md`) keeps every font property here.
- `Surface`: `layer` (the depth stack) and/or `material` (`well`, `screen`, `key`, `handle`), `radius` step (`control`, `card`, `input`, `pill`, `circle`, `none`), `pressed`, `lit` (a colour slot that sets `--lit` and the theme's glow), `border`.
- Both render any element (`as`) with native props and a `ref`, so they can be a control's root (`<Surface as="button" type="button">`, `<Text as="label" ariaRole=…>`), and every rule is `:where()` (no specificity), so the component's class on the same element refines them without `!important`.
- `Icon`: an inline SVG sized by a text role or the control height, coloured by a tone.
- `focusRing`, `pressRing`: the ring classes every control uses.
- `Step`: a spacing step, 0–6 (`var(--space-N)`), as Stack, Group and Region take it.

Stories are under `Design OS/Primitives/*`.
