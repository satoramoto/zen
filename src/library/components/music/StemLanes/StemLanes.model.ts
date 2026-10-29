// StemLanes' model: its props, the mirrored envelope it draws, and the tree both renderers draw
// (the deck's plate, the shared ruler with the window band, the cue flags and the playhead, then a
// lane per stem: hue mark, name, envelope and the M / S lamp pair). No framework: `StemLanes.tsx`
// (React) and `StemLanes.svelte` (Svelte) both pass `stemLanesView` and `stemLanesHandlers` to their
// `Tree`. The deck is fully controlled: a cue flag and a lamp only call back, and the app decides
// what a toggle meant.
import type { LiveCue, LiveStem, LiveWindow } from '../live.model';
import { focusRing } from '../../../primitives/Ring';
import { surfaceView } from '../../../primitives/Surface.model';
import { textView, type TextModelProps } from '../../../primitives/Text.model';
import { component, each, h, styleText, when, wire, type Child, type Handlers, type Node } from '../../../view/Tree.model';
import { STEM_LANES_SIZE, type StemLanesForm } from './StemLanes.forms';

/** Every StemLanes prop (it takes no framework children). */
export interface StemLanesModelProps {
  /** The stems, top to bottom. An empty list draws the deck's empty face. */
  stems: readonly LiveStem[];
  /** The hot cues on the shared ruler, at their 0–1 positions. */
  cues?: readonly LiveCue[];
  /** The loop window, 0–1 on the ruler: a shaded band with hairline edges. Absent: no band. */
  window?: LiveWindow;
  /** Where playback is, 0–1 across the ruler: the playhead. Absent: no playhead. */
  position?: number;
  /** The stem the `one` form draws (its id). Unset or unknown: the first stem. */
  selected?: string;
  /** A cue flag was pressed, with its id. */
  onCue?: (id: string) => void;
  /** A lane's M or S lamp was pressed, with the stem's id. What it toggled is the app's. */
  onToggle?: (id: string) => void;
}

/** A 0–1 fraction, clamped (and safe against a missing or non-finite value). */
export const clamp01 = (fraction: number): number => (Number.isFinite(fraction) ? Math.min(1, Math.max(0, fraction)) : 0);

const round = (n: number): number => Math.round(n * 100) / 100;

/**
 * A lane's peaks as one mirrored envelope path, in a 0–100 box: the tops left to right, then the
 * same points back along the mirror, closed. Peak heights are fractions of the half-height, never
 * px. An empty lane is the centre line; a single bucket is a band across the whole width, so
 * silence and one sample both still draw something.
 */
export function envelopePath(peaks: readonly number[]): string {
  const mid = 50;
  const n = peaks.length;
  if (n === 0) return `M0 ${mid} L100 ${mid}`;
  if (n === 1) {
    const reach = clamp01(peaks[0]) * mid;
    return `M0 ${round(mid - reach)} L100 ${round(mid - reach)} L100 ${round(mid + reach)} L0 ${round(mid + reach)} Z`;
  }
  const top: string[] = [];
  const bottom: string[] = [];
  for (let i = 0; i < n; i++) {
    const x = (i / (n - 1)) * 100;
    const reach = clamp01(peaks[i]) * mid;
    top.push(`${round(x)} ${round(mid - reach)}`);
    bottom.unshift(`${round(x)} ${round(mid + reach)}`);
  }
  return `M${top.join(' L')} L${bottom.join(' L')} Z`;
}

/** A Text's attributes (its class and `data-*`). */
function text(props: TextModelProps): Record<string, string | undefined> {
  const view = textView(props);
  return { class: view.className, ...view.attrs };
}

/** One cue flag: its marker at `at`, its label under it, and its press. */
function cueView(cue: LiveCue, form: StemLanesForm, pressable: boolean): Node {
  const label =
    form === 'stacked'
      ? null
      : h('span', { ...text({ role: 'caption', case: 'label', leading: 'tight', className: 'yh-stemlanes__cue-label' }), 'data-part': 'label' }, cue.label);
  return wire(
    h(
      'button',
      {
        type: 'button',
        class: `yh-stemlanes__cue ${focusRing}`,
        'data-part': 'cue',
        'data-cue': cue.id,
        style: styleText({ '--yh-stem-at': String(clamp01(cue.at)) }),
        'aria-label': `Cue ${cue.label}`,
        disabled: pressable ? undefined : '',
      },
      label,
    ),
    { on: { click: `cue:${cue.id}` } },
  );
}

