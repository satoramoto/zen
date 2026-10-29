import { h, slot, styleText, when, type Handlers, type Node } from '../../view/Tree.model';
import { buttonFaceView } from './ButtonFace.model';

export interface ToggleModelProps {
  on: boolean;
  onChange?(next: boolean): void;
  disabled?: boolean;
  label?: string;
  name?: string;
  momentary?: boolean;
  width?: number;
  layout?: 'stacked' | 'inside';
  className?: string;
  title?: string;
  hint?: string;
  ink?: string;
}

export function toggleView({ on, disabled = false, label, name, momentary = false, width, layout = 'stacked', className, title, hint, ink }: ToggleModelProps, hasChildren = true): Node {
  const inside = layout === 'inside';
  const face = buttonFaceView({ lit: on, 'aria-pressed': momentary ? undefined : on, 'aria-label': label ?? name, disabled, title });
  face.children = inside ? [] : [slot('children')];
  if (momentary) face.bind = [['musicToggleMomentary', { disabled, onHold: 'change' }]];
  else face.on = { click: 'toggle' };
  return h('div', {
    class: `wdg${inside ? ' wdg-widget' : ''} wdg-toggle${className ? ` ${className}` : ''}`,
    'data-hint': hint,
    'data-layout': inside ? 'inside' : undefined,
    'data-on': inside && on ? '' : undefined,
    'data-disabled': inside && disabled ? '' : undefined,
    style: styleText({ '--wdg-toggle-width': width === undefined ? undefined : `${width}px`, '--wdg-fill': ink }),
  }, when(!!name, () => h('span', { class: 'wdg-caption' }, name!)), face,
  when(inside && hasChildren, () => h('span', { class: 'wdg-readout' }, slot('children'))));
}

export function toggleHandlers(props: ToggleModelProps): Handlers {
  return { change: props.onChange, toggle: () => { if (!props.disabled) props.onChange?.(!props.on); } };
}
