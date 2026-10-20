// Slider's model: its props, the tree it draws from them (and from the typed readout's view state)
// and the handlers that tree names. No framework: `Slider.tsx` (React) and `Slider.svelte` (Svelte)
// both pass `sliderView` and `sliderHandlers` to their `Tree`. The drag, double-click and keys are
// the `paramGesture` store (`../Param/paramGesture.ts`) on the track; the typed readout is the
// `sliderEntry` store (`sliderEntry.ts`) on the root, both registered in `src/library/view/stores.ts`.
import { defaultOrigin, fillFrom, hintAttribute, reservedVars, type FillOrigin } from '../Param/fill';
import { clamp, fractionOf, type Param } from '../Param/param';
import { gestureText, type ParamKeyStep } from '../Param/paramGesture';
import { focusRing } from '../../../primitives/Ring';
import { surfaceNode } from '../../../primitives/Surface.model';
import { textNode } from '../../../primitives/Text.model';
import { each, h, styleText, when, wire, type Handlers, type Node } from '../../../view/Tree.model';

/**
 * Caption above the control, beside it, or laid over a horizontal track; or `row`, Apple's slider
 * (HIG Sliders): the caption at the leading edge and the reading at the trailing edge on one line,
 * over a thin groove the full width with a knob that stands proud of it. `row` is horizontal only.
 */
export type SliderLayout = 'stacked' | 'inline' | 'inside' | 'row';
/** Which side of the control the caption and reading sit on, laid inline. */
export type SliderSide = 'left' | 'right';

/** How a typed readout reads and writes text, both in the parameter's units. */
export interface SliderTyping {
  /** The typed text as a value, or `null` to ignore it (nothing is set). Default: a plain number. */
  parse?(text: string): number | null;
  /** The text the field opens with. Default: the value as a plain number. */
  format?(value: number): string;
}

/** The default typing: a plain number in, the value's plain number out. */
const plainNumber = (text: string): number | null => {
  const n = Number.parseFloat(text.replace('−', '-'));
  return Number.isFinite(n) ? n : null;
};
const plainText = (value: number) => String(Number(value.toPrecision(6)));

/** `live.slider`: the knob's gesture, laid out straight. Mirrors `@openflow/widgets` Slider. */
export interface SliderModelProps {
  param: Param;
  value: number;
  onChange(next: number): void;
  onRelease?(): void;
  /** How far something else may carry this control, signed, drawn as a span; shift drags it with `onDepth`. */
  depth?: number;
  onDepth?(next: number): void;
  /** Where the thing driving this control has it now, 0–1, drawn as a mark inside the span. */
  live?: number;
  /** Authoritative text; wins over the parameter's own formatting. */
  display?: string;
  /** Which way the track runs, and so which way the drag goes. */
  orientation?: 'vertical' | 'horizontal';
  /** Whether the value is drawn as a filled length as well as a mark. Default: yes, except `inside`. */
  fill?: boolean;
  /** Where the fill grows from. Defaults to the middle when zero is the middle. */
  origin?: FillOrigin;
  showValue?: boolean;
  /** Length along the axis in px, or `auto` to fill the available space. */
  length?: number | 'auto';
  /** Pixels of drag for the full range. Defaults to the drawn length. */
  travel?: number;
  /** The printed caption. Defaults to the parameter's short name, then its name. */
  name?: string;
  /** For assistive technology. Defaults to the caption. */
  label?: string;
  layout?: SliderLayout;
  side?: SliderSide;
  disabled?: boolean;
  className?: string;
  title?: string;
  /** A sentence for the window's hint strip, on the root as `data-hint`. Falls back to `title`. */
  hint?: string;
  /** The colour the fill and thumb mark are lit in (any CSS colour, usually a `var()`). Default `--accent`. */
  ink?: string;
  /** Across the track in px. Default: the material's track thickness. */
  width?: number;
  /** What is moving this control (an LFO, a cord's source), printed after the caption as
   *  `← {driver}` in the fill ink, so the row says who carries it without the cord being traced. */
  driver?: string;
  /**
   * No single value (several things that differ): no thumb or fill, `data-mixed` on the root, ARIA
   * without `aria-valuenow` and reading `display` (else "Mixed"). `value` is where a drag starts;
   * the first drag, key or double-click calls `onChange`, even onto `value`. A press and release
   * without moving leaves it mixed, and Escape mid-drag writes nothing back.
   */
  mixed?: boolean;
  /** Values marked on the track with a tick; the one at the default is drawn taller and brighter. */
  detents?: readonly number[];
  /** How near a detent (in the parameter's units) a drag must come to land on it. Default 0: no catch. */
  snap?: number;
  /** The keys' own next values, asked before the default steps (`stepDetent` steps through detents). */
  keyStep?: ParamKeyStep;
  /** A word under each of `detents` (`½×`, `1×`, `2×`), in line with its tick; the default's in full
   *  ink. Horizontal (`stacked` or `row`) only. */
  detentLabel?(value: number): string;
  /** The readout takes a typed value: click it (or Enter / Space on it) to type, Enter sets it,
   *  Escape leaves it as it was, leaving the field sets it. `true` reads a plain number; pass
   *  `parse` / `format` for other text (in the parameter's units). The value is clamped to the
   *  range, set through `onChange` then `onRelease`. Needs `showValue`. */
  typed?: boolean | SliderTyping;
}

