// TrackStrips' model: the looper's mixer in mix[flow]'s face, and the tree both renderers draw. No
// framework: `TrackStrips.tsx` and `TrackStrips.svelte` both pass `trackStripsView` and
// `trackStripsHandlers` to their `Tree`. DeckStrip's channel section is the anatomy, narrowed to
// one channel per track: its ink letter and name, two send knobs (A, B), a fader beside its meter
// in a well with the level in dB under it, and M / S / ● toggles; the FX A / FX B returns close
// the row at the right, a fader each. The strips hold no state: a fader asks `onLevel`, a knob
// `onSend`, a return `onReturn`, a toggle `onMute` / `onSolo` / `onArm`, a name `onSelect`. A
// part with no callback is drawn but can't be moved.
import { component, each, h, wire, type ChildArg, type Handlers, type Node } from '../../../view/Tree.model';
import type { Param } from '../../param/param';
import { inkStyle, livePane, liveReading, type LiveTrackRef } from '../live.model';
import type { TrackStripsForm } from './TrackStrips.forms';

/** One track's channel. */
export interface TrackStrip extends LiveTrackRef {
  /** Fader, 0–1 (1 is unity). */
  level: number;
  /** The last moment's measured peak, 0–1. Left out (or non-finite): no reading, so no meter is drawn, rather than a silent one. */
  meter?: number;
  /** FX A and FX B sends, 0–1. */
  sends?: readonly [number, number];
  muted?: boolean;
  soloed?: boolean;
  /** Armed to record into its next empty slot. */
  armed?: boolean;
}

/** One effect return after the tracks. */
export interface TrackReturn {
  id: string;
  name: string;
  /** Fader, 0–1. */
  level: number;
}

/** Which send: FX A (0) or FX B (1). */
export type TrackSend = 0 | 1;

export interface TrackStripsProps {
  /** The track channels, left to right. */
  tracks: readonly TrackStrip[];
  /** The effect returns at the right. */
  returns: readonly TrackReturn[];
  /** The selected track's id: its strip is marked. */
  selected?: string;
  /** A track's fader moved. */
  onLevel?: (change: { track: string; level: number }) => void;
  /** A track's send knob turned. */
  onSend?: (change: { track: string; send: TrackSend; level: number }) => void;
  /** A return's fader moved. */
  onReturn?: (change: { id: string; level: number }) => void;
  /** A track's M was pressed. */
  onMute?: (trackId: string) => void;
  /** A track's S was pressed. */
  onSolo?: (trackId: string) => void;
  /** A track's ● was pressed. */
  onArm?: (trackId: string) => void;
  /** A track's name was pressed: select it. */
  onSelect?: (trackId: string) => void;
  /** Draw this form outside an assembled screen (a screen's own choice wins inside one). */
  form?: TrackStripsForm;
  className?: string;
}

/** A fader's travel: 0–1, unity at the top. */
export const STRIP_LEVEL: Param = { kind: 'float', min: 0, max: 1, defaultValue: 0.8, name: 'Level' };
/** A send knob's travel: 0–1, read as a percentage. */
export const STRIP_SEND: Param = { kind: 'float', min: 0, max: 1, defaultValue: 0, name: 'Send' };

/** A 0–1 amount as mix[flow]'s knob reading: `40 %`. */
export const percentText = (value: number): string => `${Math.round(Math.max(0, Math.min(1, value)) * 100)} %`;

/** A 0–1 gain as decibels: `-1.9 dB`, `-inf dB` at the bottom. */
export function dbText(level: number): string {
  if (!Number.isFinite(level)) return '— dB';
  if (!(level > 0)) return '-inf dB';
  const db = 20 * Math.log10(Math.min(1, level));
  return `${Math.abs(db) < 0.05 ? '0.0' : db.toFixed(1)} dB`;
}

const SEND_NAMES = ['A', 'B'] as const;

const keyed = (child: ReturnType<typeof component>, key: string): ChildArg => ({ ...child, key });

function fader(label: string, level: number, key: string, inert: boolean, meter: number | undefined): Node {
  return h(
    'div',
    { class: 'live-track-strips-fader', 'data-part': 'fader' },
    keyed(component('MusicSlider', { name: '', showValue: false, label, param: STRIP_LEVEL, value: level, length: 'auto', disabled: inert }, { on: { onChange: key } }), 'slider'),
    meter === undefined ? null : keyed(component('MusicMeter', { value: meter, orientation: 'vertical', label: `${label.replace(/ level$/, '')} meter` }), 'meter'),
  );
}

function toggle(label: string, on: boolean, key: string, inert: boolean, text: string, ink?: string): ChildArg {
  return keyed(component('MusicToggle', { on, label, disabled: inert, ink, className: 'live-track-strips-toggle' }, { on: { onChange: key }, slots: { children: [text] } }), key);
}

