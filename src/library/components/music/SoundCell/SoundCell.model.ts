// SoundCell's model: its props (all but the marks, a React node or a Svelte snippet) and the tree
// both renderers draw from them (the cell, the short name's button, the sound's button with its
// name, number and the `marks` slot). No framework: `SoundCell.tsx` (React) and `SoundCell.svelte`
// (Svelte) both pass `soundCellView` and `soundCellHandlers` to their `Tree`, with the marks as the
// `marks` slot.
import type { HueSlot } from '../../core/hue';
import { focusRing } from '../../../primitives/Ring';
import { textView, type TextModelProps } from '../../../primitives/Text.model';
import { h, slot, when, wire, type Handlers, type Node } from '../../../view/Tree.model';

export interface SoundCellModelProps {
  /** The part's short name ("R1", "L"). */
  part: string;
  /** The part's full name, for the buttons' names and the short name's title ("Right 1"). */
  partName: string;
  /** The part's categorical hue slot (`--hue-1` … `--hue-5`); an app maps its meaning (e.g. Yahaha's parts). Default 1. */
  hue?: HueSlot;
  /** The sound's number in its list ("41"). Empty: not shown. */
  number?: string;
  /** The sound's name; a long one ends in an ellipsis. */
  sound: string;
  /** The part is off: its short name fades in its own hue, the sound steps back. */
  off?: boolean;
  /** The sound button's accessible name. Default: "Right 1 sound: 1 Stage Grand. Opens the quick sound list". */
  soundName?: string;
  /** The tooltip key of the part's short name, set as `data-tip`. */
  partTip?: string;
  /** The tooltip key of the sound, set as `data-tip`. */
  soundTip?: string;
  /** Called when the short name is pressed (opens Channel). */
  onPart?: () => void;
  /** Called when the sound is pressed (opens the quick sound list). */
  onSound?: () => void;
}

/** Which of SoundCell's slots the caller filled: an empty slot draws no wrapper. */
export interface SoundCellSlots {
  /** `marks` were given (a React node, a Svelte snippet). */
  marks?: boolean;
}

/** A Text's attributes (its class and `data-*`). */
function text(props: TextModelProps): Record<string, string | undefined> {
  const view = textView(props);
  return { class: view.className, ...view.attrs };
}

/**
 * The tree SoundCell draws from its props: the cell, the short name (a label Text as a button,
 * `part` on click), then the sound (a caption Text as a button, `sound` on click) holding the name,
 * the number (a caption Text, when set) and the `marks` slot (when filled).
 */
export function soundCellView(
  { part, partName, hue = 1, number = '', sound, off = false, soundName, partTip, soundTip }: SoundCellModelProps,
  slots: SoundCellSlots = {},
): Node {
  return h(
    'div',
    { class: 'yh-sound-cell', 'data-hue': String(hue), 'data-off': off ? 'true' : undefined },
    wire(
      h(
        'button',
        {
          ...text({ role: 'label', tabular: true, className: `yh-sound-cell__part ${focusRing}` }),
          type: 'button',
          title: partName,
          'aria-label': `${partName}: open Channel`,
          'data-tip': partTip,
        },
        part,
      ),
      { on: { click: 'part' } },
    ),
    wire(
      h(
        'button',
        {
          ...text({ role: 'caption', size: 'body', tabular: true, className: `yh-sound-cell__sound ${focusRing}` }),
          type: 'button',
          'aria-label': soundName ?? `${partName} sound: ${[number, sound].filter(Boolean).join(' ')}. Opens the quick sound list`,
          'data-tip': soundTip,
        },
        h('span', { class: 'yh-sound-cell__title' }, sound),
        when(number !== '', () => h('span', text({ role: 'caption', tabular: true, className: 'yh-sound-cell__number' }), number)),
        when(slots.marks === true, () => h('span', { class: 'yh-sound-cell__marks' }, slot('marks'))),
      ),
      { on: { click: 'sound' } },
    ),
  );
}

/** The callbacks `soundCellView`'s tree names: a press on the short name and on the sound. */
export function soundCellHandlers(props: SoundCellModelProps): Handlers {
  return { part: () => props.onPart?.(), sound: () => props.onSound?.() };
}
