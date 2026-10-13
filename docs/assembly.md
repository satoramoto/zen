# Assembly: screens that lay themselves out

A screen is put together from what its parts say about themselves, not tuned by hand for each size. Parts **declare** how much room they need; the screen **declares** what it holds and what matters most; the system's **principles** say how to trade one against the other. A pure function, `assemble()`, turns those three into a placement. Because it reads only data, never the DOM, every layout can be unit-tested in jsdom.

Code: `src/library/layout/assembly/`. Story: `Design OS/Layout/Assembly`. Tests: `assembly.test.tsx`.

## The parts declare forms

A component lists its **forms**, the ways it can be drawn, from most room to least:

| Component | Forms |
|---|---|
| Display | `full → compact → minimal` (`DISPLAY_FORMS`) |
| SongForm's transport | `keys → tight → compact` (`TRANSPORT_FORMS`) |
| SongForm's strip (not on the Stage) | `strip → folded` (`FORM_FORMS`); both halves together `full → short` (`SONG_FORM_FORMS`) |
| FaderBank | `tall → short` (`FADER_BANK_FORMS`) |
| KnobBank | `labelled → compact` (`KNOB_BANK_FORMS`) |
| PadBank | `two-rows → small → one-row` (`PAD_BANK_FORMS`) |
| AppBar, StatusLine | one form each (`APP_BAR_FORMS`, `STATUS_LINE_FORMS`) |
| Tabs (not yet) | `labels → short → menu` |

Each form gives:

- `min`: the least room it still works in;
- `ideal`: the room it wants;
- `grow`: whether it takes spare room on each axis past its ideal (up to an optional `max`);
- `ratio` (optional): height follows width. Past `ratio.fixed` (gaps, captions), the form keeps `w : h`: sixteen square pads in two rows of eight are `{ w: 8, h: 2, fixed: { w: <7 gaps>, h: <1 gap> } }`. Once the solver knows the region's width, it gives exactly `fixed.h + (width − fixed.w) × h / w` (never below `min.h`), so a square stays square and leaves no band; the spare goes to the growers;
- `parts` (optional): for a region holding more than one component that declares forms, each part's form by name (`{ form: 'strip', transport: 'keys' }`). `combineForms(arrangement, gap, parts, list)` builds such a region's forms from its parts' needs, added up across or down.

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

