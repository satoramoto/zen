// KnobBank's model: its props, its forms and the trees a renderer draws: the bank (the knob row,
// each slot with its Knob or its empty ring) and the Knobs region (a Region, one tab per page, the
// bank as its body). No framework: `KnobBank.tsx` (React) and `KnobBank.svelte` /
// `KnobBankRegion.svelte` (Svelte) each hand one of these to their `Tree`.
import type { TipAction } from '../../components/music/Knob/Knob.model';
import type { KnobModelProps } from '../../components/music/Knob/Knob.model';
import { BOX, START, SWEEP, arc } from '../../components/music/Knob/geometry';
import { lengthMax, lengthSum } from '../../layout/assembly/units';
import type { Forms, Length } from '../../layout/assembly/types';
import type { Step } from '../../primitives/step';
import { component, each, h, type ComponentNode, type Handlers, type Node } from '../../view/Tree.model';
import { PART_HUE_INDEX, type Part } from '../hues';

export type { TipAction };

/* ---------- forms (docs/assembly.md): what the bank needs, in scale units ---------- */

/** The bank's forms: `labelled` (names whole, the full ring), then `compact` (names may break, ring down to a target). */
export type KnobBankForm = 'labelled' | 'compact';

/** The Genos knob pages, the Knobs region's tabs: their names size the head (see `TABS_W`). */
export const KNOB_PAGE_NAMES = ['Style', 'Rack', 'Pan', 'Reverb', 'Chorus', 'Delay'] as const;

const steps = (step: Step, n: number): Step[] => Array<Step>(n).fill(step);

/** The name block: two caption lines (Knob.css's `calc(var(--size-caption) * 2.6)`). */
const NAME_H: Length = { lines: { caption: 2 } };

/**
 * The page tabs in the region's head, at their widest material (hardware: 3px track padding, 2px
 * between tabs, `--space-3` either side of each label; linear is within a px of it). Every
 * material's head inset matches its plate inset across, so the tabs' width is also what the
 * body must be at least, or a tab label is cut to an ellipsis. Folded into each form's min width.
 */
const TABS_W: Length = {
  chars: { label: KNOB_PAGE_NAMES.join('').length },
  space: steps(3, KNOB_PAGE_NAMES.length * 2),
  px: (KNOB_PAGE_NAMES.length - 1) * 2 + 2 * 3,
};

/** Eight slots across with `--space-1` between them. */
const row = (slot: Length): Length => lengthSum(slot, slot, slot, slot, slot, slot, slot, slot, { space: steps(1, 7) });

/**
 * One slot's width: the wider of its name's longest line and the knob (its ring plus `--space-1`
 * either side). The name budgets are bold capitals in the widest face (Helvetica, elektron):
 * labelled keeps every word whole, so the longest ("Metronome") must fit; compact lets a word
 * break, so seven characters a line, which still keeps every two-word name on two lines.
 */
const slot = (nameChars: number, ring: Length): Length =>
  lengthMax({ chars: { caption: nameChars } }, lengthSum(ring, { space: [1, 1] }));

/**
 * `labelled`: the knob's padding `--space-1` all round, the name, `--space-1`, the ring (1.5
 * targets at least, 2.75 control heights as designed, up to 3.5 when the box has room both ways).
 * `compact`: no padding top or bottom, the name, `--space-1`, the ring (one target at least, two
 * control heights ideally, up to 2.75).
 */
export const KNOB_BANK_FORMS: Forms<KnobBankForm> = [
  {
    id: 'labelled',
    min: {
      w: lengthMax(TABS_W, row(slot(11, { target: 1.5 }))),
      h: lengthSum({ space: [1, 1, 1] }, NAME_H, { target: 1.5 }),
    },
    ideal: {
      w: lengthMax(TABS_W, row(slot(11, { control: 2.75 }))),
      h: lengthSum({ space: [1, 1, 1] }, NAME_H, { control: 2.75 }),
    },
    grow: { w: true, h: true },
    max: { h: lengthSum({ space: [1, 1, 1] }, NAME_H, { control: 3.5 }) },
  },
  {
    id: 'compact',
    min: {
      w: lengthMax(TABS_W, row(slot(7, { target: 1 }))),
      h: lengthSum({ space: 1 }, NAME_H, { target: 1 }),
    },
    ideal: {
      w: lengthMax(TABS_W, row(slot(7, { control: 2 }))),
      h: lengthSum({ space: 1 }, NAME_H, { control: 2 }),
    },
    grow: { w: true, h: true },
    max: { h: lengthSum({ space: 1 }, NAME_H, { control: 2.75 }) },
  },
];

