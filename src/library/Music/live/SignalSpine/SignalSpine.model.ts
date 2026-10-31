// SignalSpine's model: one track as its signal path, and the tree both renderers draw from it. No
// framework: `SignalSpine.tsx` and `SignalSpine.svelte` both pass `signalSpineView` and
// `signalSpineHandlers` to their `Tree`. No clock: the looper's sweep is read from `beat`, and a
// press only asks a callback.
import { component, each, h, when, wire, type ChildArg, type Handlers, type Node } from '../../../view/Tree.model';
import type { Param } from '../../param/param';
import { inkStyle, liveAxis, liveHead, livePane, liveReading, type LiveTrackRef } from '../live.model';
import { frac, polar, sector } from '../polar';
import type { SignalSpineForm } from './SignalSpine.forms';

/** A track as the spine names it: a `LiveTrackRef` and where its sound comes from. */
export interface SpineTrack extends LiveTrackRef {
  /** `'pads'`, `'in 5 · bus'`, `'bus → arp'`. */
  source: string;
}

/** A small setting on a cartridge. With `amount` it is a knob; without, a mono reading (a rate, a mode). */
export interface SpineParam {
  name: string;
  /** What it reads as: `'60%'`, `'1/16'`. */
  value: string;
  /** 0–1, where a knob sits. Leave it out where a knob would lie. */
  amount?: number;
}

/** One cartridge on the cable. */
export interface SpineStage {
  /** `'input'`, `'gen'`, `'inst'`, `'looper'`, `'fx'`. The looper is the one with id `looper`. */
  id: string;
  title: string;
  /** The chosen option, in the head row. */
  value: string;
  /** The other options, behind the head. */
  options: readonly string[];
  params?: readonly SpineParam[];
  /** An empty stage: the signal passes through. */
  bypass?: boolean;
}

export const SPINE_LAYER_KINDS = ['base', 'dub'] as const;
export type SpineLayerKind = (typeof SPINE_LAYER_KINDS)[number];

/** One take in the looper. */
export interface SpineLayer {
  id: string;
  kind: SpineLayerKind;
  /** When it was laid down, as the set clock read: `'0:32'`. */
  at: string;
  muted?: boolean;
}

/** A knob turned on a cartridge. */
export interface SpineParamChange {
  stage: string;
  param: string;
  /** 0–1. */
  amount: number;
}

export interface SignalSpineProps {
  track: SpineTrack;
  /** The stages in signal order: Input, Generator, Instrument, Looper, FX. Out follows them. */
  chain: readonly SpineStage[];
  /** The looper's layers, oldest first: the base is innermost. */
  layers: readonly SpineLayer[];
  /** The loop's length in bars. */
  loopBars: number;
  /** The set clock in beats: the rings' sweep. */
  beat: number;
  /** Where it goes: `['Main L/R', 'IEM 2']`. */
  outs?: readonly string[];
  /** 0–1, the Out fader's setting (what `onLevel` asks to change). */
  level?: number;
  /**
   * 0–1, the output's measured level. With no `onLevel` and no `meter`, `level` is read as the
   * measurement (a read-only Out). Left out, or non-finite, there is no reading: Out says so rather
   * than drawing a silent meter.
   */
  meter?: number;
  onPrev?: () => void;
  onNext?: () => void;
  /** A cartridge's head was pressed: open its options. */
  onStage?: (stage: string) => void;
  /** Peel the outermost layer. */
  onUndo?: () => void;
  /** A ring was pressed: mute or unmute that layer. */
  onMuteLayer?: (layer: string) => void;
  /** A cartridge's knob was turned. Without it the knobs are read-only. */
  onParam?: (change: SpineParamChange) => void;
  /** The Out fader moved (0–1). Without it Out is a meter alone. */
  onLevel?: (level: number) => void;
  /** Draw this form outside an assembled screen (a screen's own choice wins inside one). */
  form?: SignalSpineForm;
  className?: string;
}

const AMOUNT: Param = { kind: 'float', min: 0, max: 1, defaultValue: 0, unit: 'percent' };
const LEVEL: Param = { kind: 'float', min: 0, max: 1, defaultValue: 0.8, unit: 'percent', name: 'Level' };
const n = (v: number): string => v.toFixed(2);
const HUB = 13;

/** The looper's rings in a 100 × 100 box: each layer's radius and band, base innermost. */
export function ringLayout(count: number): { band: number; radius: (index: number) => number; outer: number } {
  const band = count > 0 ? Math.min(8, 33 / count) : 0;
  return { band, radius: (i) => HUB + 2 + band * (i + 0.5), outer: HUB + 2 + band * count };
}

const layerWord = (l: SpineLayer, i: number): string => `layer ${i + 1}, ${l.kind} at ${l.at}`;