A component receives its form with `useForm(forms, given?, part?)`. A `form` prop wins; otherwise it gets the form the assembled screen chose for its region (with `part`, that region form's `parts[part]`); otherwise its first form. By convention the component also exposes its list as a static, `Display.forms`, so a region can add it up.

Needs must be **truthful**: at its `min`, under every scale and pack, the component draws every concept with nothing cut off, and it fills any box at least that size. The component's own CSS honours the numbers (sizes in control heights, space steps and text roles), and each component's tests hold its forms to that under every pack × scale.

## Regions add up their contents

A `RegionSpec` has an `id`, its `forms` (its contents' needs added up), a `priority`, and whether it has a `head` (a label or tabs) and a `plate` (default yes). The solver adds the plate itself, from the materials facet: the plate's inset on every side (`--mat-plate-inset`), and for a head, the head inset (`--mat-plate-head-inset`) plus one control height. A region never adds its own chrome.

## The screen declares intent

```ts
interface ScreenSpec {
  header?: RegionSpec[];   // fixed, full width: never steps down or zooms
  footer?: RegionSpec[];   // fixed, full width: never steps down or zooms
  rows: Row[];             // the body, top to bottom
  pairs?: [string, string][];
  edge?: Length;           // room round the body and footer; the header runs edge to edge
  aspect?:                 // lay the screen out in a room of this shape (below)
    | { ratio: number; fit?: 'contain' }
    | { ratio: number; fit: 'scale'; design: { w: number; h: number } };
}
type Row = (RegionSpec | { rows: Row[] })[];  // a row's slot can hold a nested stack of rows
```

There is no grid, no fraction and no breakpoint. A **pair** is two regions that share a column seam: they take one width, so the seam beside them runs straight. Both must sit in rows of the same stack, and be first in both rows or last in both. The solver refuses any other pair.

### Scrolling under a pinned region

A region can say its content scrolls up behind the region directly above it: `under: 'hero'` (Home's grid under the pinned preview). Nothing about sizing changes: both are placed as before. The placement adds `under: { id, reach, edge }` to the lower one, `reach` being the px from the pinned region's top down to its own (the pinned one's height and the gap), `edge` the pinned region's drawn bottom edge from that top. `AssembledScreen` draws that slot reaching up to the pinned region's top, after it (so above it), with `data-under`, `--lib-under` and `--lib-under-pin` (unitless px): the content pads its scroll by `--lib-under`, so it starts below the pinned region and passes behind it as it scrolls. The solver refuses an `under` that names a region outside the body, or one not above it across the same columns.

Its mirror is `over`: the region's content also scrolls down behind the region directly below it (`over: 'bar'`, Home's grid under the transport). The placement adds `over: { id, reach, edge }`, `reach` being the px from its own bottom down to the pinned region's bottom (the gap and the pinned one's height), `edge` the pinned region's drawn top edge from that bottom. `AssembledScreen` draws the slot reaching down that far, with `data-over`, `--lib-over` and `--lib-over-pin` (unitless px): the content pads its scroll's end by that much, so its last row comes to rest above the pinned region, and passes behind it as it scrolls. The slot stays before the pinned region in reading order, so the pinned one is drawn above it and takes the presses over it. A region can have both (`under: 'hero', over: 'bar'`). The solver refuses an `over` that names a region outside the body, or one not below it across the same columns.

**Scroll-under is declared, never painted.** What "behind" looks like is the screen's (Assembly.css), not the content's: a slot with `under` or `over` is clipped at the pinned region's edge (nothing shows, paints or takes presses behind it) and masked by a fade band beside that edge, transparent at the edge and opaque at the slot's reach plus `--space-2` (the gap and a step: where the first or last row rests), each end on its own. The clip and mask are on the slot, which never scrolls, so any scroller nested inside fades alike and the content needs no CSS for it. The one knob: set `--lib-under-edge` (or `--lib-over-edge`, unitless px from the slot's top or bottom) on the slot to narrow the edge to what the pinned region really draws (Home's preview picture is shorter than its slot, so `useHoleClip` sets it to the picture's bottom). `library.test.tsx` fails on a vertical fade mask or a scroll-under clip anywhere else.

### Floating panels

A region on the window's edge that floats (the sidebar, the inspector, a bottom bar) says `panel: true`. Wherever it meets the room's edge (structurally: first or last in its rows and stacks, the body not kept off that edge by a header, footer or `edge`) it sits the panel inset (`PANEL_INSET`, `--space-2`) in from it: the solver adds the inset to its size on those sides, so the rest is placed round it, and records it as `Placed.inset`; the slot carries `data-panel` and pads its content by `--lib-inset-t|r|b|l`. A form that takes no room (0 on an axis: a panel put away or laid over) gets none; an app's own overlay panel reads the same inset as `--lib-panel-inset`. The panel (the slot's first `Surface`) also takes the float layer's lift, its edge and cast, whatever its layer and fill, so every window-edge panel reads as one kind of thing.

Regions sit `--mat-plate-gap` apart, and the header and footer are that far from the body. The `edge` keeps the body and footer off the room's sides and foot (an app bar in the header still spans the room). Two arrangements of one screen are two specs (the Stage's `STAGE_SPEC` and `STAGE_SPLIT_SPEC`), never CSS.

### Aspect

`aspect: { ratio: 16 / 9 }` fixes the screen's shape. The solver takes the largest box of that ratio inside the window (`fitAspect`), centred, its offset rounded down to whole px, its size exact (a 1217 × 752 window gives 1217 × 684.5625). The header, body and footer all live inside the box, so the app bar spans the box, not the window. What the window has left over are **bands**: two strips (left and right of a wide window, above and below a tall one, none for an exact one), drawn as `Surface layer="ground"` with nothing in them, hidden from assistive tech. Two fits:

- `contain` (the default; an app): the screen is laid out in the box, exactly as in a window that size. A smaller window steps forms down; the zoom rules and the `minTarget` floor are unchanged.
- `scale` (a preview or story): the screen is laid out once in its `design` room (`ratio` must be `design.w / design.h`) and drawn at `box.w / design.w`, so a small frame shows the whole design smaller and a large one bigger; the forms never change. The room is scaled with a CSS `transform: scale()`, not `zoom`: hit-testing follows a transform exactly in every engine, content keeps laying out in design px (ResizeObservers agree with the solver), a resize is the compositor's job, and it doesn't compound with the body's own last-resort zoom. Portaled popovers outside the screen aren't scaled.

`cover` and `stretch` have room in the type for later.

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

0. **The room.** The whole window, or with `aspect` the box above (the `design` room for `scale`). Everything below happens in it.
1. **Start rich.** Every body region starts at its first form. The header and footer take their first form's ideal height at full width. The body gets the room that is left.
2. **Step down by priority.** The fit test aims each form between its `min` and its `ideal` by density (dense 0, balanced ½, roomy 1). While the body overflows, the **lowest-priority** region whose next form is smaller on the overflowing axis steps down one form. Within that tier, a region whose step also shrinks the body goes first, and on a tie the later one in reading order. A step that would make the body worse on an axis where it then overflows is no help and isn't taken (sixteen pads in one row are shorter than two rows of eight, but wider than the room).
3. **Take back needless steps.** A step taken early can turn out not to be needed once a later one makes room. Picture a short sidebar beside a tall hero: stepping the sidebar down doesn't help until the hero shrinks too. So once the body fits, each stepped region tries its richer form again, highest priority first, and keeps it if the body still fits.
4. **Fall back to dense.** If a roomier aim runs out of useful steps, the solver starts again aiming at each form's least.
5. **Zoom last.** Only when no step down helps any more (normally, when every region is at its last form) is the body zoomed. First every step that costs the body nothing is taken back (a narrower transport beside the hero, once the row below sets the width). The zoom is the one factor that fits the body's least, and never goes below `minTarget / control`. If it would, the solver takes back what the floor's room still holds (a step that traded one axis for the other) and tries again; failing that it sets `overflow`, keeps the leaner forms, and the screen scrolls. Under the zoom, any step the zoomed room still holds is taken back. The header and footer never zoom.
6. **Split the room.** Along each row (widths) and each stack (heights), every part gets its least. Then each priority tier, highest first, is raised toward its ideal. Then the spare goes to the parts that `grow`, highest priority first, in proportion to their ideals and up to their `max`. A row with no grower leaves its spare at the end. Across a row, regions stretch to the row's height, so there are no dead bands. Widths never depend on heights, so a second pass, with every width known, gives each `ratio` form the height its width asks.

The answer is a `Placement`: the `room` (the box in window px), its `bands` and `scale` (1 unless `fit: 'scale'`), each region's `form`, `step` and `rect` (px, in its zone, before zoom), the three zones (relative to the room), `zoom`, `layout` (the body's box before zooming), `overflow`, and `steps`, the log of every step down and back.