/* ---------- props ---------- */

/** One of the eight band knobs. */
export interface KnobItem {
  /** The plain name ("Dynamics"); "---" when unused. */
  label: string;
  /** The Genos code ("DynCtrl"). */
  code: string;
  /** The value as shown ("127", "1/8", "Off", "0"). */
  value: string;
  /** A small unit after the value ("%"). */
  unit?: string;
  /** How far round the arc is, 0–1. */
  fraction: number;
  /** Nothing mapped. */
  unused?: boolean;
  /** The keyboard part this knob sets (Right 1's reverb send, Left's pan): its arc wears that part's hue. */
  part?: Part;
}

/** The Launchkey's knob count: the bank always draws this many slots. */
export const KNOB_SLOTS = 8;

/** Every KnobBank prop (it has no framework children). */
export interface KnobBankProps {
  /** The eight knobs, left to right. Fewer: the rest are unused slots; more: those past eight are ignored. */
  knobs: KnobItem[];
  /** The knob page names, one view of the Knobs region each ("Style", "Rack", "Pan", "Reverb", "Chorus", "Delay"). */
  pages?: string[];
  /** The chosen page's index in `pages`. */
  page?: number;
  /** The knob page's name ("Style", "Swap R1"): the one tab shown when `pages` is missing or empty. */
  pageLabel?: string;
  /** The app's tooltip hook, passed to every knob. */
  tipAction?: TipAction;
  /** A page tab was chosen (its index in `pages`), by click or arrow key. */
  onPage?: (index: number) => void;
  /** A knob was clicked, or Space / Enter on it (its position, 0–7). Not for an unused knob. */
  onPress?: (index: number) => void;
  /** A knob asked for steps (its position, then +n clockwise or −n). Not for an unused knob. */
  onStep?: (index: number, delta: number) => void;
  /** The form to draw (`KNOB_BANK_FORMS`); wins over the one an assembled screen chose. Default: the screen's, else `labelled`. */
  form?: KnobBankForm;
}

/** The region's own props, beside the bank's (the class is each framework's own prop). */
export interface KnobBankRegionModelProps extends KnobBankProps {
  /** The region's name. Default "Knobs". */
  name?: string;
  /** The grid area the region fills in its screen. */
  area?: string;
}

/** The spoken name of the knob at `index`, as the original's. */
export function knobName(knob: KnobItem, index: number): string {
  const what = knob.unused ? 'unused' : `${knob.label}${knob.code ? ` (${knob.code})` : ''} ${knob.value}${knob.unit ?? ''}`;
  return `Knob ${index + 1}: ${what}`;
}

/* ---------- the view ---------- */

/** A slot with nothing given for it. */
const UNUSED: KnobItem = { label: '', code: '', value: '', fraction: 0, unused: true };

/** The whole ring's track, as the Knob draws it. */
const TRACK = arc(START, START + SWEEP);

/** The tooltip key on every knob and empty slot. */
const KNOB_TIP = 'knobs.knob';

/** The Knob's data props for a mapped slot (its callbacks and `tipAction` are this tree's handlers). */
function knobProps(knob: KnobItem, name: string): Omit<KnobModelProps, 'tipAction' | 'onpress' | 'onstep'> {
  return {
    label: knob.label,
    // The Genos code stays in the spoken name (knobName) but is not drawn on the Stage.
    code: '',
    value: knob.value,
    unit: knob.unit,
    fraction: knob.fraction,
    hue: knob.part ? PART_HUE_INDEX[knob.part] : undefined,
    name,
    tip: KNOB_TIP,
  };
}

