// MacroPads' model: a short bank of XY pads, each with its own caption, and the tree both renderers
// draw. No framework: `MacroPads.tsx` (React) and `MacroPads.svelte` (Svelte) both pass
// `macroPadsView` and `macroPadsHandlers` to their `Tree`. A pad is XYPad's own tree (`xyPadView`,
// drawn inline so the bank needs no component registration), with the move routed per pad id.
import type { HueSlot } from '../../core/hue';
import { surfaceView } from '../../../primitives/Surface.model';
import { textView } from '../../../primitives/Text.model';
import { each, h, when, type Handlers, type Node } from '../../../view/Tree.model';
import { xyPadView } from '../XYPad/XYPad.model';
import type { MacroPadsForm } from './MacroPads.forms';

/** The most pads a bank shows: four, two pairs. */
export const MACRO_PADS_MAX = 4;

/** One macro: a caption, two axes, the point and its trail. */
export interface MacroPad {
  /** What `onMove` carries ("fx-a", "filter"). Unique in the bank. */
  id: string;
  /** The caption over the field ("FX A DELAY THROW"). */
  label: string;
  /** The word at the bottom edge: what the horizontal axis controls. */
  xLabel?: string;
  /** The word up the left edge: what the vertical axis controls. */
  yLabel?: string;
  /** The point, 0–1 across. */
  x: number;
  /** The point, 0–1 up. */
  y: number;
  /** The field's identity: a hue slot. An app maps its meaning. */
  hue?: HueSlot;
  /** Where the finger has been, oldest first; the last 24 points fade behind the dot. */
  trail?: readonly (readonly [number, number])[];
  /** Shown but not usable: dimmed and deaf to drags. Default false. */
  disabled?: boolean;
}

/** Every MacroPads prop (it has no framework children). */
export interface MacroPadsModelProps {
  /** One to four macros, left to right. More are ignored. */
  pads: readonly MacroPad[];
  /** The form (`MACRO_PADS_FORMS`): `two-up` (two square fields across) or `one-up` (one wide). */
  form?: MacroPadsForm;
  /** Called with the pad's id and the point asked for (0–1, y up). */
  onMove?: (id: string, x: number, y: number) => void;
}

/** A Text's attributes (its class and `data-*`). */
function text(props: Parameters<typeof textView>[0], extra: Record<string, string | undefined> = {}): Record<string, string | undefined> {
  const view = textView(props);
  return { class: view.className, ...view.attrs, ...extra };
}

/** What no pads looks like: one empty `well` Surface, a place a bank will sit. */
function emptyWell(): Node {
  const well = surfaceView({ material: 'well', radius: 'control', border: true, className: 'yh-macropads__empty' });
  return h('div', { class: well.className, ...well.attrs, 'data-part': 'empty', 'aria-hidden': 'true' });
}

/**
 * The tree MacroPads draws: one `two-up` pair or a single `one-up` field, each with its caption
 * above it. Each pad is XYPad's tree, its move bound to `move:<id>` so `macroPadsHandlers` can hand
 * the id back to the owner.
 */
export function macroPadsView({ pads }: MacroPadsModelProps, form: MacroPadsForm = 'two-up'): Node {
  const shown = pads.slice(0, MACRO_PADS_MAX);
  const padForm = form === 'one-up' ? 'wide' : 'square';
  return h(
    'div',
    {
      class: 'yh-macropads',
      role: 'group',
      'aria-label': 'Macro pads',
      'data-form': form,
      'data-count': String(shown.length),
    },
    when(shown.length === 0, emptyWell),
    each(
      shown,
      (pad) => pad.id,
      (pad) =>
        h(
          'div',
          { class: 'yh-macropads__pad', 'data-pad': pad.id, role: 'group', 'aria-label': pad.label },
          h(
            'span',
            text({ role: 'label', size: 'caption', leading: 'tight', className: 'yh-macropads__label' }, { 'data-part': 'label', 'aria-hidden': 'true' }),
            pad.label,
          ),
          xyPadView(
            {
              x: pad.x,
              y: pad.y,
              xLabel: pad.xLabel,
              yLabel: pad.yLabel,
              hue: pad.hue,
              trail: pad.trail,
              disabled: pad.disabled,
            },
            padForm,
            `move:${pad.id}`,
          ),
        ),
    ),
  );
}

/** The callbacks `macroPadsView`'s tree names: one move per pad, carrying that pad's id. */
export function macroPadsHandlers({ pads, onMove }: MacroPadsModelProps): Handlers {
  const handlers: Handlers = {};
  for (const pad of pads.slice(0, MACRO_PADS_MAX)) {
    handlers[`move:${pad.id}`] = (x: number, y: number) => onMove?.(pad.id, x, y);
  }
  return handlers;
}
