# Assembly: screens that lay themselves out

A screen is put together from what its parts say about themselves, not tuned by hand for each size. Parts **declare** how much room they need; the screen **declares** what it holds and what matters most; the system's **principles** say how to trade one against the other. A pure function, `assemble()`, turns those three into a placement. Because it reads only data, never the DOM, every layout can be unit-tested in jsdom.

Code: `src/library/layout/assembly/`. Story: `Design OS/Layout/Assembly`. Tests: `assembly.test.tsx`.

## The parts declare forms

A component lists its **forms**, the ways it can be drawn, from most room to least:

| Component | Forms |
|---|---|
| Display | `full → compact → minimal` |
| PadBank | `two-rows → one-row` |
| Tabs | `labels → short → menu` |
| Fader | `tall → short` |

Each form gives:

- `min`: the least room it still works in;
- `ideal`: the room it wants;
- `grow`: whether it takes spare room on each axis past its ideal (up to an optional `max`).

Sizes are in **scale units**, never measured and never in pixels. A `Units` value adds up what is present:

| Field | Means |
|---|---|
| `control` | control heights (`--control-h`) |
| `target` | touch targets: each the larger of a control height and the pack's `minTarget` |
| `space` | spacing steps, each added once (`space: [3, 3]` is two `--space-3`) |
| `unit` | scale units (`--space-1` is one) |
| `lines` | lines of text in a role: the role's size × its leading (as in `Text.css`) |
| `chars` | characters in a role: the role's size × 0.6 |
| `px` | hairlines only |

`lengthSum`, `lengthMax`, `needsAcross(gap, …)` and `needsDown(gap, …)` add up a component's parts: side by side, the widths add and the height is the tallest.

A component receives its form with `useForm(forms, given?)`. A `form` prop wins; otherwise it gets the form the assembled screen chose for its region; otherwise its first form. By convention the component also exposes its list as a static, `Display.forms`, so a region can add it up.

## Regions add up their contents

A `RegionSpec` has an `id`, its `forms` (its contents' needs added up), a `priority`, and whether it has a `head` (a label or tabs) and a `plate` (default yes). The solver adds the plate itself, from the materials facet: the plate's inset on every side (`--mat-plate-inset`), and for a head, the head inset (`--mat-plate-head-inset`) plus one control height. A region never adds its own chrome.

## The screen declares intent

```ts
interface ScreenSpec {
  header?: RegionSpec[];   // fixed, full width: never steps down or zooms
  footer?: RegionSpec[];   // fixed, full width: never steps down or zooms
  rows: Row[];             // the body, top to bottom
  pairs?: [string, string][];
}
type Row = (RegionSpec | { rows: Row[] })[];  // a row's slot can hold a nested stack of rows
```

There is no grid, no fraction and no breakpoint. A **pair** is two regions that share a column seam: they take one width, so the seam beside them runs straight. Both must sit in rows of the same stack, and be first in both rows or last in both. The solver refuses any other pair.

Regions sit `--mat-plate-gap` apart, and the header and footer are that far from the body.

## The principles

Each theme pack has `principles` (`PackPrinciples` in `contract.ts`, values in `src/library/themes/principles/`):

| Field | Means |
|---|---|
| `minTarget` | the least a target may be on screen, in CSS px. The body is never zoomed below `minTarget / control`. Every pack uses WCAG 2.2's 24. |
| `density` | how the pack trades forms for room: `roomy` aims each form at its ideal before stepping down, `balanced` halfway, and `dense` at its least |
| `gaps` | spacing steps: `body` between groups in a region, `group` between controls in a group |
| `ranks` | the priority ladder, highest first; default `now, next, controls, context, chrome` |

A region's `priority` is a rank (or a number). On the ladder the first rank is 100, and each one after it is 20 less. "What's playing never shrinks first" is the default ladder: `now` is the top rank, so it steps down last.

`principlesFor(facets, pack.principles)` resolves these against the facets that are actually worn, all in px: the scale's unit, control height and sizes, and the materials' plate inset, head and gap. So swapping only the scale or the materials changes the answer, as it should. `ThemeScope` takes `principles`, and the Storybook decorator passes the pack's.

How the two systems map onto it:

- **Yahaha** (`yahaha/STAGE.md`): Display, the hero, is `now`; the song form is `next`; the mixer, knobs, pads and transport are `controls`. The app bar is the header, and the keys and status line are the footer. The hero and the mixer are a pair, the one seam from the bar to the keys. Density is `dense`, because STAGE.md wants every concept on one screen down to 1217 × 752.
- **visual[flow]** (`themes/principles/visuals.md`): the preview is `now`, and the sidebar and inspector are `context`, each with a docked form and an overlaid form. The header holds only type and is fixed. Density is `roomy`: space is the look.

## The solver

`assemble(spec, room, principles)` is pure and deterministic.

1. **Start rich.** Every body region starts at its first form. The header and footer take their first form's ideal height at full width. The body gets the room that is left.
2. **Step down by priority.** The fit test aims each form between its `min` and its `ideal` by density (dense 0, balanced ½, roomy 1). While the body overflows, the **lowest-priority** region whose next form is smaller on the overflowing axis steps down one form. Within that tier, a region whose step also shrinks the body goes first, and on a tie the later one in reading order.
3. **Take back needless steps.** A step taken early can turn out not to be needed once a later one makes room. Picture a short sidebar beside a tall hero: stepping the sidebar down doesn't help until the hero shrinks too. So once the body fits, each stepped region tries its richer form again, highest priority first, and keeps it if the body still fits.
4. **Fall back to dense.** If a roomier aim runs out of useful steps, the solver starts again aiming at each form's least.
5. **Zoom last.** Only when no step down helps any more (normally, when every region is at its last form) is the body zoomed. It uses the one factor that fits the body's least, and never goes below `minTarget / control`. Below that it sets `overflow` and the screen scrolls. The header and footer never zoom.
6. **Split the room.** Along each row (widths) and each stack (heights), every part gets its least. Then each priority tier, highest first, is raised toward its ideal. Then the spare goes to the parts that `grow`, highest priority first, in proportion to their ideals and up to their `max`. A row with no grower leaves its spare at the end. Across a row, regions stretch to the row's height, so there are no dead bands.

The answer is a `Placement`: each region's `form`, `step` and `rect` (px, in its zone, before zoom), the three zones, `zoom`, `layout` (the body's box before zooming), `overflow`, and `steps`, the log of every step down and back.

