import { h, when, wire, type Handlers, type Node } from '../../view/Tree.model';
import { paramSurface } from '../gesture/paramGesture';
import { format } from '../param/format';
import { fractionOf, type Param } from '../param/param';
import { DIAL_VIEWBOX_HEIGHT, DIAL_VIEWBOX_TOP, dialAngle, dialArc, dialPoint } from './arc';
import { defaultOrigin, originFraction, type FillOrigin } from './fill';
import { widgetView, type WidgetProps } from './Widget.model';

export interface KnobProps extends WidgetProps {
  param: Param;
  value: number;
  onChange(next: number): void;
  onRelease?(): void;
  display?: string;
  origin?: FillOrigin;
  showValue?: boolean;
  travel?: number;
}
export function knobView(props: KnobProps): Node {
  const { param, value, disabled = false, display, label, name = param.shortName ?? param.name, origin = defaultOrigin(param), showValue = true, travel } = props;
  const angle = dialAngle(fractionOf(param, value));
  const fill = dialArc(dialAngle(originFraction(param, origin)), angle);
  const [nx, ny] = dialPoint(angle, 6);
  const [mx, my] = dialPoint(angle, 13.5);
  const dial = wire(h('div', { class: 'wdg-knob-dial', ...paramSurface({ ...props, label: label ?? name }) },
    h('svg', { viewBox: `0 ${DIAL_VIEWBOX_TOP} 40 ${DIAL_VIEWBOX_HEIGHT}`, 'aria-hidden': 'true' },
      h('path', { class: 'wdg-knob-empty', d: dialArc(dialAngle(0), dialAngle(1)) ?? undefined }),
      when(fill !== null, () => h('path', { class: 'wdg-knob-fill', d: fill! })),
      h('line', { class: 'wdg-knob-marker', x1: String(nx), y1: String(ny), x2: String(mx), y2: String(my) }),
    )), { bind: [['musicParamGesture', { param, value, disabled, axis: 'vertical', travel, pointerFocus: true, onChange: 'change', onRelease: 'release' }]] });
  return widgetView({ ...props, name, kind: 'knob', readout: showValue ? display ?? format(param, value) : undefined }, [dial]);
}
export function knobHandlers(props: KnobProps): Handlers { return { change: props.onChange, release: props.onRelease }; }
