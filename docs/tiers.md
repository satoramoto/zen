# Tiers: who decides what

Every visual and structural decision in a zen app belongs to exactly one tier. Each tier builds only from the tier below it, and the tier below gives it everything it needs, so the right way is also the short way. You *can* override anything (`className` and `style` stay on everything); you shouldn't *want* to.

("Tiers", not "layers": layers are the depth stack in the contract.)

| Tier | Where | Decides | Never decides | Builds from |
|---|---|---|---|---|
| **Tokens** | `src/library/themes/` | values: colour, type, scale, materials, layers | anything about a screen | — |
| **Primitives** | `src/library/primitives/` | how a thing looks: a `Surface` (a layer, a material; `Opaque` makes the layers inside solid, `Hole` is a cut-out), `Text` in a role, an `Icon`, a `Stack` (a flex line with a gap step), a focus or press `Ring` | behaviour | tokens |
| **Controls** | `src/library/components/core`, `components/music` | one interaction: state, keys, accessibility, its own size on the scale (`size`), its colour slot (`tone`, `hue`) | its outer margin or position; picking a colour by hand | primitives |
| **Groups** | `src/library/layout/Group` (a `Stack` plus a label) | arranging controls: direction, gap step, alignment, the label | painting anything | controls |
| **Regions** | `src/library/layout/Region` | a block of a screen: plate, header, views | arranging controls inside it (that's a Group) | groups |
| **Screens** | `src/library/layout/Screen`, an app's screens | which regions go where, breakpoints, fit and zoom | styling a region | regions |
| **App** | an app's root | data, behaviour, which screen and system | CSS | screens |

## Where does this go?

Ask in order and stop at the first yes:

1. Is it a value (a colour, a size, a radius, a blur)? A **token**, in a theme facet.
2. Is it how something looks, whatever it is? A **primitive** prop (`<Text role="numeral">`, `<Surface layer="raised" material="key">`).
3. Is it what one control does? The **control**.
4. Is it how controls sit together? A **Group** (`gap`, `align`, `direction`).
5. Is it a block of the screen with a frame? A **Region**.
6. Is it where blocks go? The **Screen**.

## The rules the checks hold

`src/library/tiers.test.ts` counts the breaches below per folder against a recorded baseline (`tiers.baseline.json`). A count may go down, never up. When a count reaches zero, that rule becomes an error for that folder.

- **No pixel values outside tokens and primitives.** Sizes are scale steps (`var(--space-N)`, `var(--control-h)`, `var(--size-*)`). Hairlines (`1px`, `2px`) and `0` are allowed.
- **Controls set no outer margin.** Spacing between things belongs to the Group.
- **Groups, Regions and Screens paint nothing of their own.** No `background`, `box-shadow` or `border` except through a primitive or the region's own plate.
- **Tuning knobs are declared.** A component's local custom properties (`--yh-*`, `--vs-*`) are listed in its doc comment under **Tuning knobs**. An undeclared one is counted.
- **Type belongs to Text.** `font`, `font-size`, `font-weight`, `line-height`, `letter-spacing`, `text-transform` and `font-variant-numeric` are declared only in `themes/` and `primitives/`. Everywhere else (`components/`, `layout/`, `yahaha/`, `visuals/`, CSS and `style={{}}`) each one is counted, except a bare CSS-wide reset (`font: inherit`). Render the text as `<Text role=…>` and refine it with its props (`leading="tight"`, `size="caption"`, `weight="strong"`, `case="upper"`, `tabular`); a size the scale doesn't have goes in the `--text-size` knob on the Text element's own class (`--text-weight`, `--text-leading` and `--text-tracking` likewise). A control whose root or face is the text can make that element the `Text` (`<Text as="button" type="button" ariaRole=…>`), and one whose root is painted makes it the `Surface` (`<Surface as="button" type="button" material="key" radius="circle">`). Both primitives forward `ref` and native props, and their rules have no specificity (`:where()`), so the component's own class refines them.

- **Global element resets have no specificity.** Any reset that can apply under the library (`src/styles.css`, `.storybook/`, an app's base CSS) is wrapped in `:where()`. The primitives' own rules are zero-specificity, so a bare `button { font: inherit }` would beat a `<Text as="button">` and silently undo its role.

`npm run tiers` also prints an **adoption** line: how many component folders (`components/<core|music>/<Name>`, `yahaha/<Name>`, `visuals/<Name>`) render `Text` and `Surface`.