## On screen

```tsx
<Screen
  name="Demo"
  spec={DEMO_SPEC}
  regions={{ bar: <Bar />, now: <Region name="Now"><Now /></Region>, side: …, pads: (form) => <Pads rows={form === 'two-rows' ? 2 : 1} /> }}
/>
```

`Screen` with a `spec` renders `AssembledScreen`. It measures its own box, which is the room (only the room, never the parts). It runs the solver with the nearest `ThemeScope`'s principles, places every slot absolutely where the placement says, and wraps each region's content in its chosen form, for `useForm()`. The root carries `data-zoom` and `data-overflow`, and each slot `data-region` and `data-form`. Without a `spec`, `Screen` is the named grid it always was.

## Worked example

`Assembly.fixtures.ts` declares a bar, then "now" beside a sidebar, then the pads. The forms are in control heights:

| Region | Rank | Forms (min → ideal, w × h, in control heights) |
|---|---|---|
| bar (header, no plate) | chrome | `bar` 0 × 1 |
| now | now | `full` 10×6 → 14×7, grows w; `compact` 8×3 → 10×4, grows w |
| side | context | `docked` 8×4 → 10×6; `rail` 2×2 |
| pads | controls | `two-rows` 8×(4 + space 2) → 16×5, grows w and h; `one-row` 8×2 → 16×2.5, grows w |

With a 28 px control, a 4 px unit, a 12 px plate inset, an 8 px gap and `dense`:

- **1440 × 900.** The bar takes 28, so the body is 1440 × 864. Everything fits at its least (the body needs 344 high), so nothing steps down. The heights are split next. Each row first reaches its ideal: the top row 7 × 28 + 24 = 220, the pads 164. The pads are the only part that grows in height, so they take the remaining 472 and end up 636. Across the top, "now" reaches 416 and the sidebar 304, and "now" grows into the rest, 1128.
- **900 × 330.** The body has 294 and needs 344. The sidebar is the lowest rank, so it steps down to `rail` first. That doesn't help, because the hero still sets the row's height. The pads step down to `one-row` next, and the body now needs 280, so it fits. Then the take-back pass finds the sidebar's step no longer needed and restores `docked`. The result is `full`, `docked`, `one-row`. A `roomy` pack (aim: ideal) reaches `compact` for the hero here instead.
- **600 × 240.** The body has 204. The sidebar goes to `rail`, the pads to `one-row`, then (last of all) "now" goes to `compact`, and the body needs 196. Nothing can be taken back. There is no zoom.
- **600 × 215** zooms the body to 179 / 196 = 0.913. At **400 × 150** the zoom would go below 24 / 28, so it stops there and sets `overflow`.

## What it doesn't do yet

- **Aspect.** Needs are fixed per axis, so a square pad's height can't follow its width. A form can't yet say `ratio`.
- **Region forms map one-to-one to a component's forms.** A region holding two declaring components passes the same form id to both. A per-part mapping (`parts: { pads: 'one-row' }`) comes later.
- **Text that wraps.** `chars` and `lines` count a fixed line.
