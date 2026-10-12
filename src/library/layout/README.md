# Layout

**Where does this go?** How controls sit together is a **Group** (`Stack`, `Group`: `direction`, `gap` step, `align`); a block of the screen with a frame is a **Region**; where blocks go, breakpoints, fit and zoom are the **Screen**. None of them paints anything of its own. See [`docs/tiers.md`](../../../docs/tiers.md).

| File | Tier | Decides |
|---|---|---|
| `Stack`, `Group` | Groups | direction, gap step (0–6), alignment, wrap; Group adds the label |
| `Region` | Regions | the plate, its header and views (`Region.View`), the body's `gap` between groups |
| `Screen` | Screens | the header, footer and named grid of regions |
| `Tabs` | Controls | a switch between views (used in region headers) |
| `Layer`, `Opaque`, `Hole` | Primitives | a surface at one depth; solid over a native view; a cut-out |

Spacing is a scale step, never a pixel value or a control's margin. The only painting here is the Region's own plate and `Layer`; `src/library/tiers.test.ts` holds that to `../tiers.baseline.json`.
