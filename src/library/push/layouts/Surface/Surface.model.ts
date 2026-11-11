// The Surface's model: the whole unit, or one of its regions, drawn from the layout table
// (`model/layout.ts`) as one absolutely placed tree that scales by a single property (design D4).
// No framework: `Surface.tsx` and `Surface.svelte` both pass `surfaceView` and `surfaceHandlers`
// to their `Tree`.
//
// Every control is an existing component in a cell the surface owns (docs/push.md, "The fit
// review"): a button or a pad is a `Pad`, a rotary control a `KnobReadout`, the touch strip a
// `Slider`, the display a `PushDisplay`. The cell says where it is and how its lamp is lit, by
// restating the variables those components already read (`--hue-1` for a fill, `--text-1` for a
// legend); the components gain nothing. Input is the `pushSurface` store on the root.
import { lampShadeCss, lampVar, lampVars } from '../../../foundation/themes/lamps';
import { component, h, styleText, wire, type Child, type ChildArg, type Handlers, type Node } from '../../../foundation/view/Tree.model';
import { BODY, CONTROLS, controlsIn, regionBox, type Control, type Region } from '../../model/layout';
import type { Lamp, LampMeaning, PushInput, Screen, StripLamps, Unit } from '../../model/types';
import type { Beat } from './lampClock';
import type { Sensitivity } from './padInput';
import type { SurfaceInputParams } from './surfaceInput';

export interface SurfaceModelProps {
  /** Every control's lamp, by id, as `project` gives them. A control with none is unlit. */
  lamps?: Record<string, Lamp>;
  /** What the display shows. */
  screen?: Screen;
  /** The touch strip's lamps. */
  strip?: StripLamps;
  /** One region alone: the display block, the pad block, the left column or the right. Default: the whole unit. */
  region?: Region;
  /** LED brightness and display light, each 0 to 100. Default 100. */
  ledBrightness?: number;
  displayLight?: number;
  /** The display keeps a dark ground whatever the mode. Default true. */
  darkDisplay?: boolean;
  /** The beat pulsing and blinking lamps follow; without one they animate at a fixed rate. */
  beat?: Beat;
  /** The pads' expression settings and velocity curve, from the unit's readings. */
  expression?: Pick<Unit['expression'], 'inTune' | 'inTuneWidth' | 'slideRange' | 'trace'>;
  sensitivity?: Sensitivity;
  /** Called with every input a person makes. The surface changes nothing else itself. */
  onInput?: (input: PushInput) => void;
  /** Classes added to the root. */
  className?: string;
}

/** The colour a meaning takes: the pack's own meaning colours, so a pack can restate them. */
const MEANING: Record<LampMeaning, string> = {
  white: 'var(--push-white)',
  play: 'var(--success)',
  queue: 'var(--success)',
  note: 'var(--success)',
  record: 'var(--danger)',
  stop: 'var(--danger)',
  select: 'var(--push-select)',
  solo: 'var(--push-solo)',
  root: 'var(--push-solo)',
  mute: 'var(--warning)',
  warn: 'var(--warning)',
  accent: 'var(--accent)',
};

/** A lamp's colour as CSS: a table colour or a meaning's, in the shade asked for (dim by default when the lamp is dim). */
export function lampCss(lamp: Lamp): string {
  const base = typeof lamp.colour === 'number' ? lampVar(lamp.colour) : MEANING[lamp.colour ?? 'white'];
  return lampShadeCss(base, lamp.shade ?? (lamp.state === 'dim' ? 'dim' : 'lit'), 'var(--push-unlit)');
}

/** Controls whose whole cap lights in a colour (pads, display buttons, scene buttons); the others light their legend. */
export const fillsCap = (c: Control) => c.kind === 'pad' || c.cluster === 'upper' || c.cluster === 'lower' || c.cluster === 'scenes';

const UNLIT: Lamp = { state: 'off' };

function cell(c: Control, origin: { x: number; y: number }, lamp: Lamp, inner: ChildArg): Node {
  return h(
    'div',
    {
      class: 'push-surface__cell',
      'data-control': c.id,
      'data-kind': c.kind,
      'data-cluster': c.cluster,
      'data-round': c.round ? 'true' : undefined,
      'data-row': c.row === undefined ? undefined : String(c.row),
      'data-col': c.col === undefined ? undefined : String(c.col),
      'data-lamp': c.lamp === 'none' ? undefined : lamp.state,
      'data-cap': fillsCap(c) ? 'fill' : c.kind === 'button' ? 'legend' : undefined,
      // A legend that is a sign, not a word, is printed larger, as the unit's icons are.
      'data-sign': c.legend !== '' && !/[A-Za-z0-9]/.test(c.legend) ? 'true' : undefined,
      style: styleText({
        '--x': String(Math.round((c.x - origin.x) * 10) / 10),
        '--y': String(Math.round((c.y - origin.y) * 10) / 10),
        '--w': String(c.w),
        '--h': String(c.h),
        '--push-lamp': lamp.state === 'off' || c.lamp === 'none' ? undefined : lampCss(lamp),
      }),
    },
    inner,
  );
}

/** A button or a pad: a `Pad` filling its cell, lit as a solid cap where the unit lights the cap. */
function key(c: Control, lamp: Lamp): Child {
  const lit = fillsCap(c) && lamp.state !== 'off';
  return component('Pad', { label: c.legend, name: c.name, fillCell: true, state: lit ? 'playing' : 'idle', ...(lit ? { hue: 1 } : {}) });
}

