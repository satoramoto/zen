// StatusLine's model: its props, its assembly form, and the view a renderer draws from them (the
// root's Text props and attributes, the hint's parts, the message button). No framework:
// `StatusLine.tsx` (React) and `StatusLine.svelte` (Svelte) both render `statusLineView`.
import type { Forms } from '../../layout/assembly/types';

/** The line's one form, for an assembled screen's footer: one control height, full width. */
export const STATUS_LINE_FORMS: Forms<'line'> = [
  { id: 'line', min: { w: 0, h: { control: 1 } }, ideal: { w: 0, h: { control: 1 } }, grow: { w: true } },
];

/** A control's tooltip, shown in the line's place while the control is hovered or focused. */
export interface StatusHint {
  /** The entry's title. */
  title: string;
  /** What the control does. */
  body: string;
  /** Its keys, already labelled ("Y", "Shift+Y / F5"). */
  keys?: string | null;
  /** Where it is on the Launchkey. */
  launchkey?: string | null;
}

/** Every StatusLine prop (it has no children). */
export interface StatusLineModelProps {
  /** The hovered or focused control's tooltip: shown in place of the message while set. */
  hint?: StatusHint | null;
  /** `message.text`. `null` or `''`: no message, the line is empty. */
  text?: string | null;
  /** `message.error`: the error mark shows before the text. Ignored while there is no text. */
  error?: boolean;
  /** `message.seq`. A new value re-creates the button's contents, so a repeat is announced again. */
  seq?: number;
  /** A fixed width in px. Unset, the line fills its container. */
  width?: number;
  /** The tooltip key from `app/src/help/tooltips.ts`, as `data-tip` on the button. `null` turns it off. */
  tip?: string | null;
  /** Called on click, Enter or Space on the line's button; the parent sends `clearMessage`. */
  onClear?: () => void;
}

/** One place a hinted control is reached: its label ("Key", "Launchkey") and the keycap text. */
export interface StatusHintPlace {
  label: string;
  key: string;
}

export interface StatusLineView {
  /** The root `<p>`'s inline style (`width: 600px`), or undefined. */
  width: string | undefined;
  /** The hint drawn in the message's place, or null. `places` empty: no meta row. */
  hint: { title: string; body: string; places: StatusHintPlace[] } | null;
  /** The message button, or null with no text. */
  message: {
    className: string;
    attrs: Record<string, string | undefined>;
    /** The error chip and the hidden "Error:" show. */
    error: boolean;
    /** The text after the hidden "Error:" (a leading space on an error). */
    text: string;
    /** The key the contents are re-created on. */
    seq: number;
  } | null;
}

/** What the line draws from its props. */
export function statusLineView({ hint = null, text = null, error = false, seq = 0, width, tip = 'display.status' }: StatusLineModelProps): StatusLineView {
  const places: StatusHintPlace[] = [];
  if (hint?.keys) places.push({ label: 'Key', key: hint.keys });
  if (hint?.launchkey) places.push({ label: 'Launchkey', key: hint.launchkey });
  return {
    width: width === undefined ? undefined : `${width}px`,
    hint: hint ? { title: hint.title, body: hint.body, places } : null,
    message: text
      ? {
          className: hint ? 'yh-status-line-button yh-status-line-under' : 'yh-status-line-button',
          attrs: { 'data-part': 'button', 'data-tip': tip ?? undefined },
          error,
          text: error ? ` ${text}` : text,
          seq,
        }
      : null,
  };
}
