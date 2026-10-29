import { h, slot, type Node } from '../view/Tree.model';
import { styleAttr, type StyleInput } from '../view/style';

export interface MusicScopeProps {
  as?: 'div' | 'span';
  className?: string;
  style?: StyleInput;
}

/** A CSS vocabulary boundary only: the surrounding Zen ThemeScope remains the theme owner. */
export function musicScopeView({ as = 'div', className, style }: MusicScopeProps): Node {
  return h(as, { class: `zen-music wdg${className ? ` ${className}` : ''}`, style: styleAttr(style) }, slot('children'));
}
