// Radio as the DOM renderer draws it: the same tree and handlers as `Radio.tsx` and `Radio.svelte`.
import { domPart } from '../../foundation/view/dom';
import type { DomFill } from '../../foundation/view/Tree.dom';
import { radioHandlers, radioView, type RadioModelProps } from './Radio.model';
import '../../primitives/Text/Text.css';
import '../Toggle/size.css';
import '../Checkbox/Checkbox.css';
import './Radio.css';

export const RadioDom = domPart<RadioModelProps & { children?: DomFill }>({ events: ['onChange'], value: { prop: 'checked', on: 'onChange' } }, ({ children, ...props }, use) => {
  const mixed = use.state(props.defaultChecked === 'mixed');
  return { tree: radioView(props, { label: children !== undefined }, mixed.get()), slots: { children }, handlers: radioHandlers(props, mixed.set) };
});
