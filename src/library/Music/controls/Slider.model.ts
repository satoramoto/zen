import { h, when, wire, type Handlers, type Node } from '../../view/Tree.model';
import { paramSurface } from '../gesture/paramGesture';
import { format } from '../param/format';
import { fractionOf, type Param } from '../param/param';
import { defaultOrigin, fillFrom, type FillOrigin } from './fill';
import { WAKE_MARKS } from './wake';
import { widgetView, type WidgetProps } from './Widget.model';

export interface SliderProps extends WidgetProps {
  param: Param;
  value: number;
  onChange(next: number): void;
  onRelease?(): void;
  depth?: number;
  onDepth?(next: number): void;
  live?: number;
  display?: string;
  orientation?: 'vertical' | 'horizontal';
  fill?: boolean;
  origin?: FillOrigin;
  showValue?: boolean;
  length?: number | 'auto';
  travel?: number;
}
export function sliderView(props: SliderProps): Node {
  const { param, value, depth, onDepth, live, disabled = false, display, label, name = param.shortName ?? param.name, orientation = 'vertical', fill, origin = defaultOrigin(param), showValue = true, length = 27, travel, layout, className } = props;
  const fraction = fractionOf(param, value);
  const text = display ?? format(param, value);
  const reach = depth ?? 0;
  const far = Math.max(0, Math.min(1, fraction + reach));
  const span = onDepth === undefined || reach === 0 ? null : { at: Math.min(fraction, far), size: Math.abs(far - fraction) };
  const body = wire(h('div', { class: 'wdg-slider-body', ...paramSurface({ ...props, axis: orientation, label: label ?? name }) },
    when(fill ?? layout !== 'inside', () => h('span', { class: 'wdg-slider-fill', 'aria-hidden': 'true' })),
    when(span !== null, () => h('span', { class: 'wdg-slider-span', 'aria-hidden': 'true' })),
    when(span !== null, () => h('span', { class: 'wdg-slider-reach', 'aria-hidden': 'true' })),
    when(span !== null && live !== undefined, () => Array.from({ length: WAKE_MARKS }, (_, at) => ({ ...h('span', { class: 'wdg-slider-wake', 'data-wake': String(at), 'aria-hidden': 'true' }), key: String(at) }))),
    h('span', { class: 'wdg-slider-thumb', 'aria-hidden': 'true' }),
  ), { bind: [['musicParamGesture', { param, value, depth, disabled, axis: orientation, travel: travel ?? (length === 'auto' ? 'element' : layout === 'inside' ? undefined : length), onChange: 'change', onRelease: 'release', onDepth: onDepth === undefined ? undefined : 'depth' }]] });
  return widgetView({ ...props, name, kind: 'slider', className: `wdg-slider-${orientation}${className ? ` ${className}` : ''}`, readout: showValue ? text : undefined,
    wake: { live: span === null ? undefined : live, reading: layout === 'inside' ? text : undefined },
    vars: {
      '--wdg-slider-length': length === 'auto' ? 'auto' : `${length}px`, ...fillFrom(param, origin, fraction),
      ...(span === null ? {} : { '--wdg-span-at': span.at, '--wdg-span-size': span.size, '--wdg-span-reach': far }),
      ...(live === undefined ? {} : { '--wdg-live': Math.max(0, Math.min(1, live)) }),
    },
  }, [body]);
}
export function sliderHandlers(props: SliderProps): Handlers { return { change: props.onChange, release: props.onRelease, depth: props.onDepth }; }