/** An unused slot's face: a quiet ring, not a control (out of the tab order, keeps its spoken name). */
function emptyFace(name: string): Node {
  return h(
    'span',
    { class: 'yh-knobbank__empty', 'data-part': 'empty', role: 'img', 'aria-label': name, 'data-tip': KNOB_TIP },
    h('span', { class: 'yh-knobbank__line', 'aria-hidden': 'true' }),
    h('svg', { class: 'yh-knobbank__ring', viewBox: `0 0 ${BOX} ${BOX}`, 'aria-hidden': 'true' }, h('path', { d: TRACK })),
  );
}

/**
 * The bank's tree in the chosen `form` (the binding's `useForm` / `getForm`): the root, the knob row
 * and the eight slots, each a `Knob` (drawn by name, its press and steps the handlers `press<i>` and
 * `step<i>`) or an empty face.
 */
export function knobBankView({ knobs }: Pick<KnobBankProps, 'knobs'>, form: KnobBankForm): Node {
  const slots = Array.from({ length: KNOB_SLOTS }, (_, i) => knobs[i] ?? UNUSED);
  return h(
    'div',
    { class: 'yh-knobbank', 'data-part': 'root', 'data-form': form, lang: 'en' },
    h(
      'div',
      { class: 'yh-knobbank__knobs', 'data-part': 'knobs' },
      each(
        slots,
        (_, i) => String(i),
        (knob, i) => {
          const name = knobName(knob, i);
          return h(
            'div',
            { class: 'yh-knobbank__slot', 'data-part': 'slot', 'data-unused': knob.unused ? 'true' : undefined },
            knob.unused
              ? emptyFace(name)
              : component('Knob', knobProps(knob, name), { on: { onpress: `press${i}`, onstep: `step${i}`, tipAction: 'tipAction' } }),
          );
        },
      ),
    ),
  );
}

/** The bank's handlers: each slot's press and steps with its position, and the tooltip action. */
export function knobBankHandlers({ onPress, onStep, tipAction }: Pick<KnobBankProps, 'onPress' | 'onStep' | 'tipAction'>): Handlers {
  const handlers: Handlers = { tipAction };
  for (let i = 0; i < KNOB_SLOTS; i++) {
    handlers[`press${i}`] = () => onPress?.(i);
    handlers[`step${i}`] = (delta: number) => onStep?.(i, delta);
  }
  return handlers;
}

/** One view of the Knobs region: its tab. */
export interface KnobBankPageView {
  id: string;
  label: string;
  tip: string;
}

/** The Knobs region's views (the pages, or the one `pageLabel` view) and the chosen one's id. */
export function knobBankPages({ pages = [], page = 0, pageLabel = '' }: Pick<KnobBankProps, 'pages' | 'page' | 'pageLabel'>): {
  views: KnobBankPageView[];
  view: string;
} {
  const names = pages.length > 0 ? pages : [pageLabel];
  return {
    views: names.map((label, i) => ({ id: String(i), label, tip: 'knobs.page' })),
    view: String(pages.length > 0 ? page : 0),
  };
}

/**
 * The Knobs region's tree: a library `Region` (drawn by name; its class as both `className` and
 * `class`, React's and Svelte's names) whose views are the knob pages, with the KnobBank as its
 * body. A tab choice is the handler `view` (the page's id), the bank's press and steps `press` and
 * `step`, the tooltip action `tipAction`. `form` goes to the bank, which reads the screen's otherwise.
 */
export function knobBankRegionView({ name = 'Knobs', area, knobs, pages, page, pageLabel, form }: KnobBankRegionModelProps, className?: string): ComponentNode {
  const { views, view } = knobBankPages({ pages, page, pageLabel });
  return component(
    'Region',
    { name, area, className, class: className, views, view },
    {
      on: { onView: 'view', tipAction: 'tipAction' },
      slots: { children: [component('KnobBank', { knobs, form }, { on: { onPress: 'press', onStep: 'step', tipAction: 'tipAction' } })] },
    },
  );
}

/** The region's handlers: a tab choice as the page's index, the bank's press and steps, the tooltip action. */
export function knobBankRegionHandlers({ onPage, onPress, onStep, tipAction }: KnobBankProps): Handlers {
  return { view: (id: string) => onPage?.(Number(id)), press: onPress, step: onStep, tipAction };
}
