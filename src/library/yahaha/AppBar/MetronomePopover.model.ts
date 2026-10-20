// MetronomePopover's model: its props, the tree it draws from them (the dialog, its title, the three
// settings rows with their controls, the caption) and the handlers that tree names. No framework:
// `MetronomePopover.tsx` (React) and `MetronomePopover.svelte` (Svelte) both pass
// `metronomePopoverView` and `metronomePopoverHandlers` to their `Tree`; Esc and a press outside are
// the `dismiss` store (`popover.ts`, registered in `src/library/view/stores.ts`).
import type { TipAction } from '../../components/core/Button/Button.model';
import { textView } from '../../primitives/Text.model';
import { component, h, when, wire, type ComponentNode, type Handlers, type Node } from '../../view/Tree.model';

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

/** A settings row (by name) holding one control. */
const row = (id: string, label: string, control: ComponentNode) =>
  component('SettingsRow', { id, label, labelWidth: METRONOME_LABEL_WIDTH }, { slots: { children: [control] } });

/**
 * The tree MetronomePopover draws from its props: the dialog (a Text as a `div`), its title, the
 * On/off, Volume and Bell rows (SettingsRow with a LampButton or a LineSlider, by name) and, when
 * the click can't sound, a caption. It binds `dismiss` (Esc and press-outside call `close`) and its
 * keydown (`keydown`) keeps the slider's keys from the window.
 *
 * `tipAction` reaches the controls as a prop, not a handler key, so it keeps its identity across
 * renders and the controls' tips are not reapplied each time.
 */
export function metronomePopoverView({
  id = 'metronome-settings',
  on = false,
  volume = 100,
  bell = false,
  audible = true,
  tipAction,
}: MetronomePopoverModelProps): Node {
  const box = textView({ ariaRole: 'dialog', className: 'yh-metronome-popover' });
  const title = textView({ role: 'label', tone: 'primary', className: 'yh-metronome-popover__title' });
  const note = textView({ size: 'caption', className: 'yh-metronome-popover__note' });
  return wire(
    h(
      'div',
      { class: box.className, ...box.attrs, 'data-part': 'root', id, 'aria-label': 'Metronome settings', tabindex: '-1' },
      h('span', { class: title.className, ...title.attrs, 'data-part': 'title' }, 'Metronome'),
      row(
        `${id}-on`,
        'On/off',
        component(
          'LampButton',
          { label: on ? 'On' : 'Off', on, size: 'sm', name: 'Metronome on/off', tip: 'metronome.on', tipAction },
          { on: { onToggle: 'on' } },
        ),
      ),
      row(
        `${id}-volume`,
        'Volume',
        component(
          'LineSlider',
          { value: volume, min: 0, max: 127, name: 'Metronome volume', width: 120, tip: 'metronome.volume', tipAction },
          { on: { onchange: 'volume' } },
        ),
      ),
      row(
        `${id}-bell`,
        'Bell on beat 1',
        component(
          'LampButton',
          { label: bell ? 'On' : 'Off', on: bell, size: 'sm', name: 'Bell on beat 1', tip: 'metronome.bell', tipAction },
          { on: { onToggle: 'bell' } },
        ),
      ),
      when(!audible, () =>
        h('p', { class: note.className, ...note.attrs, 'data-part': 'note' }, "The built-in synth isn't running: the click can't sound."),
      ),
    ),
    { on: { keydown: 'keydown' }, bind: [['dismiss', { id, onClose: 'close' }]] },
  );
}

/** The callbacks `metronomePopoverView`'s tree names: the three controls', Esc/press-outside's
 *  `close`, and `keydown`, which stops the keys the popover's own controls handle (`isOwnKey`). */
export function metronomePopoverHandlers(props: MetronomePopoverModelProps): Handlers {
  return {
    on: (next: boolean) => props.onOn?.(next),
    volume: (v: number) => props.onVolume?.(v),
    bell: (next: boolean) => props.onBell?.(next),
    close: () => props.onClose?.(),
    keydown: (event: KeyboardEvent) => {
      if (isOwnKey(event.key)) event.stopPropagation();
    },
  };
}

/** Keys the popover's own controls handle (the slider's steps): they stop here, so the window's
 * shortcuts (style step, pad page) don't also act on them. */
const OWN_KEYS = new Set(['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End']);

/** Whether a key pressed inside the popover stays there (its propagation stops). */
export function isOwnKey(key: string): boolean {
  return OWN_KEYS.has(key);
}