/** One lane: its hue mark, name, mirrored envelope and the M / S pair (`onToggle`, by stem id). */
function laneView(stem: LiveStem, selected: string | undefined, pressable: boolean): Node {
  const lamp = (which: 'M' | 'S'): Child =>
    component(
      'LampButton',
      {
        label: which,
        on: which === 'M' ? stem.muted === true : stem.soloed === true,
        size: 'sm',
        name: which === 'M' ? `Mute ${stem.name}` : `Solo ${stem.name}`,
        disabled: !pressable,
      },
      { on: { onToggle: `toggle:${stem.id}` } },
    );
  return h(
    'li',
    {
      class: 'yh-stemlanes__lane',
      'data-part': 'lane',
      'data-stem': stem.id,
      'data-hue': String(stem.hue),
      'data-muted': stem.muted ? 'true' : undefined,
      'data-soloed': stem.soloed ? 'true' : undefined,
      'data-selected': stem.id === selected ? 'true' : undefined,
    },
    h('span', { class: 'yh-stemlanes__mark', 'data-part': 'mark', 'aria-hidden': 'true' }),
    h(
      'span',
      {
        ...text({ role: 'label', weight: 'strong', leading: 'tight', truncate: true, tone: stem.muted ? 'muted' : undefined, className: 'yh-stemlanes__name' }),
        'data-part': 'name',
      },
      stem.name,
    ),
    h(
      'svg',
      {
        class: 'yh-stemlanes__peaks',
        'data-part': 'peaks',
        viewBox: '0 0 100 100',
        preserveAspectRatio: 'none',
        'aria-hidden': 'true',
        focusable: 'false',
      },
      h('path', { class: 'yh-stemlanes__envelope', d: envelopePath(stem.peaks), 'vector-effect': 'non-scaling-stroke' }),
    ),
    h('span', { class: 'yh-stemlanes__keys', 'data-part': 'keys' }, lamp('M'), lamp('S')),
  );
}

/**
 * The tree StemLanes draws in its chosen `form`: the plate (a Surface's raised layer), the shared
 * ruler (the loop window, the playhead and the cue flags) and the lanes in the same four-column
 * grid, so a cue's time lines up with the envelope under it. Callbacks are by key: `cue:<id>` and
 * `toggle:<stem>` (`stemLanesHandlers`). `form` is the binding's (`useForm` / `getForm`).
 */
export function stemLanesView(props: StemLanesModelProps, form: StemLanesForm): Node {
  const { stems, cues = [], window: loop, position, selected, onCue, onToggle } = props;
  const pressable = onToggle !== undefined;
  const lanes = form === 'one' ? [stems.find((stem) => stem.id === selected) ?? stems[0]].filter((stem): stem is LiveStem => stem !== undefined) : stems;
  const size = STEM_LANES_SIZE[form];
  const plate = surfaceView({ layer: 'raised', radius: 'card', className: 'yh-stemlanes' });

  const track = h(
    'span',
    { class: 'yh-stemlanes__track', 'data-part': 'track' },
    when(loop !== undefined, () =>
      h('span', {
        class: 'yh-stemlanes__window',
        'data-part': 'window',
        'aria-hidden': 'true',
        style: styleText({ '--yh-stem-start': String(clamp01(loop!.start)), '--yh-stem-end': String(clamp01(loop!.end)) }),
      }),
    ),
    when(position !== undefined, () =>
      h('span', {
        class: 'yh-stemlanes__playhead',
        'data-part': 'playhead',
        'aria-hidden': 'true',
        style: styleText({ '--yh-stem-position': String(clamp01(position!)) }),
      }),
    ),
    each(cues, (cue) => `cue:${cue.id}`, (cue) => cueView(cue, form, onCue !== undefined)),
  );

  const ruler = h('div', { class: 'yh-stemlanes__ruler', 'data-part': 'ruler', role: 'group', 'aria-label': 'Cues and loop' }, track);

  const body: Child | null =
    lanes.length === 0
      ? h('span', { ...text({ role: 'caption', tone: 'muted', className: 'yh-stemlanes__empty' }), 'data-part': 'empty' }, 'No stems')
      : h(
          'ul',
          { class: 'yh-stemlanes__lane-list', 'data-part': 'lanes' },
          each(lanes, (stem) => `lane:${stem.id}`, (stem) => laneView(stem, selected, pressable)),
        );

  return h(
    'div',
    {
      class: plate.className,
      ...plate.attrs,
      'data-part': 'root',
      'data-form': form,
      role: 'group',
      'aria-label': 'Stem lanes',
      style: styleText({
        '--yh-stem-ruler-h': size.ruler,
        '--yh-stem-lane-h': size.lane,
        '--yh-stem-mark-w': size.mark,
        '--yh-stem-name-w': size.name,
        '--yh-stem-keys-w': size.keys,
        '--yh-stem-pad': size.pad,
        '--yh-stem-gap': size.gap,
      }),
    },
    ruler,
    body,
  );
}

/** The callbacks `stemLanesView`'s tree names: each cue's press (`cue:<id>`) and each lane's
 *  M / S pair (`toggle:<stem>`), both carrying their id. */
export function stemLanesHandlers(props: StemLanesModelProps): Handlers {
  const handlers: Handlers = {};
  for (const cue of props.cues ?? []) handlers[`cue:${cue.id}`] = () => props.onCue?.(cue.id);
  for (const stem of props.stems) handlers[`toggle:${stem.id}`] = () => props.onToggle?.(stem.id);
  return handlers;
}
