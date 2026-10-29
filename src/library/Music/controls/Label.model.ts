import { h, slot, type Node } from '../../view/Tree.model';

export interface LabelModelProps { heading?: boolean; className?: string; hint?: string }
export interface DividerModelProps { orientation?: 'horizontal' | 'vertical'; className?: string }
export function labelView({ heading = false, className, hint }: LabelModelProps): Node {
  return h('span', { class: `wdg wdg-label${heading ? ' wdg-label-heading' : ''}${className ? ` ${className}` : ''}`, 'data-hint': hint }, slot('children'));
}
export function dividerView({ orientation = 'horizontal', className }: DividerModelProps): Node {
  return h('span', { class: `wdg wdg-divider wdg-divider-${orientation}${className ? ` ${className}` : ''}`, role: 'separator', 'aria-orientation': orientation });
}
