# Layout

**Where does this go?** How controls sit together is a **Group** (`Group` = a `Stack` plus a label: `direction`, `gap` step, `align`); a block of the screen with a frame is a **Region**; where blocks go, breakpoints, fit and zoom are the **Screen**. None of them paints anything of its own. See [`docs/tiers.md`](../../../docs/tiers.md).

| File | Tier | Decides |
|---|---|---|
| `Group` | Groups | a `Stack` (column, gap step 1) holding the label and a body `Stack`: direction, gap step (0–6), alignment, wrap |
| `Region` | Regions | the plate, its header and views (`Region.View`), the body's `gap` between groups |
| `Screen` | Screens | the header, footer and named grid of regions |
| `Tabs` | Controls | a switch between views (used in region headers) |
| `Layer` | (deprecated) | an alias of `<Surface layer={level} radius="card">` that keeps the `lib-layer` class; `Layer.tsx` re-exports `Opaque` and `Hole` |

`Stack`, `Surface` (with its layers), `Opaque` and `Hole` are primitives now, in [`../primitives`](../primitives/README.md); this folder's `index.ts` doesn't re-export them (the library's `export *` of both folders would clash).

Spacing is a scale step, never a pixel value or a control's margin. The only painting here is the Region's own plate; `src/library/tiers.test.ts` holds that to `../tiers.baseline.json`.
