// Self-assembling layout: the declared shapes (docs/assembly.md). Components declare their
// needs in scale units, never measured; screens declare intent, never a grid; `assemble()`
// turns both into a placement.
import type { Density, Rank } from '../../contract';
import type { Step } from '../../primitives/step';
import type { TextRole } from '../../primitives/Text';

/**
 * A length in the active scale's units. Every field present is added: `{ control: 2, space: 3 }`
 * is two control heights plus `--space-3`. Resolved against the scale facet (`resolveLength`).
 */
export interface Units {
  /** Control heights (`--control-h`). */
  control?: number;
  /** Targets: each the larger of a control height and the principles' `minTarget`. */
  target?: number;
  /** Spacing steps, each added once (`space: [3, 3]` is two `--space-3`). */
  space?: Step | readonly Step[];
  /** Scale units (the scale's `unit`; `--space-1` is one). */
  unit?: number;
  /** Lines of text in a role: the role's size × its leading (Text.css). */
  lines?: Partial<Record<TextRole, number>>;
  /** Characters of text in a role: the role's size × the average glyph width (`CHAR_WIDTH`). */
  chars?: Partial<Record<TextRole, number>>;
  /** Literal CSS px, for hairlines only (1, 2). */
  px?: number;
}

/** A length: units, the largest of several, or the sum of several. `0` is nothing. */
export type Length = 0 | Units | { max: readonly Length[] } | { sum: readonly Length[] };

/** Room on both axes. */
export interface Need {
  w: Length;
  h: Length;
}

/**
 * One way a component (or a region) can be drawn, with how much room it takes. A component lists
 * its forms from most room to least: Display `full → compact → minimal`, PadBank `two rows →
 * one row`, Tabs `labels → short → menu`, Fader `tall → short`.
 */
export interface Form<Id extends string = string> {
  id: Id;
  /** The least room this form still works in. */
  min: Need;
  /** The room it wants. Never below `min`. */
  ideal: Need;
  /** Takes spare room on that axis, past its ideal (up to `max`). */
  grow?: { w?: boolean; h?: boolean };
  /** The most room it takes on an axis when it grows. */
  max?: Partial<Need>;
  /**
   * Height follows width: past `fixed`, the form keeps `w : h` (sixteen square pads in two rows
   * of eight are `{ w: 8, h: 2, fixed: { w: <7 gaps>, h: <1 gap> } }`). Once the solver knows the
   * form's width, its height is `fixed.h + (width − fixed.w) × h / w` (never below `min.h`): the
   * room it is given on that axis is exactly that, so a square stays square and leaves no band.
   */
  ratio?: Ratio;
  /**
   * The form of each part inside the region, by part name, for a region that holds more than one
   * component that declares forms (the song form with its transport): `{ form: 'strip',
   * transport: 'keys' }`. A part reads its own with `useForm(forms, given, 'transport')`.
   * `combineForms` builds such a region's forms from its parts'.
   */
  parts?: Readonly<Record<string, string>>;
}

/** A form's aspect: see `Form.ratio`. */
export interface Ratio {
  w: number;
  h: number;
  /** The part outside the ratio (gaps, captions). Default none. */
  fixed?: Need;
}

/** A component's forms, most room first. */
export type Forms<Id extends string = string> = readonly [Form<Id>, ...Form<Id>[]];

