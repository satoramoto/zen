// SendBars' model: two thin horizontal send bars with a unity hinge, and the tree both
// renderers draw. No framework: `SendBars.tsx` (React) and `SendBars.svelte` (Svelte) both pass
// `sendBarsView` and `sendBarsHandlers` to their `Tree`. A bar is set by pressing anywhere on it
// (a drag carries it; the arrows nudge it); the app moves it when `sends` does. Set's mixer band
// is the behaviour reference (horizontal sends with their unity hinge); the hinge at 0.75 is this
// widget's own detent.
import type { HueSlot } from '../../core/hue';
import { textView } from '../../../primitives/Text.model';
import { h, styleText, wire, type Handlers, type Node } from '../../../view/Tree.model';
import { SEND_UNITY, type SendBarsForm } from './SendBars.forms';

/** Every SendBars prop (the bars have no framework children). */
export interface SendBarsModelProps {
  /** Send A and send B, 0–1 each. */
  sends: readonly [number, number];
  /** The bars' words. Default `['A', 'B']`. */
  names?: readonly [string, string];
  /** Each bar's categorical hue slot. What it means is the app's. */
  hues?: readonly [HueSlot?, HueSlot?];
  /** A bar was set, by press, drag or key. */
  onSend?: (which: 0 | 1, value: number) => void;
  /** Shown, dimmed, deaf: the sends are read, not set. */
  disabled?: boolean;
  /** Classes added to the root, after the bars' own. */
  className?: string;
}

/** Clamp a send to the 0–1 the bar draws. */
export const clampSend = (value: number): number => Math.max(0, Math.min(1, value));

/** A press or drag's fraction across the bar's box. */
function fractionOf(clientX: number, target: Element): number {
  const box = target.getBoundingClientRect();
  if (box.width <= 0) return 0;
  return Math.max(0, Math.min(1, (clientX - box.left) / box.width));
}

function rowNode(
  which: 0 | 1,
  value: number,
  name: string,
  hue: HueSlot | undefined,
  inert: boolean,
  key: string,
): Node {
  const at = clampSend(value);
  const label = textView({ role: 'caption', tone: 'muted', className: 'yh-sendbars__label' });
  return h(
    'div',
    { class: 'yh-sendbars__row', 'data-part': 'row', 'data-send': String(which) },
    h('span', { class: label.className, ...label.attrs, 'data-part': 'label' }, name),
    wire(
      h(
        'div',
        {
          class: 'yh-sendbars__bar',
          role: 'slider',
          tabindex: '0',
          'data-part': 'bar',
          'data-hue': hue === undefined ? undefined : String(hue),
          'aria-label': `${name} send`,
          'aria-valuemin': '0',
          'aria-valuemax': '1',
          'aria-valuenow': String(at),
          'aria-valuetext': `${Math.round(at * 100)} percent${Math.abs(at - SEND_UNITY) < 0.005 ? ', unity' : ''}`,
          'aria-disabled': inert ? 'true' : undefined,
          style: styleText({ '--yh-sendbars-at': `${at * 100}%` }),
        },
        h('span', { class: 'yh-sendbars__track', 'data-part': 'track', 'aria-hidden': 'true' }),
        h('span', { class: 'yh-sendbars__fill', 'data-part': 'fill', 'aria-hidden': 'true' }),
        h('span', { class: 'yh-sendbars__hinge', 'data-part': 'hinge', 'aria-hidden': 'true' }),
        h('span', { class: 'yh-sendbars__thumb', 'data-part': 'thumb', 'aria-hidden': 'true' }),
      ),
      { on: { pointerdown: key, keydown: key } },
    ),
  );
}

/**
 * The tree SendBars draws: two rows of label plus bar, the hinge at unity on each bar, the fill
 * and thumb at the value. `form` is the binding's (`useForm` / `getForm`); `prefix` names its
 * handler keys, so a composite (MixBand's strips) can embed several and still route each bar.
 */
export function sendBarsView({ sends, names = ['A', 'B'] as const, hues, disabled, className }: SendBarsModelProps, form: SendBarsForm, prefix = ''): Node {
  const inert = disabled === true;
  const [a, b] = sends;
  return h(
    'div',
    {
      class: `yh-sendbars${className ? ` ${className}` : ''}`,
      'data-part': 'root',
      'data-form': form,
      'data-disabled': inert ? 'true' : undefined,
    },
    rowNode(0, a, names[0], hues?.[0], inert, `${prefix}send0`),
    rowNode(1, b, names[1], hues?.[1], inert, `${prefix}send1`),
  );
}

/**
 * The callbacks `sendBarsView`'s tree names: one per bar, shared by its press and its keys. A
 * pointer press sets the bar and carries it until release; an arrow nudges it a fiftieth (a
 * tenth with shift); Home and End take its ends. `prefix` is the view's: a composite embedding
 * several bars routes each one.
 */
export function sendBarsHandlers({ sends, onSend, disabled }: SendBarsModelProps, prefix = ''): Handlers {
  if (disabled === true || onSend === undefined) return {};
  const handlers: Handlers = {};
  ([0, 1] as const).forEach((which) => {
    handlers[`${prefix}send${which}`] = (event: Event) => {
      if (event instanceof KeyboardEvent) {
        const at = clampSend(sends[which]);
        const step = event.shiftKey ? 0.1 : 0.02;
        if (event.key === 'ArrowLeft' || event.key === 'ArrowDown') onSend(which, clampSend(at - step));
        else if (event.key === 'ArrowRight' || event.key === 'ArrowUp') onSend(which, clampSend(at + step));
        else if (event.key === 'Home') onSend(which, 0);
        else if (event.key === 'End') onSend(which, 1);
        else return;
        event.preventDefault();
        return;
      }
      if (!(event instanceof PointerEvent)) return;
      if (event.button !== 0) return;
      const bar = event.currentTarget as Element | null;
      if (!bar) return;
      event.preventDefault();
      onSend(which, fractionOf(event.clientX, bar));
      const move = (moveEvent: PointerEvent) => onSend(which, fractionOf(moveEvent.clientX, bar));
      const up = () => {
        window.removeEventListener('pointermove', move);
        window.removeEventListener('pointerup', up);
      };
      window.addEventListener('pointermove', move);
      window.addEventListener('pointerup', up);
    };
  });
  return handlers;
}
