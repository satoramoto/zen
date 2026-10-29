import { h, slot, styleText, when, type Handlers, type Node } from '../../view/Tree.model';
import { buttonFaceView } from './ButtonFace.model';

export interface ButtonModelProps {
  onPress?(event: MouseEvent): void;
  disabled?: boolean;
  label?: string;
  name?: string;
  tone?: 'normal' | 'quiet' | 'danger';
  width?: number;
  className?: string;
  title?: string;
  hint?: string;
}

export function buttonView({ disabled = false, label, name, tone = 'normal', width, className, title, hint }: ButtonModelProps): Node {
  const face = buttonFaceView({ tone, 'aria-label': label ?? name, disabled, title });
  face.on = { click: 'press' };
  face.children = [slot('children')];
  return h('div', {
    class: `wdg wdg-button${className ? ` ${className}` : ''}`,
    'data-hint': hint,
    style: styleText({ '--wdg-button-width': width === undefined ? undefined : `${width}px` }),
  }, when(!!name, () => h('span', { class: 'wdg-caption' }, name!)), face);
}

export const buttonHandlers = (props: ButtonModelProps): Handlers => ({ press: props.disabled ? undefined : props.onPress });