/** One region of a screen: its forms (its contents' needs added up), its rank, its plate. */
export interface RegionSpec {
  /** The id the placement and the screen's `regions` map use. */
  id: string;
  /** Its forms, most room first. The region's plate (inset, head) is added by the solver. */
  forms: Forms;
  /** How much it matters: a rank, or a number (a rank is its place on the ladder, highest 100). Default `controls`. */
  priority?: Rank | number;
  /** It has a header strip (a label or tabs): the plate's head inset and one control height are added. */
  head?: boolean;
  /** Drawn on a plate: the plate's inset is added round it. Default true. */
  plate?: boolean;
  /**
   * The id of a body region directly above this one that its content scrolls up behind (a list
   * passing under a pinned preview). Sizes are unchanged: the region's slot is drawn reaching up
   * to that region's top, above it, and the content is told how much of its top that pinned
   * region covers (`Placed.under`).
   */
  under?: string;
  /**
   * The id of a body region directly below this one that its content also scrolls down behind
   * (a list passing under a pinned transport bar): `under`'s mirror. Sizes are unchanged: the
   * region's slot is drawn reaching down to that region's bottom, before it (so beneath it), and
   * the content is told how much of its bottom that pinned region covers (`Placed.over`).
   */
  over?: string;
  /**
   * A floating panel (a sidebar, an inspector, a bottom bar): on every side where it meets the
   * room's edge it sits the panel inset (`PANEL_INSET`, `--space-2`; `--lib-panel-inset` in CSS) in
   * from it. The solver adds that inset to its size on those sides and the slot pads its content
   * by it (`Placed.inset`), so no app sets a window margin by hand. A form that takes no room (0
   * on an axis: a panel put away or laid over) gets none.
   */
  panel?: boolean;
  /**
   * Clear glass: a pinned region (one another names in `under` or `over`) that what scrolls behind
   * it shows through, very diffused, instead of being cut at its edge. Its slot draws the theme's
   * float backdrop (the blur) with a faint float tint, feathered at its edges so no box shows; the
   * region scrolling behind it isn't clipped there, only faded across it. Without a backdrop in
   * the theme it is the fade alone.
   */
  glass?: boolean;
}

/** A stack of rows inside a row's slot (a column of regions next to another region). */
export interface Nest {
  id?: string;
  rows: readonly Row[];
}

/** One row: regions and nests side by side, left to right. */
export type Row = readonly (RegionSpec | Nest)[];

/** A screen: what it holds and what matters, never a grid. */
export interface ScreenSpec {
  /** Fixed at the top, full width, stacked: never steps down or zooms. */
  header?: readonly RegionSpec[];
  /** Fixed at the foot, full width, stacked: never steps down or zooms. */
  footer?: readonly RegionSpec[];
  /** The body: rows top to bottom. */
  rows: readonly Row[];
  /**
   * Regions that share a column seam: the two take one width. Both sit in rows of the same stack
   * (the body, or one nest), and both first or both last in their rows, so the seam beside them
   * runs straight from one to the other.
   */
  pairs?: readonly (readonly [string, string])[];
  /**
   * Room kept clear between the body and footer and the room's sides and foot (the header runs
   * edge to edge, as an app bar does). Default none.
   */
  edge?: Length;
  /**
   * Lay the screen out in a room of this shape instead of the whole window (`{ ratio: 16 / 9 }`).
   * The header, body and footer all live inside that room; what the window has left over is a
   * band of the `ground` layer (letterbox), with no plate and nothing in it. Default: the window.
   */
  aspect?: Aspect;
}

/**
 * How a screen fits a room of one shape into the window. Both take the largest box of the ratio
 * inside the window, centred, with ground bands round it.
 *
 * - `contain`: the screen is laid out in that box, so a smaller window steps forms down (an app).
 * - `scale`: the screen is laid out once in its `design` room and drawn scaled to the box, so a
 *   small frame shows the whole design smaller (a preview, a story).
 *
 * (Room is left in the union for `cover`, `stretch`.)
 */
export type AspectFit = 'contain' | 'scale';

/** A screen's shape: see `ScreenSpec.aspect`. */
export type Aspect =
  | {
      /** Width ÷ height (`16 / 9`). */
      ratio: number;
      /** Default `contain`. */
      fit?: 'contain';
    }
  | {
      /** Width ÷ height; must be `design.w / design.h`. */
      ratio: number;
      fit: 'scale';
      /** The room the screen is laid out in, in px (Yahaha: 1920 × 1080). */
      design: { w: number; h: number };
    };

