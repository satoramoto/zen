# Primitives

**Where does this go?** How something looks, whatever it is: a `Surface` (a layer, a material), `Text` in a role, an `Icon`, the focus and press rings. Never spacing between things, never behaviour. See [`docs/tiers.md`](../../../docs/tiers.md).

Primitives build only from the tokens (`toCssVars()` in `../contract.ts`). They are the one tier that paints backgrounds, shadows, backdrops and borders, and that may hold a pixel value, so every tier above stays free of both.

- `Text`: `role` (`display`, `numeral`, `heading`, `body`, `label`, `caption`, `code`) sets face, weight, size, tracking, case and figures; `tone` sets the colour from a slot. Numerals are always tabular.
- `Surface`: `layer` (the depth stack) and/or `material` (`well`, `screen`, `key`, `handle`), `radius` step, `pressed`, `lit` (a colour slot that sets `--lit` and the theme's glow), `border`.
- `Icon`: an inline SVG sized by a text role or the control height, coloured by a tone.
- `focusRing`, `pressRing`: the ring classes every control uses.
- `Step`: a spacing step, 0–6 (`var(--space-N)`), as Stack, Group and Region take it.

Stories are under `Design OS/Primitives/*`.