function trackStrip(track: TrackStrip, props: TrackStripsProps, tall: boolean): Node {
  const { selected, onLevel, onSend, onMute, onSolo, onArm, onSelect } = props;
  const sends = track.sends ?? [0, 0];
  const isSelected = track.id === selected;
  return h(
    'div',
    {
      class: 'live-track-strips-strip',
      'data-part': 'strip',
      'data-track': track.id,
      'data-selected': isSelected ? 'true' : undefined,
      style: inkStyle(track.ink),
      role: 'group',
      'aria-label': track.name,
    },
    wire(
      h(
        'button',
        {
          class: 'live-track-strips-head',
          type: 'button',
          'data-part': 'head',
          'aria-label': `Select ${track.name}`,
          'aria-current': isSelected ? 'true' : undefined,
          disabled: onSelect === undefined ? '' : undefined,
        },
        h('b', { class: 'live-track-strips-mark', 'aria-hidden': 'true' }, track.name.slice(0, 1).toUpperCase()),
        h('span', { class: 'live-track-strips-name' }, track.name),
      ),
      { on: { click: `select:${track.id}` } },
    ),
    tall
      ? h(
          'div',
          { class: 'live-track-strips-sends', 'data-part': 'sends' },
          ...SEND_NAMES.map((name, send) =>
            keyed(
              component(
                'MusicKnob',
                { ink: 'var(--amber)', name, label: `${track.name} send ${name}`, param: STRIP_SEND, value: sends[send], display: percentText(sends[send]), disabled: onSend === undefined },
                { on: { onChange: `send:${track.id}:${send}` } },
              ),
              name,
            ),
          ),
        )
      : null,
    fader(`${track.name} level`, track.level, `level:${track.id}`, onLevel === undefined, Number.isFinite(track.meter) ? track.meter : undefined),
    liveReading(dbText(track.level), { class: 'live-reading live-track-strips-db', 'data-part': 'db' }),
    h(
      'div',
      { class: 'live-track-strips-toggles', 'data-part': 'toggles' },
      toggle(`${track.name} mute`, track.muted === true, `mute:${track.id}`, onMute === undefined, 'M'),
      toggle(`${track.name} solo`, track.soloed === true, `solo:${track.id}`, onSolo === undefined, 'S'),
      toggle(`${track.name} arm`, track.armed === true, `arm:${track.id}`, onArm === undefined, '●', 'var(--red)'),
    ),
  );
}

function returnStrip(ret: TrackReturn, inert: boolean, tall: boolean): Node {
  return h(
    'div',
    { class: 'live-track-strips-strip live-track-strips-return', 'data-part': 'return', 'data-return': ret.id, role: 'group', 'aria-label': ret.name },
    h('div', { class: 'live-track-strips-head', 'data-part': 'head' }, h('span', { class: 'live-track-strips-name' }, ret.name)),
    tall ? h('div', { class: 'live-track-strips-sends', 'aria-hidden': 'true' }) : null,
    fader(`${ret.name} level`, ret.level, `return:${ret.id}`, inert, undefined),
    liveReading(dbText(ret.level), { class: 'live-reading live-track-strips-db', 'data-part': 'db' }),
    h('div', { class: 'live-track-strips-toggles', 'aria-hidden': 'true' }),
  );
}

/**
 * The tree TrackStrips draws: one strip per track, then one per return, in a row whose parts line
 * up across strips. `tall` has every part; `short` drops the send knobs. `form` is the binding's
 * (`useForm` / `getForm`).
 */
export function trackStripsView(props: TrackStripsProps, form: TrackStripsForm): Node {
  const { tracks, returns, className, onReturn } = props;
  const tall = form === 'tall';
  return livePane(
    'track-strips',
    { class: className, 'data-form': form, 'aria-label': 'Track mixer' },
    tracks.length + returns.length === 0
      ? h('p', { class: 'live-track-strips-none', 'data-part': 'none' }, 'No tracks')
      : h(
          'div',
          { class: 'live-track-strips-row', 'data-part': 'strips' },
          ...each(tracks, (t) => `track:${t.id}`, (t) => trackStrip(t, props, tall)),
          ...each(returns, (r) => `return:${r.id}`, (r) => returnStrip(r, onReturn === undefined, tall)),
        ),
  );
}

const clamp01 = (v: number): number => Math.max(0, Math.min(1, v));

/** The callbacks the tree names: `select:`, `level:`, `send:<id>:<0|1>`, `mute:`, `solo:`, `arm:` per track, `return:` per return. */
export function trackStripsHandlers({ tracks, returns, onLevel, onSend, onReturn, onMute, onSolo, onArm, onSelect }: TrackStripsProps): Handlers {
  const handlers: Handlers = {};
  for (const { id } of tracks) {
    handlers[`select:${id}`] = () => onSelect?.(id);
    handlers[`level:${id}`] = (level: number) => onLevel?.({ track: id, level: clamp01(level) });
    handlers[`send:${id}:0`] = (level: number) => onSend?.({ track: id, send: 0, level: clamp01(level) });
    handlers[`send:${id}:1`] = (level: number) => onSend?.({ track: id, send: 1, level: clamp01(level) });
    handlers[`mute:${id}`] = () => onMute?.(id);
    handlers[`solo:${id}`] = () => onSolo?.(id);
    handlers[`arm:${id}`] = () => onArm?.(id);
  }
  for (const { id } of returns) handlers[`return:${id}`] = (level: number) => onReturn?.({ id, level: clamp01(level) });
  return handlers;
}