/** A box's four sides in px. */
export interface Box {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

/**
 * What the solver reads: a pack's principles resolved against the active facets, all in px.
 * Build it with `principlesFor(facets, pack.principles)`.
 */
export interface Principles {
  /** The scale facet in px. */
  scale: { unit: number; control: number; sizes: Record<TextRole, number> };
  minTarget: number;
  density: Density;
  /** Gap steps, as in the pack. */
  gaps: { body: Step; group: Step };
  /** Each rank's priority number, highest first (100, 80, …). */
  ranks: Record<Rank, number>;
  /** The materials' plate: the inset round a region's body, the head strip's inset, the gap between regions. */
  plate: { inset: Box; head: Box; gap: number };
}

/** A rectangle in px. */
export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** Where one region went and in which form. */
export interface Placed {
  id: string;
  /** The chosen form's id. */
  form: string;
  /** Its index in the region's forms (0 is the richest). */
  step: number;
  /** The chosen form's parts' forms (`Form.parts`), when it names them. */
  parts?: Readonly<Record<string, string>>;
  /** In px, relative to its zone (header, body or footer), before the body's zoom. */
  rect: Rect;
  zone: 'header' | 'body' | 'footer';
  /**
   * With `RegionSpec.under`: the pinned region it scrolls behind, and `reach`, the px from that
   * region's top down to this one's (its height and the gap): the slot is drawn that much taller,
   * reaching up, and its content keeps that much of its top for the pinned region. `edge` is the
   * px from the slot's top to the pinned region's drawn bottom edge (its height less any panel
   * inset there): the slot is clipped above it and fades in below it.
   */
  under?: { id: string; reach: number; edge: number; glass?: boolean };
  /**
   * With `RegionSpec.over`: the pinned region below it that it scrolls behind, and `reach`, the px
   * from this one's bottom down to that region's (the gap and its height): the slot is drawn that
   * much taller, reaching down, and its content keeps that much of its bottom for the pinned region.
   * `edge` is the px from the slot's bottom to the pinned region's drawn top edge. `glass`: the
   * pinned region is clear glass (`RegionSpec.glass`), so the slot isn't clipped there.
   */
  over?: { id: string; reach: number; edge: number; glass?: boolean };
  /** With `RegionSpec.glass`: it is clear glass, so its slot draws the diffusing backdrop. */
  glass?: boolean;
  /** With `RegionSpec.panel`: the px it sits in from the room's edge on each side (0 where it doesn't meet it); unset when all are 0. */
  inset?: Box;
}

/** The solver's answer. */
export interface Placement {
  /**
   * The room the screen is drawn in, in px relative to the window: the whole window, or with
   * `aspect` the largest box of that ratio inside it, centred. Everything else is relative to it,
   * in layout px: on screen, multiply by `scale`.
   */
  room: Rect;
  /**
   * The factor the room's content is drawn at: 1, except with `aspect.fit: 'scale'`, where the
   * screen is laid out at `aspect.design` and drawn at `room.w / design.w`.
   */
  scale: number;
  /** The window's leftover strips outside the room (none, or two: left and right, or top and bottom). */
  bands: Rect[];
  regions: Record<string, Placed>;
  /** Region ids in reading order: header, body rows, footer. */
  order: string[];
  /** The zones in px, relative to the room. The body's size is the room it is drawn into, after zoom. */
  zones: { header: Rect; body: Rect; footer: Rect };
  /** The body's zoom: 1 unless every region is at its last form and the least still overflows. */
  zoom: number;
  /** The body is laid out at `zones.body` ÷ `zoom`: its content box before zooming. */
  layout: { w: number; h: number };
  /** True when even the zoom floor (`minTarget`) can't fit it: the body overflows. */
  overflow: boolean;
  /** Each step down, in order (`"pads: two-rows → one-row"`), for tests and the inspector. */
  steps: string[];
}
