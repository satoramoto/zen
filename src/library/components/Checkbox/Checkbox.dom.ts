// Checkbox as the DOM renderer draws it: the same tree and handlers as `Checkbox.tsx` and `Checkbox.svelte`.
import { domPart } from '../../foundation/view/dom';
import type { DomFill } from '../../foundation/view/Tree.dom';
import { checkboxHandlers, checkboxView, type CheckModelProps } from './Checkbox.model';
import '../../primitives/Text/Text.css';
import '../Toggle/size.css';
import './Checkbox.css';

export const CheckboxDom = domPart<CheckModelProps & { children?: DomFill }>({ events: ['onChange'], value: { prop: 'checked', on: 'onChange' } }, ({ children, ...props }) => ({
  tree: checkboxView(props, { label: children !== undefined }),
  slots: { children },
  handlers: checkboxHandlers(props),
}));
