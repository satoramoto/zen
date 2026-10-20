// SoundCell's model: its props (all but the marks, a React node or a Svelte snippet) and the view
// it draws from them. No framework: `SoundCell.tsx` (React) and `SoundCell.svelte` (Svelte) both
// render `soundCellView`.
import type { HueSlot } from '../../core/hue';
import { focusRing } from '../../../primitives/Ring';
import type { ElementView, TextModelProps } from '../../../primitives/Text.model';

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

/** A Text element's view: its Text props, its class and its other attributes. */
export interface TextPartView extends ElementView {
  text: TextModelProps;
}

/** What a renderer draws. */
export interface SoundCellView {
  /** The cell `<div>`. */
  root: ElementView;
  /** The short name's button (a label Text) and its text. */
  part: TextPartView & { label: string };
  /** The sound's button (a caption Text). */
  sound: TextPartView;
  /** The sound's name `<span>`. */
  title: { className: string; label: string };
  /** The sound's number (a caption Text), or null for none. */
  number: (TextPartView & { label: string }) | null;
  /** The marks' `<span>` class (drawn only when there are marks). */
  marksClassName: string;
}

/** The cell SoundCell draws from its props. */
export function soundCellView({
  part,
  partName,
  hue = 1,
  number = '',
  sound,
  off = false,
  soundName,
  partTip,
  soundTip,
}: SoundCellModelProps): SoundCellView {
  return {
    root: { className: 'yh-sound-cell', attrs: { 'data-hue': String(hue), 'data-off': off ? 'true' : undefined } },
    part: {
      text: { role: 'label', tabular: true },
      className: `yh-sound-cell__part ${focusRing}`,
      attrs: { type: 'button', title: partName, 'aria-label': `${partName}: open Channel`, 'data-tip': partTip },
      label: part,
    },
    sound: {
      text: { role: 'caption', size: 'body', tabular: true },
      className: `yh-sound-cell__sound ${focusRing}`,
      attrs: {
        type: 'button',
        'aria-label': soundName ?? `${partName} sound: ${[number, sound].filter(Boolean).join(' ')}. Opens the quick sound list`,
        'data-tip': soundTip,
      },
    },
    title: { className: 'yh-sound-cell__title', label: sound },
    number: number ? { text: { role: 'caption', tabular: true }, className: 'yh-sound-cell__number', attrs: {}, label: number } : null,
    marksClassName: 'yh-sound-cell__marks',
  };
}
