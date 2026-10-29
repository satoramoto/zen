// Transport's model: playback, its tempo and where the head is, and the tree both renderers
// draw. No framework: `Transport.tsx` (React) and `Transport.svelte` (Svelte) both pass
// `transportView` and `transportHandlers` to their `Tree`. The transport holds no state and makes
// no sound: the host owns the engine and hands it the facts, and every press only asks.
// mix[flow]'s Transport is the behaviour reference (play/stop/loop/tempo/position in one row);
// the unit shown is the app's, toggled through `onUnit`, and the tempo is a plain number.
import { component, h, type Handlers, type Node } from '../../../view/Tree.model';
import { textView } from '../../../primitives/Text.model';
import type { TransportForm } from './Transport.forms';

/** The position reading's unit. */
export const TRANSPORT_UNITS = ['beats', 'seconds'] as const;
export type TransportUnit = (typeof TRANSPORT_UNITS)[number];

/** The loop switch. */
export interface TransportLoop {
  on: boolean;
  onChange(on: boolean): void;
  title?: string;
  /** Looping a part rather than the whole: the switch takes the accent face. */
  partial?: boolean;
}

/** The tempo as numbers: the field when `onChange` is given, a reading when not. */
export interface TransportTempo {
  value: number;
  display?: string;
  onChange?(next: number): void;
  label?: string;
  title?: string;
  disabled?: boolean;
}

/** Where the head is. */
export interface TransportPosition {
  /** Elapsed, in seconds. */
  seconds: number;
  /** In bars, from the top. With it the reading counts bar.beat.sixteenth. */
  bar?: number;
  /** How many bars there are, so the counter stops at the last one. */
  bars?: number;
}

/** Every Transport prop (the transport has no framework children). */
export interface TransportModelProps {
  /** Playing: the play button reads Pause. */
  playing: boolean;
  /** The play button was pressed: `true` from stopped, `false` from playing. */
  onPlay(playing: boolean): void;
  /** With it, a stop button. */
  onStop?(): void;
  /** Nothing to play: play and stop stay pressable but announce disabled. */
  disabled?: boolean;
  playTitle?: string;
  stopTitle?: string;
  /** With it, a loop switch. */
  loop?: TransportLoop;
  /** The loop switch was flipped. Wins over the loop's own `onChange`. */
  onLoop?: (on: boolean) => void;
  /** With it, the tempo. */
  tempo?: TransportTempo;
  /** Where the head is. */
  position: TransportPosition;
  /** The reading's unit; default `beats`. The reading toggles it through `onUnit`. */
  unit?: TransportUnit;
  /** The reading was toggled. */
  onUnit?: (unit: TransportUnit) => void;
  /** Classes added to the root, after the transport's own. */
  className?: string;
}

/** bar.beat.sixteenth, one-based, from a position measured in bars. */
export function positionText(bar: number, bars = Infinity): string {
  const whole = Math.floor(bar);
  const beat = Math.floor((bar - whole) * 4);
  const sixteenth = Math.floor(((bar - whole) * 4 - beat) * 4);
  return `${Math.min(whole, Math.max(0, bars - 1)) + 1}.${beat + 1}.${sixteenth + 1}`;
}

/** Minutes:seconds, from elapsed seconds. */
export function clockText(seconds: number): string {
  const s = Math.max(0, seconds);
  const m = Math.floor(s / 60);
  const rest = s - m * 60;
  return `${m}:${String(Math.floor(rest)).padStart(2, '0')}`;
}

/** The reading's text in the shown unit. */
export function readingText(position: TransportPosition, unit: TransportUnit): string {
  if (unit === 'seconds' || position.bar === undefined) return clockText(position.seconds);
  return positionText(position.bar, position.bars);
}

/**
 * The tree Transport draws: play, stop, loop, tempo and the position reading — or play and the
 * reading in `compact`. `form` is the binding's (`useForm` / `getForm`).
 */
export function transportView({ playing, onStop, disabled, playTitle, stopTitle, loop, tempo, position, unit = 'beats', className }: TransportModelProps, form: TransportForm): Node {
  const inert = disabled === true;
  const tempoText = textView({ role: 'numeral', tabular: true, className: 'yh-transport__tempo' });
  const full = form === 'bar';
  return h(
    'div',
    {
      class: `yh-transport${className ? ` ${className}` : ''}`,
      'data-part': 'root',
      'data-form': form,
      role: 'group',
      'aria-label': 'Transport',
      'data-disabled': inert ? 'true' : undefined,
    },
    component(
      'Button',
      { label: playing ? 'Pause' : 'Play', name: playTitle ?? (playing ? 'Pause' : 'Play'), size: 'sm', variant: playing ? 'primary' : 'secondary', disabled: inert },
      { on: { onPress: 'play' } },
    ),
    full && onStop
      ? component('Button', { label: 'Stop', name: stopTitle ?? 'Stop', size: 'sm', disabled: inert }, { on: { onPress: 'stop' } })
      : null,
    full && loop
      ? component('LampButton', { label: 'Loop', on: loop.on, waiting: !loop.on && loop.partial, name: loop.title ?? 'Loop', disabled: inert }, { on: { onToggle: 'loop' } })
      : null,
    full && tempo
      ? h(
          'span',
          { class: 'yh-transport__tempogroup', 'data-part': 'tempo' },
          tempo.onChange
            ? component('Button', { label: '−', name: 'Slower', size: 'sm', variant: 'quiet', disabled: inert || tempo.disabled }, { on: { onPress: 'slower' } })
            : null,
          h('span', { class: tempoText.className, ...tempoText.attrs, 'data-part': 'tempovalue' }, tempo.display ?? String(tempo.value)),
          tempo.onChange
            ? component('Button', { label: '+', name: 'Faster', size: 'sm', variant: 'quiet', disabled: inert || tempo.disabled }, { on: { onPress: 'faster' } })
            : null,
        )
      : null,
    component(
      'Button',
      { label: readingText(position, unit), name: position.bar === undefined ? `Elapsed time ${readingText(position, unit)}` : `${unit === 'beats' ? 'Beat position' : 'Elapsed time'} ${readingText(position, unit)}. Show ${unit === 'beats' ? 'elapsed time' : 'beat position'}` },
      { on: { onPress: 'unit' } },
    ),
  );
}

/** The callbacks `transportView`'s tree names: play, stop, loop, tempo steps and the unit. */
export function transportHandlers({ playing, onPlay, onStop, loop, onLoop, tempo, unit = 'beats', onUnit }: TransportModelProps): Handlers {
  return {
    play: () => onPlay(!playing),
    stop: () => onStop?.(),
    loop: () => (onLoop ?? loop?.onChange)?.(!loop?.on),
    slower: () => tempo?.onChange?.(Math.max(20, Math.round((tempo.value - 1) * 10) / 10)),
    faster: () => tempo?.onChange?.(Math.min(300, Math.round((tempo.value + 1) * 10) / 10)),
    unit: () => onUnit?.(unit === 'beats' ? 'seconds' : 'beats'),
  };
}
