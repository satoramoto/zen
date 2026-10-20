// MetronomePopover's model: its props and what it draws from them (the dialog's attributes, the
// three rows' ids and labels, the caption), and which keys stay inside it. No framework:
// `MetronomePopover.tsx` (React) and `MetronomePopover.svelte` (Svelte) both render
// `metronomePopoverView`; Esc and a press outside are the `bindDismiss` store (`popover.ts`).
import type { TipAction } from '../../components/core/Button/Button.model';

export type { TipAction };

/** Every MetronomePopover prop (it has no children). */
export interface MetronomePopoverModelProps {
  /** The popover's id: the opener's `aria-controls` names it. */
  id?: string;
  /** The metronome on. */
  on?: boolean;
  /** The click's volume, 0–127. */
  volume?: number;
  /** A bell on the first beat of each bar. */
  bell?: boolean;
  /** The click can sound (the built-in synth is running); false shows a caption saying it can't. */
  audible?: boolean;
  /** The app's tooltip action, applied to every control with its key. */
  tipAction?: TipAction;
  /** Called with the state asked for when the metronome's On/Off is pressed. */
  onOn?: (on: boolean) => void;
  /** Called with the volume asked for (0–127). */
  onVolume?: (volume: number) => void;
  /** Called with the state asked for when the bell's On/Off is pressed. */
  onBell?: (on: boolean) => void;
  /** Called on Esc or a press outside the popover (not on its opener, which toggles it itself). */
  onClose?: () => void;
}

/** The label column's width, shared by the three rows. */
export const METRONOME_LABEL_WIDTH = 104;

/** What a renderer draws. */
export interface MetronomePopoverView {
  /** The dialog's id (the opener's `aria-controls`). */
  id: string;
  /** The dialog's class and its `data-*`, `id` and ARIA (its ARIA role is Text's `ariaRole`). */
  className: string;
  attrs: Record<string, string | undefined>;
  on: boolean;
  volume: number;
  bell: boolean;
  /** The two lamps' faces. */
  onLabel: string;
  bellLabel: string;
  /** Each settings row's id base, so the rows' label ids are the same in both renderers. */
  rowIds: { on: string; volume: string; bell: string };
  /** The "can't sound" caption shows. */
  note: boolean;
}

/** The popover MetronomePopover draws from its props. */
export function metronomePopoverView({
  id = 'metronome-settings',
  on = false,
  volume = 100,
  bell = false,
  audible = true,
}: MetronomePopoverModelProps): MetronomePopoverView {
  return {
    id,
    className: 'yh-metronome-popover',
    attrs: { 'data-part': 'root', id, 'aria-label': 'Metronome settings' },
    on,
    volume,
    bell,
    onLabel: on ? 'On' : 'Off',
    bellLabel: bell ? 'On' : 'Off',
    rowIds: { on: `${id}-on`, volume: `${id}-volume`, bell: `${id}-bell` },
    note: !audible,
  };
}

/** Keys the popover's own controls handle (the slider's steps): they stop here, so the window's
 * shortcuts (style step, pad page) don't also act on them. */
const OWN_KEYS = new Set(['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End']);

/** Whether a key pressed inside the popover stays there (its propagation stops). */
export function isOwnKey(key: string): boolean {
  return OWN_KEYS.has(key);
}
