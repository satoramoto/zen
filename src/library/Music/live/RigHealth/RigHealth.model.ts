// RigHealth's model: the rig's inputs, controllers and engine load, and the tree both renderers
// draw from them. No framework: `RigHealth.tsx` and `RigHealth.svelte` both pass `rigHealthView`
// and `rigHealthHandlers` to their `Tree`. The line holds no state: a press only asks `onOpen`.
import { each, h, styleText, when, wire, type ChildArg, type Handlers, type Node } from '../../../view/Tree.model';
import { liveAxis, livePane, liveReading } from '../live.model';
import type { RigHealthForm } from './RigHealth.forms';

/** An input's signal over the last second. */
export const SIGNAL_STATES = ['ok', 'low', 'none'] as const;
export type SignalState = (typeof SIGNAL_STATES)[number];

/** One audio or MIDI input the set listens to. */
export interface RigInput {
  id: string;
  name: string;
  state: SignalState;
  /** 0–1, the last second's peak. */
  level: number;
}

/** One controller the set is played from. */
export interface RigDevice {
  id: string;
  name: string;
  connected: boolean;
}

export interface RigHealthProps {
  inputs: readonly RigInput[];
  devices: readonly RigDevice[];
  /** The last seconds of DSP load, oldest first (0–1). */
  load: readonly number[];
  /** Buffer under-runs since the set started. */
  xruns?: number;
  /** Buffer size in frames. */
  frames?: number;
  /** Launch quantize: `'1 bar'`. It changes what every press does, so it leads the line. */
  quantize?: string;
  /** Count-in before a recording: `'1 bar'`. */
  countIn?: string;
  /** Draw this form outside an assembled screen (a screen's own choice wins inside one). */
  form?: RigHealthForm;
  /** An input or a device was pressed: open its settings. Without it the line is read-only. */
  onOpen?: (id: string) => void;
  className?: string;
}

const SIGNAL_WORD: Record<SignalState, string> = { ok: 'ok', low: 'low', none: 'no signal' };

/** The load as a sparkline in a 60 × 18 box, scaled to its own peak (never below a quarter, so a quiet engine reads quiet). */
export function loadPath(load: readonly number[]): string {
  const peak = Math.max(0.25, ...load);
  return load.map((v, i) => `${i === 0 ? 'M' : 'L'}${((i / Math.max(load.length - 1, 1)) * 60).toFixed(1)} ${(16 - (v / peak) * 14).toFixed(1)}`).join('');
}

function item(id: string, part: string, state: SignalState, label: string, inert: boolean, ...children: ChildArg[]): Node {
  return wire(
    h('button', { class: 'live-rig-item', type: 'button', 'data-part': part, 'data-state': state, disabled: inert ? '' : undefined, 'aria-label': label }, ...children),
    { on: { click: `open:${id}` } },
  );
}

/**
 * The tree RigHealth draws: one strip — the quantize reading, each input as a dot, its name and a
 * sliver of its level (its trouble word when it has one), each controller as a dot, and the DSP
 * load's sparkline with its reading. `form` is the binding's (`useForm` / `getForm`).
 */
export function rigHealthView({ inputs, devices, load, xruns = 0, frames, quantize, countIn, onOpen, className }: RigHealthProps, form: RigHealthForm): Node {
  const full = form === 'strip';
  const inert = onOpen === undefined;
  const last = load.length ? load[load.length - 1] : 0;
  return livePane(
    'rig',
    { class: className, 'data-form': form, role: 'status', 'aria-label': 'Rig status' },
    when(full && quantize !== undefined, () => liveReading(`Q ${quantize}${countIn ? ` · count-in ${countIn}` : ''}`, { 'data-part': 'quantize' })),
    h(
      'div',
      { class: 'live-rig-group', 'data-part': 'inputs' },
      when(full, () => liveAxis('In')),
      ...each(inputs, (i) => i.id, (i) =>
        item(
          i.id,
          'input',
          i.state,
          `${i.name} input, ${SIGNAL_WORD[i.state]}`,
          inert,
          h('span', { class: 'live-dot', 'data-state': i.state, 'aria-hidden': 'true' }),
          h('span', { class: 'live-rig-name' }, i.name),
          when(full && i.state !== 'none', () => h('span', { class: 'live-rig-level', 'aria-hidden': 'true' }, h('span', { style: styleText({ width: `${Math.round(i.level * 100)}%` }) }))),
          when(i.state !== 'ok', () => h('span', { class: 'live-rig-trouble', 'data-state': i.state }, SIGNAL_WORD[i.state])),
        ),
      ),
    ),
    h(
      'div',
      { class: 'live-rig-group', 'data-part': 'devices' },
      when(full, () => liveAxis('Control')),
      ...each(devices, (d) => d.id, (d) =>
        item(
          d.id,
          'device',
          d.connected ? 'ok' : 'none',
          `${d.name}, ${d.connected ? 'connected' : 'not connected'}`,
          inert,
          h('span', { class: 'live-dot', 'data-state': d.connected ? 'ok' : 'none', 'aria-hidden': 'true' }),
          when(full, () => h('span', { class: 'live-rig-name' }, d.name)),
        ),
      ),
    ),
    h(
      'div',
      { class: 'live-rig-group live-rig-load', 'data-part': 'load' },
      h('svg', { class: 'live-rig-spark', viewBox: '0 0 60 18', 'aria-hidden': 'true' }, h('path', { d: loadPath(load) })),
      liveReading(`cpu ${Math.round(last * 100)}% · ${xruns} xruns${full && frames ? ` · ${frames} frames` : ''}`, { 'data-trouble': xruns > 0 ? 'true' : undefined }),
    ),
  );
}

/** The callbacks the tree names: one open per input and device (`open:<id>`). */
export function rigHealthHandlers({ inputs, devices, onOpen }: RigHealthProps): Handlers {
  const handlers: Handlers = {};
  for (const { id } of [...inputs, ...devices]) handlers[`open:${id}`] = () => onOpen?.(id);
  return handlers;
}