function rings(layers: readonly SpineLayer[], loopBars: number, beat: number, canMute: boolean): Node {
  const phase = frac(beat / Math.max(loopBars * 4, 1));
  const { band, radius, outer } = ringLayout(layers.length);
  const hand = [polar(0, 0, HUB, phase), polar(0, 0, outer + 1, phase)];
  return h(
    'div',
    { class: 'live-spine-dial' },
    h(
      'svg',
      { class: 'live-spine-rings', viewBox: '-50 -50 100 100', role: 'group', 'aria-label': `Loop, ${loopBars} bars, ${layers.length} layers` },
      h('circle', { class: 'live-spine-hub', r: String(HUB) }),
      ...each(layers, (l) => l.id, (l, i) => {
        const ring = h(
          'g',
          {
            class: 'live-spine-ring',
            'data-kind': l.kind,
            'data-muted': l.muted ? 'true' : undefined,
            'data-outer': i === layers.length - 1 && layers.length > 1 ? 'true' : undefined,
            role: canMute ? 'button' : undefined,
            tabindex: canMute ? '0' : undefined,
            'aria-pressed': canMute ? (l.muted ? 'true' : 'false') : undefined,
            'aria-label': `Mute ${layerWord(l, i)}`,
          },
          h('circle', { class: 'live-spine-band', r: n(radius(i)), 'stroke-width': n(band * 0.66) }),
          h('circle', { class: 'live-spine-hit', r: n(radius(i)), 'stroke-width': n(band) }),
        );
        return canMute ? wire(ring, { on: { click: `mute:${l.id}`, keydown: `muteKey:${l.id}` } }) : ring;
      }),
      when(layers.length > 0, () => h('path', { class: 'live-spine-sweep', d: sector(0, 0, HUB, outer + 1, phase - 0.08, phase) })),
      when(layers.length > 0, () => h('line', { class: 'live-spine-hand', x1: n(hand[0].x), y1: n(hand[0].y), x2: n(hand[1].x), y2: n(hand[1].y) })),
    ),
    h('div', { class: 'live-spine-bars', 'aria-hidden': 'true' }, h('b', {}, String(loopBars)), h('span', {}, loopBars === 1 ? 'bar' : 'bars')),
  );
}

function param(stage: SpineStage, p: SpineParam, canTurn: boolean): ChildArg {
  if (p.amount === undefined) return h('span', { class: 'live-spine-reading', 'data-param': p.name }, h('span', {}, p.name), h('b', {}, p.value));
  return component(
    'MusicKnob',
    { name: p.name, label: `${stage.title} ${p.name}`, param: AMOUNT, value: p.amount, display: p.value, disabled: !canTurn, ink: 'var(--stem-ink)' },
    { key: `${stage.id}-${p.name}`, on: { onChange: `param:${stage.id}:${p.name}` } },
  );
}

function head(stage: SpineStage, canOpen: boolean): Node {
  const shown = stage.bypass ? 'thru' : stage.value;
  return h(
    'div',
    { class: 'live-spine-heading' },
    liveAxis(stage.title),
    wire(
      h(
        'button',
        {
          class: 'live-spine-head',
          type: 'button',
          'aria-label': `${stage.title}: ${shown}`,
          title: stage.options.length ? `${stage.value} · also ${stage.options.join(', ')}` : stage.value,
          disabled: canOpen ? undefined : '',
        },
        h('span', { class: 'live-spine-value' }, shown),
        h('span', { class: 'live-spine-caret', 'aria-hidden': 'true' }),
      ),
      { on: { click: `stage:${stage.id}` } },
    ),
  );
}

function cartridge(stage: SpineStage, props: SignalSpineProps): Node {
  const { layers, loopBars, beat, onStage, onUndo, onMuteLayer, onParam } = props;
  const looper = stage.id === 'looper';
  const params = stage.bypass ? [] : (stage.params ?? []);
  return h(
    'div',
    { class: 'live-spine-cart', role: 'group', 'aria-label': stage.title, 'data-stage': stage.id, 'data-bypass': stage.bypass ? 'true' : undefined },
    head(stage, onStage !== undefined),
    when(looper && !stage.bypass, () =>
      h(
        'div',
        { class: 'live-spine-looper' },
        rings(layers, loopBars, beat, onMuteLayer !== undefined),
        h(
          'ol',
          { class: 'live-spine-layers', 'aria-hidden': 'true' },
          ...each([...layers].reverse(), (l) => l.id, (l, i) =>
            h('li', { 'data-kind': l.kind, 'data-muted': l.muted ? 'true' : undefined }, `L${layers.length - i} ${l.kind} ${l.at}`),
          ),
        ),
      ),
    ),
    when(!looper && stage.options.length > 0, () =>
      h('ul', { class: 'live-spine-options', 'aria-label': `${stage.title} options` }, ...stage.options.map((o) => h('li', {}, o))),
    ),
    when(params.length > 0 || looper, () =>
      h(
        'div',
        { class: 'live-spine-params' },
        ...params.map((p) => param(stage, p, onParam !== undefined)),
        when(looper && !stage.bypass, () =>
          component(
            'MusicButton',
            { label: 'Undo last layer', disabled: onUndo === undefined || layers.length < 2, className: 'live-spine-undo' },
            { on: { onPress: 'undo' }, slots: { children: ['Undo'] } },
          ),
        ),
      ),
    ),
  );
}

