import { h, slot, styleText, when, wire, type Child, type Node } from '../../view/Tree.model';
import type { Param } from '../param/param';
import { hintAttribute } from './hint';
import { reserved } from './reserve';
import type { WakeOptions } from './wake';

export type WidgetLayout = 'stacked' | 'inline' | 'inside';
export type WidgetSide = 'left' | 'right';
export type WidgetVars = Record<`--wdg-${string}`, string | number>;
export interface WidgetProps {
  name?: string;
  label?: string;
  layout?: WidgetLayout;
  side?: WidgetSide;
  disabled?: boolean;
  className?: string;
  title?: string;
  hint?: string;
  ink?: string;
  driver?: string;
}
export interface WidgetModelProps extends WidgetProps {
  kind: string;
  param?: Param;
  readout?: string | number;
  vars?: WidgetVars;
  wake?: WakeOptions;
}

/** The source's three regions, shared without changing their classes or placement. */
export function widgetView(
  { kind, param, name, readout, layout = 'stacked', side = 'left', disabled = false, vars, className, title, hint, ink, driver, wake }: WidgetModelProps,
  body: (Child | null)[] = [slot('children')],
  slots: { readout?: boolean } = {},
): Node {
  const inked = ink === undefined ? {} : { '--wdg-fill': ink, '--wdg-marker': ink };
  const root = h('div', {
    class: `wdg wdg-widget wdg-${kind}${className ? ` ${className}` : ''}`,
    'data-layout': layout, 'data-side': layout === 'inline' ? side : undefined,
    'data-disabled': disabled ? '' : undefined, ...hintAttribute(hint),
    style: styleText(Object.fromEntries(Object.entries({ ...reserved(param), ...inked, ...vars }).map(([key, value]) => [key, String(value)]))),
  },
  when(!!name, () => h('span', { class: 'wdg-caption' }, name, when(!!driver, () => h('span', { class: 'wdg-driver' }, `← ${driver}`)))),
  h('div', { class: 'wdg-body', title }, body),
  when(readout !== undefined || !!slots.readout, () => h('span', { class: 'wdg-readout' }, slots.readout ? slot('readout') : String(readout))),
  );
  return wake === undefined ? root : wire(root, { bind: [['musicWake', wake]] });
}
