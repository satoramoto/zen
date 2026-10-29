import { component, h, slot, when, wire, type Handlers, type Node } from '../../view/Tree.model';
import { buttonFaceView } from '../controls/ButtonFace.model';
import type { Param } from '../param/param';

export interface TransportLoop {
  on: boolean;
  onChange(on: boolean): void;
  title?: string;
  /** Looping a part rather than the whole: the switch takes the accent colour. */
  partial?: boolean;
}

/** The tempo as a field when `onChange` is given, and as a reading when it is not. */
export interface TransportTempo {
  param: Param;
  value: number;
  onChange?(next: number): void;
  display?: string;
  label?: string;
  title?: string;
  disabled?: boolean;
}

export interface TransportNormalSpeed {
  onPress(): void;
  disabled?: boolean;
  title?: string;
}

export interface TransportPosition {
  /** Elapsed, in seconds. */
  seconds: number;
  /** In bars, from the top. With it the reading can switch to bar.beat.sixteenth. */
  bar?: number;
  /** How many bars there are, so the counter stops at the last one. */
  bars?: number;
}

export interface TransportModelProps {
  playing: boolean;
  /** Pressed while stopped asks for `true`, while playing for `false`. */
  onPlay(playing: boolean): void;
  onStop?(): void;
  /** Nothing to play: only the play and stop buttons are disabled. */
  disabled?: boolean;
  playTitle?: string;
  stopTitle?: string;
  loop?: TransportLoop;
  tempo?: TransportTempo;
  normalSpeed?: TransportNormalSpeed;
  position: TransportPosition;
  fine?: boolean;
  latency?: number;
  /** Guarded localStorage key for the position unit; otherwise kept for this mount. */
  remember?: string;
  className?: string;
}

export type TransportUnit = 'beats' | 'seconds';

/** bar.beat.sixteenth, one-based, from a position measured in bars. */
export function positionText(bar: number, bars = Infinity): string {
  const whole = Math.floor(bar);
  const beat = Math.floor((bar - whole) * 4);
  const sixteenth = Math.floor(((bar - whole) * 4 - beat) * 4);
  return `${Math.min(whole, Math.max(0, bars - 1)) + 1}.${beat + 1}.${sixteenth + 1}`;
}

/** Minutes:seconds, to the millisecond when asked. */
export function clockText(seconds: number, fine = false): string {
  const s = Math.max(0, seconds);
  const m = Math.floor(s / 60);
  const rest = s - m * 60;
  return fine ? `${m}:${rest.toFixed(3).padStart(6, '0')}` : `${m}:${String(Math.floor(rest)).padStart(2, '0')}`;
}

const svg = (size: number, ...children: Node[]) => h('svg', { width: String(size), height: String(size), viewBox: '0 0 24 24', fill: 'currentColor', 'aria-hidden': 'true' }, children);
const play = svg(14, h('path', { d: 'M7 4.5v15l13-7.5z' }));
const pause = svg(14, h('rect', { x: '6', y: '4', width: '4', height: '16' }), h('rect', { x: '14', y: '4', width: '4', height: '16' }));
const stopMark = svg(12, h('rect', { x: '5', y: '5', width: '14', height: '14' }));
const loopMark = h('svg', { width: '14', height: '14', viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': '2', 'aria-hidden': 'true' }, h('path', { d: 'M4 9h13l-3-3M20 15H7l3 3' }));

function positionView(position: TransportPosition, fine: boolean | undefined, unit: TransportUnit): Node {
  const clock = clockText(position.seconds, fine);
  if (position.bar === undefined) return h('span', { class: 'wdg-transport-clock', 'aria-label': `Elapsed time ${clock}` }, clock);
  const beats = unit === 'beats';
  const text = beats ? positionText(position.bar, position.bars) : clock;
  const label = beats ? `Beat position ${text}. Show elapsed time` : `Elapsed time ${text}. Show beat position`;
  // Reuse the pressables lane's pure face, preserving the original button (no wrapper).
  return { ...buttonFaceView({ className: 'wdg-transport-clock wdg-transport-position', 'aria-label': label, title: label }), children: [text] };
}

/** The original transport row, without an inner theme or framework-owned behaviour. */
export function transportView(props: TransportModelProps, unit: TransportUnit = 'beats'): Node {
  const { playing, onStop, disabled, playTitle, stopTitle, loop, tempo, normalSpeed, position, fine, latency, remember, className } = props;
  return wire(h('div', { class: `wdg wdg-control-group wdg-transport${className ? ` ${className}` : ''}`, role: 'group', 'aria-label': 'Transport' },
    component('MusicButton', { label: playing ? 'Pause' : 'Play', title: playTitle ?? (playing ? 'Pause' : 'Play'), width: 26, disabled, className: playing ? 'wdg-transport-playing' : undefined }, { on: { onPress: 'play' }, slots: { children: [playing ? pause : play] } }),
    when(!!onStop, () => component('MusicButton', { label: 'Stop', title: stopTitle ?? 'Stop and return to the top', width: 26, disabled }, { on: { onPress: 'stop' }, slots: { children: [stopMark] } })),
    when(!!loop, () => component('MusicToggle', { on: loop!.on, label: 'Loop', title: loop!.title ?? 'Loop', width: 26, className: loop!.partial ? 'wdg-transport-looping-part' : undefined }, { on: { onChange: 'loop' }, slots: { children: [loopMark] } })),
    when(!!tempo, () => tempo!.onChange
      ? component('MusicNumberField', { param: tempo!.param, value: tempo!.value, display: tempo!.display, editable: true, showFill: false, width: 44, label: tempo!.label ?? 'Tempo', disabled: tempo!.disabled, title: tempo!.title }, { on: { onChange: 'tempo' } })
      : h('span', { class: 'wdg-transport-clock wdg-transport-tempo', 'aria-label': tempo!.label ?? 'Tempo', title: tempo!.title }, tempo!.display ?? String(tempo!.value))),
    when(!!normalSpeed, () => component('MusicButton', { label: 'Normal speed', disabled: normalSpeed!.disabled, title: normalSpeed!.title }, { on: { onPress: 'normalSpeed' }, slots: { children: ['1×'] } })),
    positionView(position, fine, unit),
    when(latency !== undefined, () => h('span', { class: 'wdg-transport-latency', title: "the output's latency, as the engine reports it" }, `${Math.round(latency! * 1000)} ms`)),
    slot('children'),
  ), { bind: [['musicTransportPosition', { remember, onUnit: 'unit' }]] });
}

export function transportHandlers(props: TransportModelProps, onUnit: (unit: TransportUnit) => void): Handlers {
  return { play: () => props.onPlay(!props.playing), stop: props.onStop, loop: props.loop?.onChange, tempo: props.tempo?.onChange, normalSpeed: props.normalSpeed?.onPress, unit: onUnit };
}