const cable = (key: string): Node => ({ ...h('span', { class: 'live-spine-cable', 'aria-hidden': 'true' }), key });

/**
 * The tree SignalSpine draws: the head row (◂ the track's letter, name and source ▸, the loop's
 * reading), then the cartridges on one cable — each a select-like head over its knobs and
 * readings, the looper's holding the layers as rings — and Out as a meter in a well. `form` is the
 * binding's: `chain` left to right, `column` stacked.
 */
export function signalSpineView(props: SignalSpineProps, form: SignalSpineForm): Node {
  const { track, chain, layers, loopBars, outs = [], level, onPrev, onNext, onLevel, className } = props;
  const column = form === 'column';
  const arrow = (label: string, glyph: string, key: string, live: boolean) =>
    component('MusicButton', { label, disabled: !live, className: 'live-spine-arrow' }, { on: { onPress: key }, slots: { children: [glyph] } });
  // A fader's setting is not a measurement: only a read-only Out reads `level` as one.
  const measured = props.meter ?? (onLevel === undefined ? level : undefined);
  const reading = measured !== undefined && Number.isFinite(measured) ? measured : undefined;
  const setting = level !== undefined && Number.isFinite(level) ? level : 0;
  const meter =
    reading === undefined
      ? h('span', { class: 'live-axis', 'data-part': 'no-reading' }, 'no reading')
      : component('MusicMeter', {
          label: `${track.name} output level`,
          value: reading,
          orientation: column ? 'horizontal' : 'vertical',
          length: column ? 96 : 72,
          ink: 'var(--stem-ink)',
        });
  const out = h(
    'div',
    { class: 'live-spine-out', role: 'group', 'aria-label': 'Out', 'data-stage': 'out' },
    liveAxis('Out'),
    h(
      'div',
      { class: 'live-spine-well' },
      meter,
      when(onLevel !== undefined, () =>
        component('MusicSlider', { name: '', label: `${track.name} level`, param: LEVEL, value: setting, orientation: column ? 'horizontal' : 'vertical', length: column ? 96 : 72, showValue: false }, { on: { onChange: 'level' } }),
      ),
    ),
    liveReading(onLevel !== undefined ? `${Math.round(setting * 100)}%` : reading === undefined ? '—' : `${Math.round(reading * 100)}%`, { 'data-part': 'out-reading' }),
    h('div', { class: 'live-spine-outs' }, ...outs.map((o) => h('span', {}, o))),
  );
  const nodes: Node[] = [];
  chain.forEach((stage) => {
    nodes.push({ ...cartridge(stage, props), key: stage.id });
    nodes.push(cable(`${stage.id}-cable`));
  });
  return livePane(
    'spine',
    { class: className, 'data-form': form, style: inkStyle(track.ink), 'aria-label': `${track.name} signal path` },
    h(
      'div',
      { class: 'live-spine-bar' },
      arrow('Previous track', '◂', 'prev', onPrev !== undefined),
      liveHead({ mark: track.name.slice(0, 1), title: track.name, sub: track.source, ink: track.ink }),
      arrow('Next track', '▸', 'next', onNext !== undefined),
      liveReading(`${loopBars} ${loopBars === 1 ? 'bar' : 'bars'} · ${layers.length} ${layers.length === 1 ? 'layer' : 'layers'}`, { class: 'live-reading live-spine-aside' }),
    ),
    h('div', { class: 'live-spine-chain' }, ...nodes, out),
  );
}

/** The callbacks the tree names: the arrows, each stage's head, each knob, each ring, Undo and the fader. */
export function signalSpineHandlers({ chain, layers, onPrev, onNext, onStage, onUndo, onMuteLayer, onParam, onLevel }: SignalSpineProps): Handlers {
  const handlers: Handlers = {
    prev: onPrev && (() => onPrev()),
    next: onNext && (() => onNext()),
    undo: onUndo && (() => onUndo()),
    level: (next: number) => onLevel?.(next),
  };
  for (const stage of chain) {
    handlers[`stage:${stage.id}`] = () => onStage?.(stage.id);
    for (const p of stage.params ?? []) handlers[`param:${stage.id}:${p.name}`] = (amount: number) => onParam?.({ stage: stage.id, param: p.name, amount });
  }
  for (const { id } of layers) {
    handlers[`mute:${id}`] = () => onMuteLayer?.(id);
    handlers[`muteKey:${id}`] = (event: KeyboardEvent) => {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      event.preventDefault();
      onMuteLayer?.(id);
    };
  }
  return handlers;
}