## On screen

```tsx
<Screen
  name="Demo"
  spec={DEMO_SPEC}
  regions={{ bar: <Bar />, now: <Region name="Now"><Now /></Region>, side: …, pads: (form) => <Pads rows={form === 'two-rows' ? 2 : 1} /> }}
/>
```

`Screen` with a `spec` renders `AssembledScreen`. It measures its own box, which is the room (only the room, never the parts). It runs the solver with the nearest `ThemeScope`'s principles, places every slot absolutely where the placement says, and wraps each region's content in its chosen form, for `useForm()`. The root carries `data-zoom`, `data-overflow` and (with an aspect) `data-aspect`, and each slot `data-region` and `data-form`. The zones sit in a `data-part="room"` box at the placement's room (with `data-scale` when scaled); the bands are `data-part="band"` siblings. Without a `spec`, `Screen` is the named grid it always was.

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

## The Stage

`yahaha/Stage/Stage.spec.ts` is the whole of the Stage's layout: header `bar`; footer `keys` (just the keys, `ruler={false}`: 1.75 control heights) then `status`; rows `[hero, transport]`, `[mixer, { rows: [[knobs], [pads]] }]` (no song form strip: the sections are the Pads region's Sections bank, its default view); the pair `hero`/`mixer`; edge `--space-2`; `aspect: { ratio: 16 / 9, fit: 'contain' }`. The split spec is `[hero]`, `[mixer, controls, transport]` with no pair. The stories draw `STAGE_SCALED_SPEC` (`fit: 'scale'`, design 1920 × 1080) by default and have a `fit` control. `Stage.assembly.test.ts` proves it in five windows, 1440 × 1200, 2560 × 1080, 1920 × 1080 (the board), 1217 × 752 and 900 × 700, under every pack: the room exactly 16:9, centred, bands on the right axis; the forms chosen; no overflow, zoom ≥ the floor, every region at least its form's least, nothing overlapping, the hero stepping only after the controls. Two cases scroll at the floor: 900 × 700 gives a 900 × 506 room, below the Stage's least under every pack, and visual[flow]'s frost materials (32 px gaps, 22 px insets) can't afford the 1217 × 684.6 room.

## What it doesn't do yet

- **Width follows height.** `ratio` runs one way: a form's height follows its width, not the reverse. A ratio region in a row shorter than its width asks centres its content.
- **Tabs don't declare forms.** A region head is one control height; a head whose tabs need more width than the body puts it into the body's least width (FaderBank, KnobBank), with the widest material's tab chrome assumed.
- **Text that wraps.** `chars` and `lines` count a fixed line.