/** The typed readout's view state: the text being typed, or null while the readout shows. */
export type SliderEntry = string | null;

/** `typed` as its typing, or null when the readout takes none. */
const typingOf = (typed: SliderModelProps['typed']): SliderTyping | null =>
  typed === undefined || typed === false ? null : typed === true ? {} : typed;

/** A style map's numbers as text, for `styleText`. */
const text = (style: Record<string, string | number | undefined>): Record<string, string | undefined> =>
  Object.fromEntries(Object.entries(style).map(([k, v]) => [k, v === undefined ? undefined : String(v)]));

/**
 * The tree Slider draws from its props and the typed readout's `entry`: the root (its layout, side,
 * state and the custom properties its CSS reads), the caption (and driver), the frame holding the
 * track (a `well`, the slider itself, binding `paramGesture`) with its fill, span, reach, live mark,
 * detent ticks and thumb, the detent labels, and the readout: a field while typing, a button with
 * `typed`, else the reading. The root binds `sliderEntry` when `typed`.
 */
export function sliderView(props: SliderModelProps, entry: SliderEntry = null): Node {
  const {
    param,
    value,
    depth,
    onDepth,
    live,
    disabled = false,
    display,
    label,
    name = param.shortName ?? param.name,
    orientation = 'vertical',
    fill,
    origin = defaultOrigin(param),
    showValue = true,
    length = 27,
    travel,
    layout = 'stacked',
    side = 'left',
    className,
    title,
    hint,
    ink,
    width,
    driver,
    mixed = false,
    detents,
    snap,
    detentLabel,
    typed,
  } = props;
  const axis = layout === 'row' ? 'horizontal' : orientation;
  const fraction = fractionOf(param, value);
  const reading = gestureText(param, value, display, mixed);
  const called = label ?? name;
  const typing = typingOf(typed);
  const labelled = detentLabel !== undefined && detents !== undefined && detents.length > 0;

  const reach = depth ?? 0;
  const far = Math.max(0, Math.min(1, fraction + reach));
  const span = onDepth === undefined || reach === 0 ? null : { at: Math.min(fraction, far), size: Math.abs(far - fraction) };

  const filled = !mixed && (fill ?? layout !== 'inside');
  const style = text({
    ...reservedVars(param),
    ...fillFrom(param, origin, fraction),
    '--lib-slider-length': length === 'auto' ? 'auto' : `${length}px`,
    ...(width === undefined ? {} : { '--lib-slider-thickness': `${width}px` }),
    ...(ink === undefined ? {} : { '--lib-slider-ink': ink }),
    ...(span === null ? {} : { '--lib-slider-span-at': span.at, '--lib-slider-span-size': span.size, '--lib-slider-span-reach': far }),
    ...(live === undefined ? {} : { '--lib-slider-live': Math.max(0, Math.min(1, live)) }),
  });
  const detentStyle = (d: number) => styleText({ '--lib-slider-detent': String(fractionOf(param, d)) });
  const atDefault = (d: number) => (d === param.defaultValue ? 'true' : undefined);

  const track = wire(
    surfaceNode(
      { material: 'well', radius: 'pill', className: `lib-slider__track ${focusRing}` },
      {
        'data-part': 'track',
        role: 'slider',
        tabindex: disabled ? '-1' : '0',
        'aria-label': called,
        'aria-valuemin': String(param.min),
        'aria-valuemax': String(param.max),
        'aria-valuenow': mixed ? undefined : String(value),
        'aria-valuetext': reading,
        'aria-orientation': axis,
        'aria-disabled': disabled ? 'true' : undefined,
      },
      when(filled, () => h('span', { class: 'lib-slider__fill', 'data-part': 'fill', 'aria-hidden': 'true' })),
      when(span !== null, () => h('span', { class: 'lib-slider__span', 'data-part': 'span', 'aria-hidden': 'true' })),
      when(span !== null, () => h('span', { class: 'lib-slider__reach', 'data-part': 'reach', 'aria-hidden': 'true' })),
      when(span !== null && live !== undefined, () => h('span', { class: 'lib-slider__live', 'data-part': 'live', 'aria-hidden': 'true' })),
      each(detents ?? [], String, (d) =>
        h('span', { class: 'lib-slider__detent', 'data-part': 'detent', 'data-default': atDefault(d), 'aria-hidden': 'true', style: detentStyle(d) }),
      ),
      // Keyed, so it keeps its element as the detents before it come and go.
      when(!mixed, () => ({
        ...surfaceNode({ as: 'span', material: 'handle', radius: 'pill', className: 'lib-slider__thumb' }, { 'data-part': 'thumb', 'aria-hidden': 'true' }),
        key: 'thumb',
      })),
    ),
    {
      bind: [
        [
          'paramGesture',
          {
            param,
            value,
            depth,
            disabled,
            axis,
            // An `inside` row is stretched to its line, so `length` describes nothing: use the
            // gesture's own travel there, and the element's measured extent for an `auto` one.
            travel: travel ?? (length === 'auto' ? 'element' : layout === 'inside' ? undefined : length),
            mixed,
            detents,
            snap,
            onChange: 'change',
            onRelease: 'release',
            onDepth: 'depth',
            keyStep: 'keyStep',
          },
        ],
      ],
    },
  );

  const readout =
    showValue && typing !== null && entry !== null
      ? textNode(
          { as: 'input', role: 'numeral', size: 'label', className: 'lib-slider__readout lib-slider__entry' },
          {
            type: 'text',
            inputmode: 'decimal',
            'data-part': 'entry',
            'aria-label': `${called}, type a value`,
            value: entry,
            autocomplete: 'off',
            spellcheck: 'false',
          },
        )
      : showValue && typing !== null
        ? textNode(
            { as: 'button', role: 'numeral', size: 'label', className: `lib-slider__readout lib-slider__typed ${focusRing}` },
            {
              type: 'button',
              'data-part': 'readout',
              disabled: disabled ? '' : undefined,
              'aria-label': `${called} ${reading}, type a value`,
              title: 'Type a value',
            },
            reading,
          )
        : when(showValue, () => textNode({ role: 'numeral', size: 'label', className: 'lib-slider__readout' }, { 'data-part': 'readout' }, reading));

  const root = h(
    'div',
    {
      class: `lib-slider${className ? ` ${className}` : ''}`,
      'data-orientation': axis,
      'data-layout': layout,
      'data-side': layout === 'inline' ? side : undefined,
      'data-length': length === 'auto' ? 'auto' : undefined,
      'data-disabled': disabled ? 'true' : undefined,
      'data-mixed': mixed ? 'true' : undefined,
      'data-labels': labelled ? 'true' : undefined,
      ...hintAttribute(hint),
      style: styleText(style),
    },
    when(Boolean(name || driver), () =>
      textNode(
        { role: 'body', size: 'caption', case: 'label', className: 'lib-slider__caption' },
        { 'data-part': 'caption' },
        name ?? '',
        driver ? h('span', { class: 'lib-slider__driver', 'data-part': 'driver' }, `${name ? ' ' : ''}← ${driver}`) : null,
      ),
    ),
    h('div', { class: 'lib-slider__frame', title }, track),
    when(labelled, () =>
      textNode(
        { as: 'div', role: 'body', size: 'caption', leading: 'tight', className: 'lib-slider__labels' },
        { 'data-part': 'labels', 'aria-hidden': 'true' },
        each(detents ?? [], String, (d) =>
          textNode(
            { role: 'body', size: 'caption', leading: 'tight', tabular: true, className: 'lib-slider__detent-label' },
            { 'data-part': 'detent-label', 'data-default': atDefault(d), style: detentStyle(d) },
            detentLabel!(d),
          ),
        ),
      ),
    ),
    readout,
  );
  return typing === null ? root : wire(root, { bind: [['sliderEntry', { open: entry !== null, disabled, start: mixed ? '' : (typing.format ?? plainText)(value), onEntry: 'entry', onCommit: 'commit' }]] });
}

/**
 * The callbacks `sliderView`'s tree names: the value, the release, the depth and the keys' own
 * steps (the gesture), and the typed readout's text (`setEntry`, the binding's view state) and
 * commit (parsed, clamped, set, released).
 */
export function sliderHandlers(props: SliderModelProps, setEntry: (entry: SliderEntry) => void): Handlers {
  const typing = typingOf(props.typed);
  return {
    change: props.onChange,
    release: props.onRelease,
    depth: props.onDepth,
    keyStep: props.keyStep,
    entry: setEntry,
    commit: (typedText: string) => {
      if (typing === null) return;
      const next = (typing.parse ?? plainNumber)(typedText);
      if (next === null) return;
      props.onChange(clamp(props.param, next));
      props.onRelease?.();
    },
  };
}