/** The touch strip as a `Slider`: a level from the bottom, a bend from the middle, or the part in view. */
const STRIP = { kind: 'float', min: 0, max: 1, defaultValue: 0, name: 'Touch strip' } as const;
const BEND = { kind: 'float', min: -1, max: 1, defaultValue: 0, name: 'Touch strip' } as const;
function strip(lamps: StripLamps): Child {
  const common = { orientation: 'vertical', length: 'auto', showValue: false, name: '', label: 'Touch strip', ink: 'var(--push-lit)' } as const;
  const on = { on: { onChange: 'none' } };
  if (lamps.kind === 'bend') return component('Slider', { ...common, param: BEND, value: lamps.value, origin: 'center' }, on);
  if (lamps.kind === 'level') return component('Slider', { ...common, param: STRIP, value: lamps.value }, on);
  if (lamps.kind === 'range') return component('Slider', { ...common, param: STRIP, value: lamps.from, depth: lamps.to - lamps.from, fill: false }, on);
  return component('Slider', { ...common, param: STRIP, value: 0, fill: false, mixed: true, display: 'Off' }, on);
}

/** A rotary control: a bare `KnobReadout`. It shows no position of its own. */
const knob = (c: Control): Child => component('KnobReadout', { label: '', name: c.name, value: '' }, { on: { onstep: `step:${c.id}`, onpress: `press:${c.id}` } });

/** The jog wheel: the knob, and a key either side to nudge it left and right. */
function jog(c: Control): Child[] {
  const nudge = (value: -1 | 1) =>
    h('span', { class: 'push-surface__nudge', 'data-nudge': String(value), 'data-side': value < 0 ? 'left' : 'right' }, component('Pad', { label: value < 0 ? '◂' : '▸', name: `Jog wheel nudge ${value < 0 ? 'left' : 'right'}`, fillCell: true }));
  return [knob(c), nudge(-1), nudge(1)];
}

function inner(c: Control, props: SurfaceModelProps, lamp: Lamp): ChildArg {
  if (c.kind === 'pad') return [key(c, lamp), h('span', { class: 'push-surface__touch', 'aria-hidden': 'true' })];
  if (c.kind === 'button') return key(c, lamp);
  if (c.kind === 'encoder') return knob(c);
  if (c.kind === 'wheel') return jog(c);
  if (c.kind === 'strip') return strip(props.strip ?? { kind: 'off' });
  return h('div', { class: 'push-surface__glass', role: 'img', 'aria-label': c.name });
}

const percent = (n: number | undefined) => String(Math.min(100, Math.max(0, n ?? 100)) / 100);

/** The tree Surface draws: the frame (which scrolls below the smallest size), the face, and a cell per control. */
export function surfaceView(props: SurfaceModelProps): Node {
  const { lamps = {}, region, expression, className } = props;
  const controls = region ? controlsIn(region) : CONTROLS;
  const box = region ? regionBox(region) : { x: 0, y: 0, w: BODY.width, h: BODY.height };
  const animate = controls.some((c) => lamps[c.id]?.state === 'pulse' || lamps[c.id]?.state === 'blink');
  const store: Omit<SurfaceInputParams, 'onInput'> & { onInput: string } = {
    onInput: 'input',
    sensitivity: props.sensitivity,
    inTune: expression?.inTune,
    inTuneWidth: expression?.inTuneWidth,
    slideRange: expression?.slideRange,
    beat: props.beat,
    animate,
  };
  return wire(
    h(
      'div',
      {
        class: ['push-surface', className].filter(Boolean).join(' '),
        'data-region': region ?? 'whole',
        'data-trace': expression?.trace ? 'true' : undefined,
        'data-dark-display': props.darkDisplay === false ? undefined : 'true',
        role: 'group',
        'aria-label': region ? `Push, ${region}` : 'Push',
        style: styleText({ '--push-w': String(box.w), '--push-h': String(box.h), '--push-led': percent(props.ledBrightness), '--push-light': percent(props.displayLight) }),
      },
      h(
        'div',
        { class: 'push-surface__face', style: styleText(lampVars()) },
        ...controls.map((c) => {
          const lamp = lamps[c.id] ?? UNLIT;
          return cell(c, box, lamp, inner(c, props, lamp));
        }),
      ),
    ),
    { bind: [['pushSurface', store]] },
  );
}

const PRESSES = new Set(['volume', 'tempo', 'jog']);

/** The callbacks `surfaceView`'s tree names: every input, and each rotary control's turn and press. */
export function surfaceHandlers(props: SurfaceModelProps): Handlers {
  const now = () => (typeof performance === 'undefined' ? Date.now() : performance.now());
  const handlers: Handlers = { input: props.onInput, none: () => {} };
  for (const c of CONTROLS) {
    if (c.kind !== 'encoder' && c.kind !== 'wheel') continue;
    handlers[`step:${c.id}`] = (delta: number) => props.onInput?.({ control: c.id, kind: 'turn', time: now(), value: delta });
    handlers[`press:${c.id}`] = () => {
      // Only the Volume encoder, the Swing & Tempo encoder and the jog wheel press.
      if (!PRESSES.has(c.id)) return;
      const time = now();
      props.onInput?.({ control: c.id, kind: 'down', time });
      props.onInput?.({ control: c.id, kind: 'up', time });
    };
  }
  return handlers;
}
