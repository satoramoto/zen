// MixBand's model: column-aligned strips of meter, fader, sends and lamps, and the tree both
// renderers draw. No framework: `MixBand.tsx` (React) and `MixBand.svelte` (Svelte) both pass
// `mixBandView` and `mixBandHandlers` to their `Tree`. The band holds no state: a fader asks for
// `onLevel`, a bar for `onSend`, a lamp for its toggle. Yahaha's FaderBank and SendList are the
// behaviour references (strips, send layers, lamp rows); the strips wrap `Meter`, `Fader`,
// `LampButton` and the SendBars subtree, so no registered component is re-drawn.
import type { HueSlot } from '../../core/hue';
import { textView } from '../../../primitives/Text.model';
import { component, each, h, wire, type Handlers, type Node } from '../../../view/Tree.model';
import { sendBarsHandlers, sendBarsView } from '../SendBars/SendBars.model';
import type { LiveSend, LiveTrack } from '../live.model';
import type { MixBandForm } from './MixBand.forms';

/** Every MixBand prop (the band has no framework children). */
export interface MixBandModelProps {
  /** The track strips, left to right. */
  tracks: readonly LiveTrack[];
  /** The effect returns after the tracks: meter, fader and name each, no sends, no lamps. */
  sends?: readonly LiveSend[];
  /** The selected track's id: it keeps a rule under its name. */
  selected?: string;
  /** A track's level was set, 0–1. */
  onLevel?: (id: string, value: number) => void;
  /** A track's send was set, 0–1. */
  onSend?: (id: string, which: 0 | 1, value: number) => void;
  /** A return's level was set, 0–1. */
  onReturn?: (id: string, value: number) => void;
  /** A track's arm lamp was pressed. */
  onArm?: (id: string) => void;
  /** A track's mute lamp was pressed. */
  onMute?: (id: string) => void;
  /** A track's solo lamp was pressed. */
  onSolo?: (id: string) => void;
  /** A track's name was pressed. */
  onSelect?: (id: string) => void;
  /** Shown, dimmed, deaf: the mix is read, not ridden. */
  disabled?: boolean;
  /** Classes added to the root, after the band's own. */
  className?: string;
}

const sendPrefix = (id: string): string => `t${id}:`;

function stripNode(track: LiveTrack, selected: string | undefined, inert: boolean): Node {
  const name = textView({ role: 'label', leading: 'tight', className: 'yh-mixband__name' });
  const sends: readonly [number, number] = track.sends ?? [0, 0];
  return h(
    'div',
    {
      class: 'yh-mixband__strip',
      'data-part': 'strip',
      'data-track': track.id,
      'data-hue': String(track.hue),
      'data-selected': track.id === selected ? 'true' : undefined,
      'data-parked': track.parked ? 'true' : undefined,
    },
    wire(
      h(
        'button',
        {
          class: 'yh-mixband__head',
          type: 'button',
          'data-part': 'head',
          'data-selected': track.id === selected ? 'true' : undefined,
          'aria-label': `select ${track.name}`,
          'aria-current': track.id === selected ? 'true' : undefined,
          'aria-disabled': inert ? 'true' : undefined,
        },
        h('span', { class: 'yh-mixband__mark', 'data-part': 'mark', 'aria-hidden': 'true' }),
        h('span', { class: name.className, ...name.attrs, 'data-part': 'headname' }, track.name),
      ),
      { on: { click: `select:${track.id}` } },
    ),
    component(
      'Meter',
      { value: track.meter ?? 0, label: `${track.name} meter` },
      undefined,
    ),
    component(
      'Fader',
      {
        name: `${track.name} level`,
        value: String(Math.round(track.level * 127)),
        level: Math.round(track.level * 127),
        meter: track.meter,
        hue: track.hue,
        kind: track.parked ? 'parked' : 'part',
      },
      { on: { onlevel: `level:${track.id}` } },
    ),
    sendBarsView({ sends, hues: [track.hue, track.hue], disabled: inert }, 'bars', sendPrefix(track.id)),
    h(
      'div',
      { class: 'yh-mixband__lamps', 'data-part': 'lamps' },
      component('LampButton', { label: 'M', on: track.muted, name: `${track.name} mute` }, { on: { onToggle: `mute:${track.id}` } }),
      component('LampButton', { label: 'S', on: track.soloed, name: `${track.name} solo` }, { on: { onToggle: `solo:${track.id}` } }),
      component('LampButton', { label: 'Arm', on: track.armed, rec: true, name: `${track.name} arm` }, { on: { onToggle: `arm:${track.id}` } }),
    ),
  );
}

function returnNode(send: LiveSend, inert: boolean): Node {
  const name = textView({ role: 'label', leading: 'tight', className: 'yh-mixband__name' });
  return h(
    'div',
    {
      class: 'yh-mixband__strip yh-mixband__strip--return',
      'data-part': 'return',
      'data-send': send.id,
      'data-hue': send.hue === undefined ? undefined : String(send.hue),
    },
    h('span', { class: name.className, ...name.attrs, 'data-part': 'headname' }, send.name),
    component('Meter', { value: send.level, label: `${send.name} meter` }, undefined),
    component(
      'Fader',
      {
        name: `${send.name} level`,
        value: String(Math.round(send.level * 127)),
        level: Math.round(send.level * 127),
        hue: send.hue,
        kind: 'group',
      },
      { on: { onlevel: `return:${send.id}` } },
    ),
  );
}

/**
 * The tree MixBand draws: one strip per track (name, meter, fader, two sends, M / S / Arm),
 * then one return per send. `form` is the binding's: `tall` keeps the travel, `short` tightens it.
 */
export function mixBandView({ tracks, sends = [], selected, disabled, className }: MixBandModelProps, form: MixBandForm): Node {
  const inert = disabled === true;
  return h(
    'div',
    {
      class: `yh-mixband${className ? ` ${className}` : ''}`,
      'data-part': 'root',
      'data-form': form,
      'data-disabled': inert ? 'true' : undefined,
    },
    each(tracks, (t) => t.id, (track) => stripNode(track, selected, inert)),
    each(sends, (s) => s.id, (send) => returnNode(send, inert)),
  );
}

/** The callbacks `mixBandView`'s tree names: levels, sends, returns, lamps and selects. */
export function mixBandHandlers({ tracks, sends = [], onLevel, onSend, onReturn, onArm, onMute, onSolo, onSelect }: MixBandModelProps): Handlers {
  const handlers: Handlers = {};
  tracks.forEach((track) => {
    handlers[`select:${track.id}`] = () => onSelect?.(track.id);
    handlers[`level:${track.id}`] = (level: number) => onLevel?.(track.id, Math.max(0, Math.min(1, level / 127)));
    handlers[`mute:${track.id}`] = () => onMute?.(track.id);
    handlers[`solo:${track.id}`] = () => onSolo?.(track.id);
    handlers[`arm:${track.id}`] = () => onArm?.(track.id);
    Object.assign(
      handlers,
      sendBarsHandlers(
        { sends: track.sends ?? [0, 0], onSend: (which, value) => onSend?.(track.id, which, value) },
        sendPrefix(track.id),
      ),
    );
  });
  sends.forEach((send) => {
    handlers[`return:${send.id}`] = (level: number) => onReturn?.(send.id, Math.max(0, Math.min(1, level / 127)));
  });
  return handlers;
}
