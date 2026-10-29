import { h, type Node } from '../../view/Tree.model';
import { widgetView, type WidgetProps } from '../controls/Widget.model';

/** Read-only level display. The public names and anatomy match widgets' Meter. */
export interface MeterProps extends Omit<WidgetProps, 'disabled'> {
  value: number;
  peak?: number;
  orientation?: 'horizontal' | 'vertical';
  display?: string;
  showValue?: boolean;
  width?: number;
  length?: number;
}

export const meterLevel = (value: number) => Number.isFinite(value) ? Math.max(0, Math.min(1, value)) : 0;

export function meterView(props: MeterProps): Node {
  const level = meterLevel(props.value);
  const held = props.peak === undefined ? undefined : meterLevel(props.peak);
  return widgetView({
    kind: 'meter', name: props.name, layout: props.layout, side: props.side,
    className: props.className, title: props.title, hint: props.hint, ink: props.ink,
    readout: props.showValue ? props.display ?? String(Math.round(level * 100)) : undefined,
    vars: {
      ...(props.width === undefined ? {} : { '--wdg-meter-width': `${props.width}px` }),
      ...(props.length === undefined ? {} : { '--wdg-meter-length': `${props.length}px` }),
      '--wdg-meter-fill': level,
      ...(held === undefined ? {} : { '--wdg-meter-peak': held }),
    },
  }, [
    h('div', {
      class: `wdg-meter-body wdg-body wdg-meter-${props.orientation ?? 'horizontal'}`,
      role: 'meter',
      'aria-valuenow': String(Math.round(level * 100)),
      'aria-valuemin': '0',
      'aria-valuemax': '100',
      'aria-label': props.label ?? props.name,
    }, h('i', { class: 'wdg-meter-level' }), held === undefined ? null : h('i', { class: 'wdg-meter-hold' })),
  ]);
}
